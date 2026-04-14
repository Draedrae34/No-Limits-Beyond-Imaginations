#!/usr/bin/env python3
"""Shared NLBL Printify pipeline for catalog generation and sync."""

from __future__ import annotations

import base64
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import requests
from requests import Response
from dotenv import load_dotenv


load_dotenv()

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_ENABLED_VARIANTS_PER_PRODUCT = 100
# Keep upload payloads small; base64 adds ~33% overhead.
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _sleep_backoff(attempt: int) -> None:
    time.sleep(min(8, 2**attempt))


def _request_with_retries(
    method: str,
    url: str,
    *,
    debug: bool = False,
    max_attempts: int = 4,
    timeout_s: int = 60,
    **kwargs: Any,
) -> Response | None:
    for attempt in range(max_attempts):
        try:
            return requests.request(method, url, timeout=timeout_s, **kwargs)
        except requests.exceptions.RequestException as e:
            if debug:
                print(f"[net] {method} {url} attempt {attempt+1}/{max_attempts} failed: {repr(e)}")
            if attempt < max_attempts - 1:
                _sleep_backoff(attempt)
    return None


@dataclass(frozen=True)
class ProductSpec:
    category: str
    blueprint_id: int
    provider_id: int
    price: float
    cost: float
    tags: list[str]


DEFAULT_SPEC = ProductSpec(
    category="T-Shirts",
    blueprint_id=12,
    provider_id=51,
    price=24.99,
    cost=8.50,
    tags=["NLBL", "Galaxy", "Logo"],
)

SPEC_RULES: list[tuple[re.Pattern[str], ProductSpec]] = [
    (
        re.compile(r"(hoodie|zip|sweatshirt)", re.I),
        ProductSpec(
            category="Hoodies",
            blueprint_id=77,
            provider_id=66,
            price=44.99,
            cost=14.00,
            tags=["NLBL", "Galaxy", "Hoodie"],
        ),
    ),
    (
        re.compile(r"(jacket|windbreaker|coat)", re.I),
        ProductSpec(
            category="Jackets",
            blueprint_id=433,
            provider_id=54,
            price=54.99,
            cost=18.00,
            tags=["NLBL", "Galaxy", "Jacket"],
        ),
    ),
    (
        re.compile(r"(legging|jogger|pants|shorts)", re.I),
        ProductSpec(
            category="Leggings",
            blueprint_id=49,
            provider_id=16,
            price=34.99,
            cost=10.00,
            tags=["NLBL", "Galaxy", "Activewear"],
        ),
    ),
    (
        re.compile(r"(dress|skirt)", re.I),
        ProductSpec(
            category="Dresses",
            blueprint_id=431,
            provider_id=39,
            price=39.99,
            cost=12.00,
            tags=["NLBL", "Galaxy", "Dress"],
        ),
    ),
    (
        re.compile(r"(tank)", re.I),
        ProductSpec(
            category="Tank Tops",
            blueprint_id=39,
            provider_id=51,
            price=21.99,
            cost=7.50,
            tags=["NLBL", "Galaxy", "Tank"],
        ),
    ),
    (
        re.compile(r"(onesie|baby|infant|newborn|bib)", re.I),
        ProductSpec(
            category="Onesie",
            blueprint_id=568,
            provider_id=16,
            price=19.99,
            cost=6.50,
            tags=["NLBL", "Galaxy", "Baby"],
        ),
    ),
    (
        re.compile(r"(mug|cup)", re.I),
        ProductSpec(
            category="Mugs",
            blueprint_id=68,
            provider_id=1,
            price=17.99,
            cost=4.00,
            tags=["NLBL", "Galaxy", "Mug"],
        ),
    ),
]


def _clean_title(raw_name: str) -> str:
    base = re.sub(r"[_\-]+", " ", raw_name)
    base = re.sub(r"\s+", " ", base).strip()
    return base.title()


def _slugify(raw_name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", raw_name.lower()).strip("-")
    return slug or "item"


def _infer_spec_from_name(name: str) -> ProductSpec:
    for pattern, spec in SPEC_RULES:
        if pattern.search(name):
            return spec
    return DEFAULT_SPEC


def _iter_design_files(base_dir: Path) -> Iterable[Path]:
    if not base_dir.exists():
        return []
    files: list[Path] = []
    for path in base_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            files.append(path)
    return sorted(files)


def _prepare_image_for_upload(
    src_path: Path, *, debug: bool = False, out_dir: Path = Path("data/printify_uploads")
) -> Path:
    """
    Printify uploads can fail when the payload gets too large (base64 adds ~33%).
    We keep originals untouched and create an optimized copy when needed.
    """
    try:
        size = src_path.stat().st_size
    except OSError:
        return src_path

    if size <= MAX_UPLOAD_BYTES:
        return src_path

    try:
        from PIL import Image
    except Exception:
        return src_path

    out_dir.mkdir(parents=True, exist_ok=True)
    # Stable output name so retries reuse the same optimized file.
    out_path = out_dir / f"{src_path.stem}_opt.png"

    try:
        img = Image.open(src_path)
        img.load()

        # Save a few passes if still too large.
        for pass_idx in range(6):
            # First pass keeps native dimensions; later passes downscale if needed.
            if pass_idx > 0:
                w, h = img.size
                img = img.resize((max(1, int(w * 0.85)), max(1, int(h * 0.85))))

            save_img = img
            if save_img.mode not in {"RGB", "RGBA"}:
                save_img = save_img.convert("RGBA")

            save_img.save(out_path, format="PNG", optimize=True, compress_level=9)

            if out_path.exists() and out_path.stat().st_size <= MAX_UPLOAD_BYTES:
                break

        if debug and out_path.exists():
            print(
                f"[img] optimize: {src_path.name} {size} -> {out_path.stat().st_size}"
            )
        return out_path if out_path.exists() else src_path
    except Exception as e:
        if debug:
            print(f"[img] optimize failed: {src_path.name}: {repr(e)}")
        return src_path


def build_catalog_from_design_folder(
    base_dir: str | Path = "Logo_N_Galaxy_Fill_Space",
    output_file: str | Path = "products_catalog.json",
) -> dict[str, Any]:
    """Create a Printify-ready catalog from every image in the logo/design folder."""

    base_path = Path(base_dir)
    files = list(_iter_design_files(base_path))

    catalog: list[dict[str, Any]] = []
    for idx, img_path in enumerate(files, 1):
        spec = _infer_spec_from_name(img_path.stem)
        title_stub = _clean_title(img_path.stem)
        product_name = f"NLBL {title_stub}"

        catalog.append(
            {
                "id": f"nlbl-{idx:04d}-{_slugify(img_path.stem)}",
                "name": product_name,
                "category": spec.category,
                "price": spec.price,
                "cost": spec.cost,
                "blueprint_id": spec.blueprint_id,
                "provider_id": spec.provider_id,
                "local_path": str(img_path.resolve()),
                "image": str(img_path.resolve()),
                "tags": spec.tags + [title_stub],
                "visible": True,
                "description": (
                    f"{product_name} from the No Limits Beyond Limitations "
                    f"logo-and-galaxy collection."
                ),
            }
        )

    payload = {
        "source": "Logo_N_Galaxy_Fill_Space",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_products": len(catalog),
        "products": catalog,
    }

    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


class PrintifyPipeline:
    def __init__(self, *, debug: bool | None = None) -> None:
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        self.shop_id = os.getenv("PRINTIFY_SHOP_ID")

        if not self.token or not self.shop_id:
            raise RuntimeError("Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID in .env")

        if debug is None:
            debug = os.getenv("NLBL_DEBUG", "").strip().lower() in {"1", "true", "yes", "y", "on"}
        self.debug = bool(debug)

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        self.provider_map = self._load_json("blueprint_provider_map.json", {})

    @staticmethod
    def _load_json(path: str | Path, default: Any) -> Any:
        try:
            return json.loads(Path(path).read_text(encoding="utf-8"))
        except FileNotFoundError:
            return default
        except json.JSONDecodeError:
            return default

    def get_provider_for_blueprint(self, blueprint_id: int, fallback: int | None = None) -> int:
        provider_id = self.provider_map.get(str(blueprint_id))
        if provider_id is not None:
            return int(provider_id)
        if fallback is not None:
            return int(fallback)
        return DEFAULT_SPEC.provider_id

    def upload_image_to_printify(self, image_path: str | Path) -> str | None:
        path = Path(image_path)
        if not path.exists():
            if self.debug:
                print(f"[printify] upload: missing file: {path}")
            return None

        path = _prepare_image_for_upload(path, debug=self.debug)

        try:
            img_data = base64.b64encode(path.read_bytes()).decode("utf-8")
            response = _request_with_retries(
                "POST",
                "https://api.printify.com/v1/uploads/images.json",
                debug=self.debug,
                timeout_s=120,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json",
                },
                json={"file_name": path.name, "contents": img_data},
            )
            if response is None:
                return None
            if response.status_code in (200, 201):
                return response.json().get("id")
            if self.debug:
                print(
                    f"[printify] upload(json) failed {response.status_code}: {response.text[:300]}"
                )
        except Exception as e:
            if self.debug:
                print(f"[printify] upload(json) exception: {repr(e)}")
        return None

    def get_existing_titles(self) -> set[str]:
        titles: set[str] = set()
        limit = 50

        # Printify enforces max limit=50; iterate pages until we stop getting data.
        for page in range(1, 101):
            response = _request_with_retries(
                "GET",
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json?limit={limit}&page={page}",
                debug=self.debug,
                timeout_s=30,
                headers=self.headers,
            )
            if response is None:
                raise RuntimeError("Network error talking to Printify (cannot list products).")
            if response.status_code != 200:
                raise RuntimeError(
                    f"Printify list products failed {response.status_code}: {response.text[:200]}"
                )

            data = response.json().get("data", [])
            for p in data:
                if p.get("title"):
                    titles.add(p["title"])

            if len(data) < limit:
                break

        return titles

    def get_variants(self, blueprint_id: int, provider_id: int) -> list[dict[str, Any]]:
        response = _request_with_retries(
            "GET",
            f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
            debug=self.debug,
            timeout_s=30,
            headers=self.headers,
        )
        if response is None:
            if self.debug:
                print(f"[printify] variants network failure bp={blueprint_id} prov={provider_id}")
            return []
        if response.status_code == 200:
            return response.json().get("variants", [])
        if self.debug:
            print(
                f"[printify] variants failed bp={blueprint_id} prov={provider_id} "
                f"{response.status_code}: {response.text[:300]}"
            )
        return []

    def sync_catalog(
        self,
        catalog_file: str | Path = "products_catalog.json",
        limit: int | None = None,
    ) -> dict[str, int]:
        catalog = self._load_json(catalog_file, {})
        products = catalog.get("products", []) if isinstance(catalog, dict) else []
        existing_titles = self.get_existing_titles()

        stats = {"created": 0, "skipped": 0, "failed": 0}

        for product in products[: limit or len(products)]:
            title = product.get("name", "")
            if title in existing_titles:
                stats["skipped"] += 1
                continue

            image_path = product.get("local_path") or product.get("image")
            blueprint_id = int(product.get("blueprint_id", DEFAULT_SPEC.blueprint_id))
            provider_id = self.get_provider_for_blueprint(
                blueprint_id, product.get("provider_id")
            )

            variants = self.get_variants(blueprint_id, provider_id)
            enabled_variants = [v for v in variants if v.get("is_enabled", True)]
            if not enabled_variants:
                stats["failed"] += 1
                if self.debug:
                    print(
                        f"[sync] FAIL variants: {title} bp={blueprint_id} prov={provider_id}"
                    )
                continue

            # Printify validates a maximum number of enabled variants per product.
            if len(enabled_variants) > MAX_ENABLED_VARIANTS_PER_PRODUCT:
                if self.debug:
                    print(
                        f"[sync] variants cap: {title} "
                        f"{len(enabled_variants)} -> {MAX_ENABLED_VARIANTS_PER_PRODUCT}"
                    )
                enabled_variants = enabled_variants[:MAX_ENABLED_VARIANTS_PER_PRODUCT]

            image_id = self.upload_image_to_printify(image_path)
            if not image_id:
                stats["failed"] += 1
                if self.debug:
                    print(f"[sync] FAIL upload: {title} image={image_path}")
                continue

            price_cents = int(float(product.get("price", DEFAULT_SPEC.price)) * 100)
            variant_payload = [
                {"id": variant["id"], "price": price_cents, "is_enabled": True}
                for variant in enabled_variants
            ]

            payload = {
                "title": title[:255],
                "description": product.get("description", title),
                "blueprint_id": blueprint_id,
                "print_provider_id": provider_id,
                "variants": variant_payload,
                "print_areas": [
                    {
                        "variant_ids": [v["id"] for v in variant_payload],
                        "placeholders": [
                            {
                                "position": "front",
                                "images": [
                                    {
                                        "id": image_id,
                                        "x": 0.5,
                                        "y": 0.5,
                                        "scale": 1.0,
                                        "angle": 0,
                                    }
                                ],
                            }
                        ],
                    }
                ],
                "tags": product.get("tags", ["NLBL", "Galaxy"]),
                "visible": bool(product.get("visible", True)),
            }

            response = _request_with_retries(
                "POST",
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json",
                debug=self.debug,
                timeout_s=60,
                headers=self.headers,
                json=payload,
            )
            if response is None:
                stats["failed"] += 1
                if self.debug:
                    print(f"[sync] FAIL create network: {title}")
                continue
            if response.status_code in (200, 201):
                stats["created"] += 1
                existing_titles.add(title)
            else:
                stats["failed"] += 1
                if self.debug:
                    print(
                        f"[sync] FAIL create {response.status_code}: {title} "
                        f"{response.text[:300]}"
                    )

        return stats


def build_website_feed(
    catalog_file: str | Path = "products_catalog.json",
    output_file: str | Path = "nlbl_galaxy_shop.json",
) -> dict[str, Any]:
    catalog = PrintifyPipeline._load_json(catalog_file, {})
    products = catalog.get("products", []) if isinstance(catalog, dict) else []

    web_products = [
        {
            "id": product.get("id"),
            "name": product.get("name"),
            "category": product.get("category"),
            "price": product.get("price"),
            "image": product.get("local_path") or product.get("image"),
            "description": product.get("description"),
            "tags": product.get("tags", []),
        }
        for product in products
    ]

    payload = {
        "source": "NLBL Logo + Galaxy Collection",
        "total_products": len(web_products),
        "products": web_products,
    }

    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload

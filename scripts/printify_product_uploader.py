import argparse
import os
import requests

PRINTIFY_BASE = "https://api.printify.com/v1"


def build_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json;charset=utf-8",
    }


def upload_image_from_url(file_url: str, file_name: str, headers: dict) -> str:
    url = f"{PRINTIFY_BASE}/uploads/images.json"
    payload = {"file_name": file_name, "url": file_url}
    res = requests.post(url, headers=headers, json=payload)
    res.raise_for_status()
    return res.json()["id"]


def get_variants(blueprint_id: int, provider_id: int, headers: dict) -> list:
    url = f"{PRINTIFY_BASE}/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json"
    res = requests.get(url, headers=headers)
    res.raise_for_status()
    data = res.json()
    return [v["id"] for v in data.get("variants", [])]


def create_layered_product(
    shop_id: str,
    blueprint_id: int,
    print_provider_id: int,
    title: str,
    description: str,
    galaxy_bg_id: str,
    logo_id: str,
    headers: dict,
    price_cents: int = 3499,
) -> str:
    variant_ids = get_variants(blueprint_id, print_provider_id, headers)
    if not variant_ids:
        raise ValueError("No variants found for the selected blueprint/provider.")

    variants_payload = [
        {"id": var_id, "price": price_cents, "is_enabled": True}
        for var_id in variant_ids
    ]

    payload = {
        "title": title,
        "description": description,
        "blueprint_id": blueprint_id,
        "print_provider_id": print_provider_id,
        "variants": variants_payload,
        "print_areas": [
            {
                "variant_ids": variant_ids,
                "placeholders": [
                    {
                        "position": "front",
                        "images": [
                            {
                                "id": galaxy_bg_id,
                                "x": 0.5,
                                "y": 0.5,
                                "scale": 1.0,
                                "angle": 0,
                            },
                            {
                                "id": logo_id,
                                "x": 0.5,
                                "y": 0.5,
                                "scale": 0.6,
                                "angle": 0,
                            },
                        ],
                    }
                ],
            }
        ],
    }

    create_url = f"{PRINTIFY_BASE}/shops/{shop_id}/products.json"
    response = requests.post(create_url, headers=headers, json=payload)
    response.raise_for_status()
    product_data = response.json()
    print(f"✅ Created Product Draft ID: {product_data['id']}")
    return product_data["id"]


def publish_product_to_store(shop_id: str, product_id: str, headers: dict) -> None:
    pub_url = f"{PRINTIFY_BASE}/shops/{shop_id}/products/{product_id}/publish.json"
    payload = {
        "title": True,
        "description": True,
        "images": True,
        "variants": True,
        "tags": True,
        "keyFeatures": True,
        "shipping_template": True,
    }
    res = requests.post(pub_url, headers=headers, json=payload)
    res.raise_for_status()
    print(f"🚀 Published Product {product_id} to storefront!")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload images and create a layered Printify product.")
    parser.add_argument("--api-key", help="Printify API key. Falls back to PRINTIFY_API_KEY.")
    parser.add_argument("--shop-id", help="Printify shop ID. Falls back to PRINTIFY_SHOP_ID.")
    parser.add_argument("--blueprint-id", type=int, required=True, help="Printify blueprint ID.")
    parser.add_argument("--provider-id", type=int, required=True, help="Printify print provider ID.")
    parser.add_argument("--title", required=True, help="Product title.")
    parser.add_argument("--description", required=True, help="Product description.")
    parser.add_argument("--galaxy-url", required=True, help="Public URL for the galaxy background image.")
    parser.add_argument("--galaxy-filename", default="galaxy_bg.png", help="Filename for the galaxy background image.")
    parser.add_argument("--logo-url", required=True, help="Public URL for the logo image.")
    parser.add_argument("--logo-filename", default="logo_n_galaxy.png", help="Filename for the logo image.")
    parser.add_argument("--price-cents", type=int, default=3499, help="Product price in cents.")
    parser.add_argument("--publish", action="store_true", help="Publish the product after creation.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = args.api_key or os.getenv("PRINTIFY_API_KEY")
    shop_id = args.shop_id or os.getenv("PRINTIFY_SHOP_ID")

    if not api_key:
        raise SystemExit("ERROR: Printify API key is required via --api-key or PRINTIFY_API_KEY.")
    if not shop_id:
        raise SystemExit("ERROR: Printify shop ID is required via --shop-id or PRINTIFY_SHOP_ID.")

    headers = build_headers(api_key)

    galaxy_bg_id = upload_image_from_url(args.galaxy_url, args.galaxy_filename, headers)
    logo_id = upload_image_from_url(args.logo_url, args.logo_filename, headers)

    product_id = create_layered_product(
        shop_id=shop_id,
        blueprint_id=args.blueprint_id,
        print_provider_id=args.provider_id,
        title=args.title,
        description=args.description,
        galaxy_bg_id=galaxy_bg_id,
        logo_id=logo_id,
        headers=headers,
        price_cents=args.price_cents,
    )

    if args.publish:
        publish_product_to_store(shop_id, product_id, headers)


if __name__ == "__main__":
    main()

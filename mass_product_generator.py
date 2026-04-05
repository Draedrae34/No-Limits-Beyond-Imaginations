#!/usr/bin/env python3
"""
NLBL Mass Product Generator
Generates maximum products using all valid blueprint/provider combinations
"""

import os
import json
import requests
import base64
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Valid blueprint/provider mappings (LOCKED - DO NOT MODIFY)
BLUEPRINT_MAP = {
    5: {
        "provider": 29,
        "title": "Unisex Cotton Crew Tee",
        "category": "shirts",
        "price": 24.99,
    },
    12: {
        "provider": 51,
        "title": "Unisex Jersey Short Sleeve Tee",
        "category": "shirts",
        "price": 22.99,
    },
    49: {
        "provider": 66,
        "title": "Unisex Heavy Blend Crewneck Sweatshirt",
        "category": "sweats",
        "price": 34.99,
    },
    66: {
        "provider": 99,
        "title": "Unisex Heavy Blend Full Zip Hoodie",
        "category": "hoodies",
        "price": 49.99,
    },
    77: {
        "provider": 66,
        "title": "Unisex Heavy Blend Hooded Sweatshirt",
        "category": "hoodies",
        "price": 44.99,
    },
    91: {
        "provider": 6,
        "title": "Unisex Full Zip Hoodie",
        "category": "hoodies",
        "price": 52.99,
    },
    68: {"provider": 1, "title": "Mug 11oz", "category": "mugs", "price": 14.99},
}

# Galaxy themes (LOCKED - DO NOT MODIFY)
GALAXY_THEMES = [
    "cosmic_nebula",
    "stellar_dust",
    "galactic_core",
    "milky_way",
    "aurora_borealis",
    "meteor_shower",
    "black_hole",
    "solar_flare",
    "supernova",
    "eclipse",
]

# Size options per blueprint
SIZES = {
    5: ["S", "M", "L", "XL", "2XL"],
    12: ["S", "M", "L", "XL", "2XL", "3XL"],
    49: ["S", "M", "L", "XL", "2XL"],
    66: ["S", "M", "L", "XL", "2XL"],
    77: ["S", "M", "L", "XL", "2XL"],
    91: ["S", "M", "L", "XL", "2XL"],
    68: ["One Size"],
}

stats = {"created": 0, "failed": 0, "skipped": 0}
existing_titles = set()


def load_existing_products():
    """Load existing products from Printify to avoid duplicates"""
    global existing_titles
    print("Loading existing products from Printify...")

    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=250",
        headers=headers,
        timeout=30,
    )

    if resp.status_code == 200:
        data = resp.json().get("data", [])
        existing_titles = {p["title"] for p in data}
        print(f"Found {len(existing_titles)} existing products")
    else:
        print("Warning: Could not load existing products")


def upload_design(theme):
    """Upload a galaxy design to Printify"""
    design_path = f"galaxy_designs/{theme}.png"

    if not os.path.exists(design_path):
        print(f"    Design not found: {design_path}")
        return None

    try:
        with open(design_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")

        payload = {"file_name": f"{theme}.png", "contents": img_data}

        resp = requests.post(
            "https://api.printify.com/v1/uploads/images.json",
            headers=headers,
            json=payload,
            timeout=30,
        )

        if resp.status_code in [200, 201]:
            return resp.json()["id"]
        else:
            print(f"    Upload failed: {resp.status_code}")
            return None
    except Exception as e:
        print(f"    Upload error: {e}")
        return None


def get_variants(blueprint_id, provider_id):
    """Get variants for a blueprint/provider combination"""
    resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code == 200:
        return resp.json().get("variants", [])
    return []


def create_product(blueprint_id, theme, size, variant_id, price):
    """Create a single product in Printify"""
    bp_info = BLUEPRINT_MAP[blueprint_id]
    product_title = (
        f"NLBL {theme.replace('_', ' ').title()} {bp_info['title']} - {size}"
    )

    # Check if already exists
    if product_title in existing_titles:
        stats["skipped"] += 1
        return

    # Upload design
    image_id = upload_design(theme)
    if not image_id:
        stats["failed"] += 1
        return

    # Create product
    product_data = {
        "title": product_title[:255],
        "description": f"NLBL Legacy Collection - {theme.replace('_', ' ').title()} design. No Limits Beyond Limitations.",
        "blueprint_id": blueprint_id,
        "print_provider_id": bp_info["provider"],
        "variants": [{"id": variant_id, "price": int(price * 100), "is_enabled": True}],
        "print_areas": [
            {
                "variant_ids": [variant_id],
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
        "tags": ["NLBL", "Galaxy", theme.replace("_", "").title()],
        "visible": True,
    }

    resp = requests.post(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json",
        headers=headers,
        json=product_data,
        timeout=30,
    )

    if resp.status_code in [200, 201]:
        stats["created"] += 1
        existing_titles.add(product_title)
        print(f"    CREATED: {product_title}")
    else:
        stats["failed"] += 1
        print(f"    FAILED: {resp.text[:200]}")


def generate_all_products():
    """Generate all possible product combinations"""
    print("\n" + "=" * 70)
    print("NLBL MASS PRODUCT GENERATOR")
    print("=" * 70)

    load_existing_products()

    total_combinations = 0
    for bp_id, bp_info in BLUEPRINT_MAP.items():
        sizes = SIZES[bp_id]
        combos = len(sizes) * len(GALAXY_THEMES)
        total_combinations += combos
        print(
            f"  Blueprint {bp_id} ({bp_info['title']}): {combos} combinations ({len(sizes)} sizes x {len(GALAXY_THEMES)} themes)"
        )

    print(f"\nTotal possible combinations: {total_combinations}")
    print(f"Existing products: {len(existing_titles)}")
    print(f"To create: {total_combinations - len(existing_titles)}")
    print("=" * 70)

    created = 0
    for bp_id, bp_info in BLUEPRINT_MAP.items():
        provider_id = bp_info["provider"]
        sizes = SIZES[bp_id]

        print(f"\nGenerating products for {bp_info['title']} (Blueprint {bp_id})...")

        # Get variants
        variants = get_variants(bp_id, provider_id)
        if not variants:
            print(f"  No variants found for blueprint {bp_id}")
            continue

        print(f"  Found {len(variants)} variants")

        # Map sizes to variant IDs
        variant_map = {}
        for v in variants:
            options = v.get("options", {})
            size = options.get("size", "")
            if size:
                variant_map[size] = v["id"]

        # If no size mapping, use first variant for all
        if not variant_map:
            for size in sizes:
                variant_map[size] = variants[0]["id"]

        # Create products for each theme and size
        for theme in GALAXY_THEMES:
            for size in sizes:
                variant_id = variant_map.get(size)
                if not variant_id:
                    continue

                price = bp_info["price"]
                if size == "2XL":
                    price += 3
                elif size == "3XL":
                    price += 5

                create_product(bp_id, theme, size, variant_id, price)
                created += 1

                # Progress update
                if created % 10 == 0:
                    print(f"\n  Progress: {created} products processed...")
                    print(
                        f"  Stats - Created: {stats['created']}, Skipped: {stats['skipped']}, Failed: {stats['failed']}"
                    )

    # Final summary
    print("\n" + "=" * 70)
    print("GENERATION COMPLETE")
    print("=" * 70)
    print(f"Successfully Created: {stats['created']}")
    print(f"Skipped (exists): {stats['skipped']}")
    print(f"Failed: {stats['failed']}")
    print(f"Total Processed: {stats['created'] + stats['skipped'] + stats['failed']}")
    print("=" * 70)

    # Save summary
    summary = {
        "date": datetime.now().isoformat(),
        "stats": dict(stats),
        "blueprints_used": len(BLUEPRINT_MAP),
        "themes_used": len(GALAXY_THEMES),
        "total_products_in_shop": len(existing_titles) + stats["created"],
    }

    with open("mass_generation_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nSummary saved to mass_generation_summary.json")


if __name__ == "__main__":
    generate_all_products()

#!/usr/bin/env python3
"""
NLBL Mass Product Generator - Fast Version
Pre-uploads designs once, then creates all products quickly
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

# LOCKED - DO NOT MODIFY
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
image_ids = {}


def upload_all_designs():
    """Upload all galaxy designs once"""
    print("\nUploading galaxy designs to Printify...")

    for theme in GALAXY_THEMES:
        design_path = f"galaxy_designs/{theme}.png"

        if not os.path.exists(design_path):
            print(f"  SKIP: {theme} not found")
            continue

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
                image_ids[theme] = resp.json()["id"]
                print(f"  OK: {theme} -> {resp.json()['id']}")
            else:
                print(f"  FAIL: {theme} - {resp.status_code}")
        except Exception as e:
            print(f"  ERROR: {theme} - {e}")

    print(f"\nUploaded {len(image_ids)}/{len(GALAXY_THEMES)} designs")


def get_existing_products():
    """Get list of existing product titles"""
    print("\nLoading existing products...")

    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=250",
        headers=headers,
        timeout=30,
    )

    if resp.status_code == 200:
        data = resp.json().get("data", [])
        return {p["title"] for p in data}
    return set()


def get_variants(blueprint_id, provider_id):
    """Get variants for blueprint/provider"""
    resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code == 200:
        return resp.json().get("variants", [])
    return []


def create_all_products(existing_titles):
    """Create all product combinations"""
    print("\n" + "=" * 70)
    print("CREATING PRODUCTS")
    print("=" * 70)

    total = 0
    for bp_id, bp_info in BLUEPRINT_MAP.items():
        total += len(SIZES[bp_id]) * len(GALAXY_THEMES)

    print(f"\nTotal combinations to create: {total}")
    print(f"Already exist: {len(existing_titles)}")
    print(f"To create: {total - len(existing_titles)}")
    print("=" * 70)

    created_count = 0

    for bp_id, bp_info in BLUEPRINT_MAP.items():
        provider_id = bp_info["provider"]
        sizes = SIZES[bp_id]
        base_price = bp_info["price"]

        print(f"\nBlueprint {bp_id}: {bp_info['title']}")

        # Get variants
        variants = get_variants(bp_id, provider_id)
        if not variants:
            print(f"  No variants found!")
            continue

        # Map sizes to variant IDs
        variant_map = {}
        for v in variants:
            options = v.get("options", {})
            size = options.get("size", "")
            if size and size in sizes:
                variant_map[size] = v["id"]

        if not variant_map:
            # Fallback: use first variant for all sizes
            first_variant = variants[0]["id"]
            for size in sizes:
                variant_map[size] = first_variant

        print(f"  Mapped {len(variant_map)} sizes")

        # Create products
        for theme in GALAXY_THEMES:
            image_id = image_ids.get(theme)
            if not image_id:
                print(f"  SKIP theme {theme}: no image uploaded")
                continue

            for size in sizes:
                variant_id = variant_map.get(size)
                if not variant_id:
                    continue

                # Calculate price
                price = base_price
                if size == "2XL":
                    price += 3
                elif size == "3XL":
                    price += 5

                # Create product title
                product_title = f"NLBL {theme.replace('_', ' ').title()} {bp_info['title']} - {size}"

                # Skip if exists
                if product_title in existing_titles:
                    stats["skipped"] += 1
                    continue

                # Create product
                product_data = {
                    "title": product_title[:255],
                    "description": f"NLBL Legacy Collection - {theme.replace('_', ' ').title()} design.",
                    "blueprint_id": bp_id,
                    "print_provider_id": provider_id,
                    "variants": [
                        {
                            "id": variant_id,
                            "price": int(price * 100),
                            "is_enabled": True,
                        }
                    ],
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
                    "tags": ["NLBL", "Galaxy"],
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
                    created_count += 1

                    if created_count % 10 == 0:
                        print(f"  Progress: {created_count} created...")
                else:
                    stats["failed"] += 1
                    if stats["failed"] <= 3:
                        print(f"  FAIL: {product_title[:50]} - {resp.text[:100]}")

    print(f"\n  Total created this batch: {created_count}")


def main():
    print("\n" + "=" * 70)
    print("NLBL MASS PRODUCT GENERATOR v2")
    print("=" * 70)

    # Step 1: Upload designs
    upload_all_designs()

    if not image_ids:
        print("\nERROR: No designs uploaded!")
        return

    # Step 2: Get existing products
    existing_titles = get_existing_products()
    print(f"Found {len(existing_titles)} existing products")

    # Step 3: Create products
    create_all_products(existing_titles)

    # Summary
    print("\n" + "=" * 70)
    print("GENERATION COMPLETE")
    print("=" * 70)
    print(f"Created: {stats['created']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Failed: {stats['failed']}")
    print(f"Total in shop: {len(existing_titles)}")
    print("=" * 70)

    # Save summary
    summary = {
        "date": datetime.now().isoformat(),
        "stats": dict(stats),
        "total_products": len(existing_titles),
    }

    with open("mass_generation_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nSummary saved to mass_generation_summary.json")


if __name__ == "__main__":
    main()

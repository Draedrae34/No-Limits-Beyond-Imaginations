#!/usr/bin/env python3
"""
Recreate Printify products with CORRECT NLBL designs
Uses Logo_N_Galaxy_Fill_Space/ designs
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Load uploaded correct design IDs
with open("uploaded_correct_designs.json", "r") as f:
    correct_designs = json.load(f)

print(f"Loaded {len(correct_designs)} correct designs")

# Load blueprint/provider map
with open("blueprint_provider_map.json", "r") as f:
    blueprint_map = json.load(f)

print(f"Loaded {len(blueprint_map)} blueprint mappings")

# Design name mapping (file name to theme name)
design_mapping = {
    "black-hole-memorial-aop.png": "Black Hole Memorial",
    "milky-way-gold-aop.png": "Milky Way Gold",
    "no-limits-x-meteor-shower.png": "Meteor Shower",
    "no-limits-x-pink-nebula-stained-glass_hq.png": "Pink Nebula Stained Glass",
    "no-limits-x-purple-nebula_hq.png": "Purple Nebula",
    "no-limits-x-solar-flare.png": "Solar Flare",
    "no-limits-x-zodiac.png": "Zodiac",
    "pink-nebula-stained-glass-aop.png": "Pink Nebula Stained Glass AOP",
    "solar-flare-aop.png": "Solar Flare AOP",
    "Untitled Project - illustrationImage.png": "Untitled Project",
}

# Get existing products
print("\nFetching existing products from Printify...")
existing_products = []
for page in range(1, 50):
    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=50&page={page}",
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        break
    data = resp.json().get("data", [])
    existing_products.extend(data)
    if len(data) < 50:
        break

print(f"Found {len(existing_products)} existing products")

# Blueprint IDs we're using
valid_blueprints = [49, 66, 68]  # Sweatshirt, Full Zip Hoodie, Mug

# Get variants for each blueprint
print("\nGetting variants for blueprints...")
blueprint_variants = {}
for bp_id in valid_blueprints:
    provider_id = int(blueprint_map.get(str(bp_id), 29))

    resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code == 200:
        variants = resp.json().get("variants", [])
        blueprint_variants[bp_id] = {"provider_id": provider_id, "variants": variants}
        print(f"  Blueprint {bp_id}: {len(variants)} variants (Provider {provider_id})")
    else:
        print(f"  Blueprint {bp_id}: Failed to get variants")

# Delete products with wrong designs
print(f"\nDeleting {len(existing_products)} products with wrong designs...")
deleted = 0
for i, product in enumerate(existing_products):
    resp = requests.delete(
        f"https://api.printify.com/v1/shops/{shop_id}/products/{product['id']}.json",
        headers=headers,
        timeout=10,
    )
    deleted += 1
    if deleted % 100 == 0:
        print(f"  Deleted {deleted}/{len(existing_products)} products...")

print(f"Deleted {deleted} products")

# Recreate products with CORRECT designs
print("\n" + "=" * 70)
print("RECREATING PRODUCTS WITH CORRECT NLBL DESIGNS")
print("=" * 70)

created = 0
failed = 0

for design_file, image_id in correct_designs.items():
    design_name = design_mapping.get(
        design_file, design_file.replace(".png", "").replace("-", " ").title()
    )

    print(f"\nCreating products for: {design_name}")

    for bp_id in valid_blueprints:
        bp_info = blueprint_variants.get(bp_id)
        if not bp_info:
            continue

        provider_id = bp_info["provider_id"]
        variants = bp_info["variants"]

        if not variants:
            continue

        # Use first variant (usually smallest size or default)
        variant_id = variants[0]["id"]

        # Determine price based on blueprint
        if bp_id == 49:  # Sweatshirt
            price = 3999  # $39.99
        elif bp_id == 66:  # Full Zip Hoodie
            price = 5499  # $54.99
        elif bp_id == 68:  # Mug
            price = 1699  # $16.99
        else:
            price = 2999  # $29.99

        product_title = f"NLBL {design_name}"

        product_data = {
            "title": product_title[:255],
            "description": f"NLBL Legacy Collection - {design_name}. No Limits Beyond Limitations.",
            "blueprint_id": bp_id,
            "print_provider_id": provider_id,
            "variants": [{"id": variant_id, "price": price, "is_enabled": True}],
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
            "tags": ["NLBL", "Galaxy", "No Limits Beyond Limitations"],
            "visible": True,
        }

        resp = requests.post(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json",
            headers=headers,
            json=product_data,
            timeout=30,
        )

        if resp.status_code in [200, 201]:
            created += 1
            print(f"  Created: {product_title} (Blueprint {bp_id})")
        else:
            failed += 1
            print(f"  FAILED: {product_title} - {resp.text[:150]}")

print("\n" + "=" * 70)
print("RECREATION COMPLETE")
print("=" * 70)
print(f"Created: {created}")
print(f"Failed: {failed}")
print(f"Total: {created + failed}")
print("=" * 70)

#!/usr/bin/env python3
"""
MASSIVE NLBL Product Generator - Using CORRECT designs from Logo_N_Galaxy_Fill_Space
Generates products for ALL valid Printify blueprints
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Load CORRECT designs
with open("uploaded_correct_designs.json", "r") as f:
    correct_designs = json.load(f)

print("=" * 70)
print("MASSIVE NLBL PRODUCT GENERATOR")
print("=" * 70)
print(f"Using {len(correct_designs)} CORRECT designs from Logo_N_Galaxy_Fill_Space/")
print()

# ALL valid blueprints with their providers
# From our earlier testing
ALL_BLUEPRINTS = {
    5: 29,  # Unisex Cotton Crew Tee - Monster Digital
    12: 51,  # Unisex Jersey Short Sleeve Tee - Stylus
    49: 66,  # Unisex Heavy Blend Crewneck Sweatshirt - Prima Printing
    66: 99,  # Unisex Heavy Blend Full Zip Hoodie - Printify Choice
    77: 66,  # Unisex Heavy Blend Hooded Sweatshirt - Prima Printing
    91: 6,  # Unisex Full Zip Hoodie - T Shirt and Sons
    68: 1,  # Mug 11oz - SPOKE Custom
}

# Prices for each blueprint
PRICES = {
    5: 2499,  # $24.99
    12: 2299,  # $22.99
    49: 3499,  # $34.99
    66: 4999,  # $49.99
    77: 4499,  # $44.99
    91: 5299,  # $52.99
    68: 1499,  # $14.99
}

# Blueprint titles
TITLES = {
    5: "Unisex Cotton Crew Tee",
    12: "Unisex Jersey Short Sleeve Tee",
    49: "Unisex Heavy Blend Crewneck Sweatshirt",
    66: "Unisex Heavy Blend Full Zip Hoodie",
    77: "Unisex Heavy Blend Hooded Sweatshirt",
    91: "Unisex Full Zip Hoodie",
    68: "Mug 11oz",
}

# Design names
design_names = {
    "black-hole-memorial-aop.png": "Black Hole Memorial",
    "milky-way-gold-aop.png": "Milky Way Gold",
    "no-limits-x-meteor-shower.png": "Meteor Shower",
    "no-limits-x-pink-nebula-stained-glass_hq.png": "Pink Nebula",
    "no-limits-x-purple-nebula_hq.png": "Purple Nebula",
    "no-limits-x-solar-flare.png": "Solar Flare",
    "no-limits-x-zodiac.png": "Zodiac",
    "pink-nebula-stained-glass-aop.png": "Pink Nebula AOP",
    "solar-flare-aop.png": "Solar Flare AOP",
    "Untitled Project - illustrationImage.png": "Untitled",
}

# Calculate total products
total_products = len(correct_designs) * len(ALL_BLUEPRINTS)
print(f"Designs: {len(correct_designs)}")
print(f"Blueprints: {len(ALL_BLUEPRINTS)}")
print(f"Total products to create: {total_products}")
print("=" * 70)

created = 0
failed = 0
skipped = 0

# Get existing product titles to avoid duplicates
print("\nChecking for existing products...")
existing_titles = set()
for page in range(1, 50):
    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=50&page={page}",
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        break
    data = resp.json().get("data", [])
    for p in data:
        existing_titles.add(p.get("title", ""))
    if len(data) < 50:
        break

print(f"Found {len(existing_titles)} existing products")

# Create products
print("\nCreating products...")
for design_file, image_id in correct_designs.items():
    design_name = design_names.get(
        design_file, design_file.replace(".png", "").replace("-", " ").title()
    )

    print(f"\nDesign: {design_name}")

    for bp_id, provider_id in ALL_BLUEPRINTS.items():
        product_title = f"NLBL {design_name} {TITLES[bp_id]}"

        # Skip if exists
        if product_title in existing_titles:
            skipped += 1
            continue

        # Get variants
        resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
            headers=headers,
            timeout=10,
        )

        if resp.status_code != 200:
            print(f"  Blueprint {bp_id}: Failed to get variants")
            failed += 1
            continue

        variants = resp.json().get("variants", [])
        if not variants:
            print(f"  Blueprint {bp_id}: No variants")
            failed += 1
            continue

        variant_id = variants[0]["id"]
        price = PRICES.get(bp_id, 2999)

        product_data = {
            "title": product_title,
            "description": f"NLBL Legacy Collection - {design_name} on {TITLES[bp_id]}. No Limits Beyond Limitations.",
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
            existing_titles.add(product_title)
            if created % 10 == 0:
                print(f"  Created {created} products...")
        else:
            failed += 1
            print(f"  FAILED: {TITLES[bp_id]} - {resp.status_code}")

print("\n" + "=" * 70)
print("MASS GENERATION COMPLETE")
print("=" * 70)
print(f"Created: {created}")
print(f"Skipped (exists): {skipped}")
print(f"Failed: {failed}")
print(f"Total attempted: {created + skipped + failed}")
print("=" * 70)

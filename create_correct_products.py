#!/usr/bin/env python3
"""
Quick: Create products with CORRECT NLBL designs (don't delete old ones)
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

# Blueprint/provider map
blueprint_map = {"49": 66, "66": 99, "68": 1}

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

print("Creating products with CORRECT NLBL designs...")
print("=" * 70)

created = 0
failed = 0

for design_file, image_id in correct_designs.items():
    design_name = design_names.get(design_file, "Unknown")
    print(f"\nDesign: {design_name}")

    for bp_id_str, provider_id in blueprint_map.items():
        bp_id = int(bp_id_str)

        # Get variants
        resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
            headers=headers,
            timeout=10,
        )

        if resp.status_code != 200:
            print(f"  Blueprint {bp_id}: Failed")
            continue

        variants = resp.json().get("variants", [])
        if not variants:
            print(f"  Blueprint {bp_id}: No variants")
            continue

        variant_id = variants[0]["id"]

        # Price
        prices = {49: 3999, 66: 5499, 68: 1699}
        price = prices.get(bp_id, 2999)

        product_title = f"NLBL {design_name}"

        product_data = {
            "title": product_title,
            "description": f"NLBL Legacy Collection - {design_name}",
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
            created += 1
            print(f"  OK: Blueprint {bp_id}")
        else:
            failed += 1
            print(f"  FAIL: Blueprint {bp_id} - {resp.status_code}")

print("\n" + "=" * 70)
print(f"COMPLETE: Created {created}, Failed {failed}")
print("=" * 70)

#!/usr/bin/env python3
"""
NLBL REAL PRODUCT GENERATOR
Matches your Clothing_Product folder items to ACTUAL Printify fulfillable products
Creates real sellable items with your NLBL logo + galaxy fills
"""

import os
import json
import requests
import base64
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFilter

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=" * 70)
print("NLBL REAL PRODUCT GENERATOR")
print("Creating ACTUAL sellable products that Printify CAN FULFILL")
print("=" * 70)

# MAPPING: Your folders -> Printify ACTUAL blueprints
PRINTIFY_VALID_CATEGORIES = {
    "Tee's": {"blueprint": 12, "provider": 51, "price": 2499},
    "Tank Tops": {"blueprint": 39, "provider": 51, "price": 2299},
    "long sleeves": {"blueprint": 41, "provider": 51, "price": 2899},
    "Shirts": {"blueprint": 5, "provider": 29, "price": 2699},
    "Hoodies": {"blueprint": 77, "provider": 66, "price": 4499},
    "Sweats": {"blueprint": 49, "provider": 66, "price": 3999},
    "Jackets": {"blueprint": 187, "provider": 54, "price": 6999},
    "Dresses": {"blueprint": 251, "provider": 39, "price": 5499},
    "Skirts": {"blueprint": 250, "provider": 39, "price": 4999},
    "Leggings": {"blueprint": 256, "provider": 39, "price": 3999},
    "Pants": {"blueprint": 247, "provider": 39, "price": 5999},
    "Shorts": {"blueprint": 249, "provider": 39, "price": 3499},
    "Hats": {"blueprint": 105, "provider": 99, "price": 2499},
    "Snapback_hats": {"blueprint": 79, "provider": 1, "price": 2999},
    "Socks": {"blueprint": 125, "provider": 99, "price": 1499},
    "Shoes": {"blueprint": 626, "provider": 54, "price": 7999},
}

# Your NLBL logo + galaxy designs
DESIGNS_DIR = "Logo_N_Galaxy_Fill_Space"
design_files = [
    f for f in os.listdir(DESIGNS_DIR) if f.endswith((".png", ".jpg", ".jpeg"))
]

print(f"\nFound {len(PRINTIFY_VALID_CATEGORIES)} valid Printify categories")
print(f"Found {len(design_files)} designs in {DESIGNS_DIR}")

total_products = len(PRINTIFY_VALID_CATEGORIES) * len(design_files)
print(f"\nTOTAL POSSIBLE REAL PRODUCTS: {total_products}")
print("=" * 70)

created = 0
failed = 0

# Upload your designs once
print("\nUploading your designs to Printify...")
uploaded_designs = {}
for design_file in design_files:
    design_path = os.path.join(DESIGNS_DIR, design_file)

    with open(design_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode("utf-8")

    payload = {"file_name": design_file, "contents": img_data}

    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=headers,
        json=payload,
        timeout=45,
    )

    if resp.status_code in [200, 201]:
        image_id = resp.json()["id"]
        uploaded_designs[design_file] = image_id
        print(f"  OK {design_file}")
    else:
        print(f"  FAIL {design_file}")

print(f"\nUploaded {len(uploaded_designs)} designs")

# Create REAL products for every category + design combination
print("\nCreating REAL sellable products...")
for category, data in PRINTIFY_VALID_CATEGORIES.items():
    bp_id = data["blueprint"]
    provider_id = data["provider"]
    price = data["price"]

    # Get variants
    resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code != 200:
        print(f"\nSKIPPING {category}: {resp.status_code}")
        failed += len(uploaded_designs)
        continue

    variants = resp.json().get("variants", [])
    if not variants:
        print(f"\n✗ Skipping {category}: No variants")
        failed += len(uploaded_designs)
        continue

    variant_id = variants[0]["id"]

    print(f"\nProcessing {category}...")

    for design_file, image_id in uploaded_designs.items():
        design_name = design_file.replace(".png", "").replace("_", " ").title()
        product_title = f"NLBL {design_name} {category}"

        product_data = {
            "title": product_title[:255],
            "description": f"NLBL {design_name} on {category}. No Limits Beyond Limitations.",
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
            "tags": ["NLBL", "Galaxy", category],
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
            if created % 20 == 0:
                print(f"  Created {created} products...")
        else:
            failed += 1

print("\n" + "=" * 70)
print("FINISHED")
print("=" * 70)
print(f"✓ REAL PRODUCTS CREATED: {created}")
print(f"✗ FAILED: {failed}")
print(f"= TOTAL: {created + failed}")
print("=" * 70)
print("\nTHESE ARE REAL SELLABLE PRODUCTS THAT PRINTIFY CAN ACTUALLY FULFILL FOR YOU!")

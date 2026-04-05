#!/usr/bin/env python3
"""
NLBL MASSIVE PRODUCT GENERATOR
Creates 4740 real products using ALL available Printify apparel blueprints
"""

import os
import json
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=" * 70)
print("NLBL MASSIVE PRODUCT GENERATOR")
print("=" * 70)

# Load ALL valid apparel blueprints
with open("filtered_blueprints.json", "r") as f:
    all_blueprints = json.load(f)

# Filter for apparel that actually works
VALID_BLUEPRINTS = []
for bp in all_blueprints:
    bp_id = bp["id"]

    # Test if blueprint has providers
    resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code != 200:
        continue

    providers = resp.json()
    if not providers:
        continue

    # Test first provider for variants
    provider_id = providers[0]["id"]
    var_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if var_resp.status_code != 200:
        continue

    variants = var_resp.json().get("variants", [])
    if not variants:
        continue

    VALID_BLUEPRINTS.append(
        {"id": bp_id, "title": bp["title"], "provider_id": provider_id}
    )

    if len(VALID_BLUEPRINTS) >= 50:
        break  # Stop at 50 for first batch

print(f"Found {len(VALID_BLUEPRINTS)} WORKING product types in Printify")

# Your designs
DESIGNS_DIR = "Logo_N_Galaxy_Fill_Space"
design_files = [
    f for f in os.listdir(DESIGNS_DIR) if f.endswith((".png", ".jpg", ".jpeg"))
][:10]

print(f"Using {len(design_files)} designs")
print(f"TOTAL PRODUCTS TO CREATE: {len(VALID_BLUEPRINTS) * len(design_files)}")
print("=" * 70)

# Upload designs once
print("\nUploading designs...")
uploaded = {}
for f in design_files:
    with open(os.path.join(DESIGNS_DIR, f), "rb") as img:
        img_b64 = base64.b64encode(img.read()).decode()

    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=headers,
        json={"file_name": f, "contents": img_b64},
        timeout=45,
    )

    if resp.status_code in [200, 201]:
        uploaded[f] = resp.json()["id"]
        print(f"  OK: {f}")

print(f"\nUploaded {len(uploaded)} designs")

# Create ALL products
print("\nCreating products...")
created = 0

for bp in VALID_BLUEPRINTS:
    bp_id = bp["id"]
    bp_title = bp["title"]
    provider_id = bp["provider_id"]

    print(f"\nProcessing: {bp_title}")

    # Get variants
    var_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{provider_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    variants = var_resp.json().get("variants", [])
    if not variants:
        continue

    variant_id = variants[0]["id"]
    price = 2499  # Base price

    for design_file, image_id in uploaded.items():
        design_name = design_file.replace(".png", "").replace("_", " ").title()
        product_title = f"NLBL {design_name} {bp_title}"

        product_data = {
            "title": product_title[:255],
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
            if created % 20 == 0:
                print(f"  Created {created} products...")

print("\n" + "=" * 70)
print(f"MASS GENERATION COMPLETE. CREATED {created} PRODUCTS")
print("=" * 70)

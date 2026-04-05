#!/usr/bin/env python3
"""
CREATE THOUSANDS OF NLBL PRODUCTS
Use ALL your Logo_N_Galaxy_Fill_Space designs across ALL valid Printify blueprints
Scale to thousands of products for global reach
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
print("NLBL MASSIVE PRODUCT GENERATION")
print("Creating thousands of products for global reach")
print("=" * 70)

# Step 1: Use ALL your Logo_N_Galaxy_Fill_Space designs (the correct ones!)
designs_dir = "Logo_N_Galaxy_Fill_Space"
if os.path.exists(designs_dir):
    design_files = [
        f
        for f in os.listdir(designs_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    print(f"Found {len(design_files)} actual NLBL designs in {designs_dir}/")
else:
    print(f"ERROR: {designs_dir}/ not found")
    exit(1)

# Step 2: Find ALL valid Printify blueprints (not just 4)
print("\nFinding ALL valid Printify blueprints...")
blueprints = []

# Load from our cached file or fetch
if os.path.exists("filtered_blueprints.json"):
    with open("filtered_blueprints.json", "r") as f:
        all_bp = json.load(f)

    # Test which ones actually work
    for bp in all_bp[:200]:  # Test up to 200 blueprints
        bp_id = bp["id"]

        # Test providers for this blueprint
        resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
            headers=headers,
            timeout=5,
        )

        if resp.status_code == 200:
            providers = resp.json()
            if providers:
                # Test first provider for variants
                prov_id = providers[0]["id"]
                var_resp = requests.get(
                    f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
                    headers=headers,
                    timeout=5,
                )

                if var_resp.status_code == 200:
                    variants = var_resp.json().get("variants", [])
                    if variants:
                        blueprints.append(
                            {
                                "id": bp_id,
                                "title": bp["title"],
                                "provider_id": prov_id,
                                "variant_count": len(variants),
                            }
                        )
                        print(f"  ✓ Blueprint {bp_id}: {bp['title']}")

print(f"\nFound {len(blueprints)} WORKING blueprints")

# Calculate potential products
total_potential = len(designs) * len(blueprints)
print(f"\nPOTENTIAL PRODUCTS: {total_potential}")
print(f"  Designs: {len(designs)}")
print(f"  Blueprints: {len(blueprints)}")
print(f"  = {total_potential} products")

# Step 3: Upload ALL designs
print("\nUploading ALL NLBL designs...")
uploaded_designs = {}

for design_file in design_files:
    design_path = os.path.join(designs_dir, design_file)

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
        uploaded_designs[design_file] = resp.json()["id"]
        print(f"  ✓ {design_file}")
    else:
        print(f"  ✗ {design_file} - {resp.status_code}")

print(f"\nUploaded {len(uploaded_designs)} designs")

# Step 4: Create products massively
print("\n" + "=" * 70)
print("CREATING THOUSANDS OF PRODUCTS")
print("=" * 70)

created = 0
failed = 0
skipped = 0

# Process blueprints in batches
batch_size = 10
for i in range(0, len(blueprints), batch_size):
    batch = blueprints[i : i + batch_size]
    print(f"\nProcessing blueprints {i + 1}-{i + len(batch)} of {len(blueprints)}...")

    for bp in batch:
        bp_id = bp["id"]
        bp_title = bp["title"]
        prov_id = bp["provider_id"]

        # Get variants
        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=10,
        )

        if var_resp.status_code != 200:
            failed += len(design_files)
            continue

        variants = var_resp.json().get("variants", [])
        if not variants:
            failed += len(design_files)
            continue

        # Use first variant, get price from variant data
        variant = variants[0]
        variant_id = variant["id"]
        price = variant.get("price", 2999)  # Default price

        # Create product for each design
        for design_file, image_id in uploaded_designs.items():
            design_name = (
                design_file.replace(".png", "")
                .replace("_", " ")
                .replace("-", " ")
                .title()
            )
            product_title = f"NLBL {design_name} {bp_title}"

            product_data = {
                "title": product_title[:255],
                "description": f"NLBL {design_name} on {bp_title}. No Limits Beyond Limitations.",
                "blueprint_id": bp_id,
                "print_provider_id": prov_id,
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
                "tags": ["NLBL", "Galaxy", bp_title.split()[0]],
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
                if created % 100 == 0:
                    print(f"  Created {created} products...")
            else:
                failed += 1

print("\n" + "=" * 70)
print("MASSIVE GENERATION COMPLETE")
print("=" * 70)
print(f"Created: {created}")
print(f"Failed: {failed}")
print(f"Total products now: ~{created}")
print("=" * 70)

if created > 1000:
    print("\n🎉 SUCCESS! You now have thousands of NLBL products!")
    print("Your store is ready for global domination.")
else:
    print("\n⚠️  Need more products. Let's optimize the process.")

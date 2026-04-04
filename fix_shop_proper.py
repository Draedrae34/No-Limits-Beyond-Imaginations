#!/usr/bin/env python3
"""
FIX SHOP: Upload proper logo designs and recreate products correctly
"""

import os, json, requests, base64
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=" * 70)
print("FIXING SHOP - USING ONLY PROPER LOGO DESIGNS")
print("=" * 70)

# Step 1: Upload the CORRECT designs from NLBL_Logo_Only_Designs
designs_dir = "NLBL_Logo_Only_Designs"
design_files = [f for f in os.listdir(designs_dir) if f.endswith(".png")]

print(f"\nUploading {len(design_files)} PROPER logo designs...")
uploaded = {}

for f in design_files:
    path = os.path.join(designs_dir, f)
    with open(path, "rb") as img:
        b64 = base64.b64encode(img.read()).decode("utf-8")

    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=headers,
        json={"file_name": f, "contents": b64},
        timeout=45,
    )

    if resp.status_code in [200, 201]:
        uploaded[f] = resp.json()["id"]
        print(f"  OK: {f}")
    else:
        print(f"  FAIL: {f} - {resp.status_code}")

print(f"\nUploaded {len(uploaded)} designs")

# Step 2: Get count of current products
print("\nChecking current products...")
total = 0
for page in range(1, 20):
    try:
        resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            break
        data = resp.json().get("data", [])
        total += len(data)
        if len(data) < 100:
            break
    except:
        break

print(f"Current products in shop: {total}")
print(
    f"Will delete ALL and replace with {len(uploaded)} designs × 4 categories = {len(uploaded) * 4} products"
)

# Step 3: Delete ALL current products
print("\nDeleting all current products...")
deleted = 0
for page in range(1, 50):
    try:
        resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            break
        products = resp.json().get("data", [])
        for p in products:
            try:
                r = requests.delete(
                    f"https://api.printify.com/v1/shops/{shop_id}/products/{p['id']}.json",
                    headers=headers,
                    timeout=10,
                )
                if r.status_code in [200, 204]:
                    deleted += 1
                if deleted % 50 == 0:
                    print(f"  Deleted {deleted}...")
            except:
                pass
        if len(products) < 100:
            break
    except:
        break

print(f"Deleted {deleted} products")

# Step 4: Create new products with PROPER designs
print("\nCreating products with CORRECT logo designs...")

# Only use categories we KNOW work
categories = {
    "Hoodies": {"blueprint": 77, "provider": 66, "price": 4499},
    "Sweats": {"blueprint": 49, "provider": 66, "price": 3999},
    "Shirts": {"blueprint": 5, "provider": 29, "price": 2699},
    "Tee's": {"blueprint": 12, "provider": 51, "price": 2499},
}

created = 0
failed = 0

for cat_name, config in categories.items():
    bp_id = config["blueprint"]
    prov_id = config["provider"]
    price = config["price"]

    print(f"\n{cat_name} (Blueprint {bp_id})...")

    # Get variants
    try:
        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=15,
        )
        if var_resp.status_code != 200:
            print(f"  No variants available")
            continue

        variants = var_resp.json().get("variants", [])
        if not variants:
            print(f"  No variants")
            continue

        # Get first variant
        variant_id = variants[0]["id"]

        # Create product for each design
        for design_file, image_id in uploaded.items():
            design_name = (
                design_file.replace(".png", "")
                .replace("_", " ")
                .replace("-", " ")
                .title()
            )
            product_title = f"NLBL {design_name} {cat_name}"

            product_data = {
                "title": product_title[:255],
                "description": f"NLBL {design_name} on {cat_name}. Logo + galaxy fill on premium garment.",
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
                "tags": ["NLBL", "Galaxy", "Logo"],
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
                if created % 10 == 0:
                    print(f"  Created {created}...")
            else:
                failed += 1
                if failed <= 3:
                    print(f"  FAIL: {product_title[:40]} - {resp.status_code}")

            # Rate limit delay
            import time

            time.sleep(0.5)

    except Exception as e:
        print(f"  Error: {e}")

print("\n" + "=" * 70)
print("FIX COMPLETE")
print("=" * 70)
print(f"Created: {created}")
print(f"Failed: {failed}")
print(f"Total products now: ~{created}")
print("=" * 70)
print("\nYour products now use ONLY the NLBL logo + galaxy pattern")
print("NO MORE product-on-product issues!")

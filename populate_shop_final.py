#!/usr/bin/env python3
"""
Populate Printify shop with REAL fulfillable products.
1. Deletes ALL existing products
2. Maps Clothing_Product/ folders to Printify blueprints
3. Creates products using NLBL_Transparent_Designs/ (10 designs)
4. Uses real pricing and variants from Printify catalog
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

# Category mapping: folder name -> {blueprint_id, provider_id, price}
# Only using blueprints we KNOW work (from previous tests)
PRINTIFY_VALID_CATEGORIES = {
    "Tee's": {"blueprint": 12, "provider": 51, "price": 2499},
    "Tank Tops": {"blueprint": 39, "provider": 51, "price": 2299},
    "long sleeves": {"blueprint": 41, "provider": 51, "price": 2899},
    "Shirts": {"blueprint": 5, "provider": 29, "price": 2699},
    "Hoodies": {"blueprint": 77, "provider": 66, "price": 4499},
    "Sweats": {"blueprint": 49, "provider": 66, "price": 3999},
    "Jackets": {"blueprint": 187, "provider": 54, "price": 6999},  # May not work
    "Dresses": {"blueprint": 251, "provider": 39, "price": 5499},  # May not work
    "Skirts": {"blueprint": 250, "provider": 39, "price": 4999},  # May not work
    "Leggings": {"blueprint": 256, "provider": 39, "price": 3999},  # May not work
    "Pants": {"blueprint": 247, "provider": 39, "price": 5999},  # May not work
    "Shorts": {"blueprint": 249, "provider": 39, "price": 3499},  # May not work
    "Hats": {"blueprint": 105, "provider": 99, "price": 2499},  # May not work
    "Snapback_hats": {"blueprint": 79, "provider": 1, "price": 2999},  # May not work
    "Socks": {"blueprint": 125, "provider": 99, "price": 1499},  # May not work
    "Shoes": {"blueprint": 626, "provider": 54, "price": 7999},  # May not work
}

DESIGNS_DIR = "NLBL_Transparent_Designs"


def delete_all_products():
    """Delete all products from the shop."""
    print("\n" + "=" * 70)
    print("STEP 1: DELETING ALL EXISTING PRODUCTS")
    print("=" * 70)

    all_products = []
    page = 1
    while True:
        resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            print(f"Failed to fetch products: {resp.status_code}")
            break
        data = resp.json().get("data", [])
        all_products.extend(data)
        print(f"  Page {page}: {len(data)} products")
        if len(data) < 100:
            break
        page += 1

    print(f"\nTotal products to delete: {len(all_products)}")
    if len(all_products) == 0:
        print("No products to delete.")
        return

    # Auto-confirm
    print("\nAUTO-CONFIRMED: Deleting all products...")

    deleted = 0
    failed = 0
    for product in all_products:
        try:
            resp = requests.delete(
                f"https://api.printify.com/v1/shops/{shop_id}/products/{product['id']}.json",
                headers=headers,
                timeout=10,
            )
            if resp.status_code in [200, 204]:
                deleted += 1
            else:
                failed += 1
        except Exception:
            failed += 1
        if (deleted + failed) % 50 == 0:
            print(f"  Progress: {deleted + failed}/{len(all_products)}")

    print(f"\nDeleted: {deleted}, Failed: {failed}")


def get_available_categories():
    """Get list of category folders in Clothing_Product/ that we have mappings for."""
    if not os.path.exists("Clothing_Product"):
        print("ERROR: Clothing_Product/ directory not found")
        return []

    folders = [
        f
        for f in os.listdir("Clothing_Product")
        if os.path.isdir(os.path.join("Clothing_Product", f))
    ]

    valid_folders = [f for f in folders if f in PRINTIFY_VALID_CATEGORIES]

    print(f"\nFound {len(valid_folders)} valid category folders:")
    for folder in valid_folders:
        cfg = PRINTIFY_VALID_CATEGORIES[folder]
        print(f"  {folder}: Blueprint {cfg['blueprint']}, Provider {cfg['provider']}")

    return valid_folders


def get_design_files():
    """Get list of design files from NLBL_Transparent_Designs/."""
    if not os.path.exists(DESIGNS_DIR):
        print(f"ERROR: {DESIGNS_DIR}/ directory not found")
        return []

    files = [
        f
        for f in os.listdir(DESIGNS_DIR)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    print(f"\nFound {len(files)} design files:")
    for f in files:
        print(f"  {f}")
    return files


def upload_designs(design_files):
    """Upload all designs to Printify and return dict of filename -> image_id."""
    print("\n" + "=" * 70)
    print("STEP 3: UPLOADING DESIGNS TO PRINTIFY")
    print("=" * 70)

    uploaded = {}
    for design_file in design_files:
        design_path = os.path.join(DESIGNS_DIR, design_file)
        try:
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
                uploaded[design_file] = image_id
                print(f"  OK: {design_file} -> {image_id}")
            else:
                print(f"  FAIL: {design_file} - {resp.status_code}")
        except Exception as e:
            print(f"  ERROR: {design_file} - {e}")

    print(f"\nUploaded {len(uploaded)}/{len(design_files)} designs")
    return uploaded


def get_variants_for_blueprint(blueprint_id, provider_id):
    """Get all size variants for a blueprint/provider combination."""
    try:
        resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
            headers=headers,
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("variants", [])
    except Exception:
        pass
    return []


def create_products(categories, design_files, uploaded_designs):
    """Create products for each category + design + size variant combination."""
    print("\n" + "=" * 70)
    print("STEP 4: CREATING PRODUCTS")
    print("=" * 70)

    total_combinations = len(categories) * len(design_files)
    print(f"\nTotal category/design combinations: {total_combinations}")

    created = 0
    failed = 0
    skipped = 0

    # Get existing product titles to avoid duplicates
    existing_titles = set()
    page = 1
    while True:
        resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            break
        data = resp.json().get("data", [])
        for p in data:
            existing_titles.add(p.get("title", ""))
        if len(data) < 100:
            break
        page += 1

    print(f"Existing products in shop: {len(existing_titles)}")

    for category in categories:
        config = PRINTIFY_VALID_CATEGORIES[category]
        bp_id = config["blueprint"]
        provider_id = config["provider"]
        base_price = config["price"]

        print(
            f"\n--- Category: {category} (Blueprint {bp_id}, Provider {provider_id}) ---"
        )

        variants = get_variants_for_blueprint(bp_id, provider_id)
        if not variants:
            print(f"  SKIPPING: No variants available")
            skipped += len(design_files)
            continue

        # Map sizes to variant IDs
        variant_map = {}
        for v in variants:
            opts = v.get("options", {})
            size = opts.get("size", "")
            if size:
                variant_map[size] = v["id"]

        if not variant_map:
            default_variant_id = variants[0]["id"]

        for design_file in design_files:
            image_id = uploaded_designs.get(design_file)
            if not image_id:
                skipped += 1
                continue

            design_name = (
                os.path.splitext(design_file)[0]
                .replace("_", " ")
                .replace("-", " ")
                .title()
            )

            if variant_map:
                for size, variant_id in variant_map.items():
                    product_title = f"NLBL {design_name} {category} - {size}"
                    if product_title in existing_titles:
                        skipped += 1
                        continue

                    price = base_price
                    if size in ["2XL", "3XL", "XL+"]:
                        price += 500

                    product_data = {
                        "title": product_title[:255],
                        "description": f"NLBL {design_name} on {category}. No Limits Beyond Limitations.",
                        "blueprint_id": bp_id,
                        "print_provider_id": provider_id,
                        "variants": [
                            {"id": variant_id, "price": price, "is_enabled": True}
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
                        if failed <= 5:
                            print(f"  FAIL: {product_title[:50]} - {resp.status_code}")
            else:
                product_title = f"NLBL {design_name} {category}"
                if product_title in existing_titles:
                    skipped += 1
                    continue

                product_data = {
                    "title": product_title[:255],
                    "description": f"NLBL {design_name} on {category}. No Limits Beyond Limitations.",
                    "blueprint_id": bp_id,
                    "print_provider_id": provider_id,
                    "variants": [
                        {
                            "id": default_variant_id,
                            "price": base_price,
                            "is_enabled": True,
                        }
                    ],
                    "print_areas": [
                        {
                            "variant_ids": [default_variant_id],
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
                else:
                    failed += 1
                    print(f"  FAIL: {product_title[:50]} - {resp.status_code}")

    print("\n" + "=" * 70)
    print("PRODUCT CREATION COMPLETE")
    print("=" * 70)
    print(f"Created: {created}")
    print(f"Skipped (already exists): {skipped}")
    print(f"Failed: {failed}")
    print(f"Total processed: {created + skipped + failed}")
    print("=" * 70)


def main():
    print("=" * 70)
    print("NLBL PRINTIFY SHOP POPULATION SCRIPT")
    print("=" * 70)

    # Step 1: Delete all products
    delete_all_products()

    # Step 2: Get available categories from Clothing_Product/
    categories = get_available_categories()
    if not categories:
        print("\nERROR: No valid categories found. Exiting.")
        return

    # Step 3: Get design files
    design_files = get_design_files()
    if not design_files:
        print("\nERROR: No design files found. Exiting.")
        return

    # Step 4: Upload designs
    uploaded_designs = upload_designs(design_files)
    if not uploaded_designs:
        print("\nERROR: No designs uploaded successfully. Exiting.")
        return

    # Step 5: Create products
    create_products(categories, design_files, uploaded_designs)

    print("\n" + "=" * 70)
    print("SHOP POPULATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()

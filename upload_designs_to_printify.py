#!/usr/bin/env python
"""
Upload designs from Clothing_Product directory to Printify and create products.
This script will:
1. Scan Clothing_Product directory for design images
2. Upload each image to Printify
3. Create products with those designs
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from printify_client import PrintifyAPI

# Load environment variables
load_dotenv()

# Configuration
CLOTHING_PRODUCT_DIR = "Clothing_Product"
DESIGN_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'}

# Printify API setup
token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

if not token or not shop_id:
    print("Error: PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID must be set in .env")
    exit(1)

client = PrintifyAPI(token, shop_id)

def get_design_files():
    """Scan Clothing_Product directory for design image files."""
    design_files = []
    base_path = Path(CLOTHING_PRODUCT_DIR)

    if not base_path.exists():
        print(f"Error: {CLOTHING_PRODUCT_DIR} directory not found")
        return design_files

    # Scan for image files
    for file_path in base_path.rglob("*"):
        if file_path.is_file() and file_path.suffix in DESIGN_EXTENSIONS:
            design_files.append(str(file_path))

    return design_files

def upload_design_to_printify(file_path):
    """Upload a design image to Printify."""
    try:
        print(f"  Uploading: {file_path}")
        result = client.upload_image(file_path)
        print(f"  [OK] Uploaded successfully (ID: {result.get('id')})")
        return result
    except Exception as e:
        print(f"  [X] Failed to upload: {e}")
        return None

def create_product_with_design(design_id, design_name, product_type="t-shirt"):
    """Create a product with the uploaded design."""
    try:
        # Use known blueprint IDs from existing products
        # T-shirt: blueprint 706, provider 99
        blueprint_id = 706
        print_provider_id = 99

        # Get variants from existing product to use as template
        existing_products = client.get_products(limit=1)
        if not existing_products:
            print(f"  [X] No existing products to get variants from")
            return None

        existing_product = existing_products[0]
        variants = existing_product.get('variants', [])

        if not variants:
            print(f"  [X] No variants found in existing product")
            return None

        # Create product data
        product_data = {
            "title": design_name,
            "description": f"Custom design: {design_name}",
            "blueprint_id": blueprint_id,
            "print_provider_id": print_provider_id,
            "variants": [
                {
                    "id": variants[0].get("id"),
                    "price": 2499,  # $24.99
                    "is_enabled": True
                }
            ] if variants else [],
            "print_areas": [
                {
                    "variant_ids": [variants[0].get("id")] if variants else [],
                    "placeholders": [
                        {
                            "position": "front",
                            "images": [
                                {
                                    "id": design_id,
                                    "x": 0.5,
                                    "y": 0.5,
                                    "scale": 1,
                                    "angle": 0
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        print(f"  Creating product: {design_name}")
        result = client.create_product(product_data)
        print(f"  [OK] Product created (ID: {result.get('id')})")
        return result
    except Exception as e:
        print(f"  [X] Failed to create product: {e}")
        return None

def main():
    print("=" * 60)
    print("Printify Design Upload & Product Creation")
    print("=" * 60)

    # Get design files
    print("\nScanning for design files...")
    design_files = get_design_files()
    print(f"Found {len(design_files)} design files")

    if not design_files:
        print("No design files found. Exiting.")
        return

    # Process each design
    successful_uploads = 0
    successful_products = 0

    for i, file_path in enumerate(design_files, 1):  # Upload all designs
        print(f"\n[{i}/{min(10, len(design_files))}] Processing: {file_path}")

        # Extract design name from filename
        design_name = Path(file_path).stem.replace("_", " ").replace("-", " ").title()

        # Upload design
        upload_result = upload_design_to_printify(file_path)
        if not upload_result:
            continue

        successful_uploads += 1

        # Create product with design
        product_result = create_product_with_design(
            upload_result.get("id"),
            design_name
        )

        if product_result:
            successful_products += 1

        # Rate limiting - wait between requests
        time.sleep(1)

    # Summary
    print("\n" + "=" * 60)
    print("UPLOAD SUMMARY")
    print("=" * 60)
    print(f"Total designs found: {len(design_files)}")
    print(f"Designs processed: {min(10, len(design_files))}")
    print(f"Successful uploads: {successful_uploads}")
    print(f"Successful products: {successful_products}")
    print("=" * 60)

if __name__ == "__main__":
    main()

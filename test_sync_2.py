#!/usr/bin/env python3
"""Test sync of 2 products to Printify"""

import os
import json
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")

print(f"Shop ID: {shop_id}")
print(f"Token: {token[:20]}...")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Load catalog
with open("nlbl_galaxy_catalog.json", "r") as f:
    catalog = json.load(f)

products = catalog["products"][:2]  # Test first 2 products
print(f"\nTesting sync of {len(products)} products...")

for product in products:
    print(f"\n--- Syncing: {product['name']} ---")

    # Upload design
    design_path = f"galaxy_designs/{product['image'].replace('galaxy_', '').replace('.png', '.png')}"
    design_path = design_path.replace("cosmic_nebula", "cosmic_nebula").replace(
        "stellar_dust", "stellar_dust"
    )

    # Map product names to actual design files
    theme_map = {
        "Cosmic Nebula": "cosmic_nebula",
        "Stellar Dust": "stellar_dust",
        "Galactic Core": "galactic_core",
        "Milky Way": "milky_way",
        "Aurora Borealis": "aurora_borealis",
        "Meteor Shower": "meteor_shower",
        "Black Hole": "black_hole",
        "Solar Flare": "solar_flare",
        "Supernova": "supernova",
        "Eclipse": "eclipse",
    }

    theme = None
    for key, val in theme_map.items():
        if key in product["name"]:
            theme = val
            break

    if theme:
        design_path = f"galaxy_designs/{theme}.png"
    else:
        design_path = "galaxy_designs/cosmic_nebula.png"

    print(f"Design path: {design_path}")

    if os.path.exists(design_path):
        with open(design_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")

        upload_payload = {"file_name": f"{theme}.png", "contents": img_data}

        upload_resp = requests.post(
            "https://api.printify.com/v1/uploads/images.json",
            headers=headers,
            json=upload_payload,
            timeout=30,
        )

        if upload_resp.status_code in [200, 201]:
            image_id = upload_resp.json()["id"]
            print(f"Image uploaded: {image_id}")

            # Get variants
            blueprint_id = product["blueprint_id"]

            # Get print provider first
            provider_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers.json",
                headers=headers,
                timeout=30,
            )

            provider_id = 16
            if provider_resp.status_code == 200:
                providers = provider_resp.json()
                if providers:
                    provider_id = providers[0]["id"]
                    print(f"Using print provider: {provider_id}")

            # Get variants for blueprint + provider
            variants_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
                headers=headers,
                timeout=30,
            )

            if variants_resp.status_code == 200:
                variants_data = variants_resp.json()
                variants = variants_data.get("variants", [])
                print(f"Found {len(variants)} variants for blueprint {blueprint_id}")

            # Get variants for blueprint + provider
            variants_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
                headers=headers,
                timeout=30,
            )

            if variants_resp.status_code == 200:
                variants_data = variants_resp.json()
                variants = variants_data.get("variants", [])
                print(f"Found {len(variants)} variants for blueprint {blueprint_id}")

                # Create product
                product_data = {
                    "title": product["name"][:255],
                    "description": product.get("description", "NLBL Galaxy Collection"),
                    "blueprint_id": blueprint_id,
                    "print_provider_id": provider_id,
                    "variants": [
                        {
                            "id": variants[0]["id"],
                            "price": int(product["price"] * 100),
                            "is_enabled": True,
                        }
                    ],
                    "print_areas": [
                        {
                            "variant_ids": [variants[0]["id"]],
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
                    "tags": product.get("tags", ["NLBL", "Galaxy"]),
                    "visible": True,
                }

                create_resp = requests.post(
                    f"https://api.printify.com/v1/shops/{shop_id}/products.json",
                    headers=headers,
                    json=product_data,
                    timeout=30,
                )

                print(f"Create product status: {create_resp.status_code}")
                if create_resp.status_code in [200, 201]:
                    print(f"SUCCESS! Product ID: {create_resp.json().get('id')}")
                else:
                    print(f"FAILED: {create_resp.text[:300]}")
            else:
                print(f"Failed to get variants: {variants_resp.status_code}")
        else:
            print(
                f"Upload failed: {upload_resp.status_code} - {upload_resp.text[:200]}"
            )
    else:
        print(f"Design not found: {design_path}")

print("\nTest complete!")

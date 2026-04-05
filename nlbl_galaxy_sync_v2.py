#!/usr/bin/env python3
"""
Updated NLBL Galaxy Sync with correct blueprint/provider mappings
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()


class NLBLGalaxySync:
    def __init__(self):
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        self.shop_id = os.getenv("PRINTIFY_SHOP_ID")

        if not self.token or not self.shop_id:
            print("[ERROR] Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID in .env")
            exit(1)

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        # Load provider mapping
        self.provider_map = {}
        if os.path.exists("blueprint_provider_map.json"):
            with open("blueprint_provider_map.json", "r") as f:
                self.provider_map = json.load(f)
            print(f"Loaded provider map with {len(self.provider_map)} entries")

    def get_provider_for_blueprint(self, blueprint_id):
        """Get the correct provider ID for a blueprint"""
        provider_id = self.provider_map.get(
            str(blueprint_id), 29
        )  # Default to Monster Digital
        print(f"   Using provider {provider_id} for blueprint {blueprint_id}")
        return provider_id

    def load_nlbl_catalog(self):
        """Load the NLBL galaxy catalog"""
        try:
            with open("nlbl_galaxy_catalog.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            print(
                "ERROR: nlbl_galaxy_catalog.json not found. Run get_printify_catalog.py first"
            )
            return None

    def load_design_mapping(self):
        """Load the galaxy design mapping"""
        try:
            with open("galaxy_designs.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            print(
                "ERROR: galaxy_designs.json not found. Run create_galaxy_designs.py first"
            )
            return None

    def upload_design_to_printify(self, design_path):
        """Upload galaxy design to Printify using base64"""
        import base64

        try:
            if not os.path.exists(design_path):
                print(f"   [WARN] Design not found: {design_path}")
                return None

            with open(design_path, "rb") as f:
                img_data = base64.b64encode(f.read()).decode("utf-8")

            file_name = os.path.basename(design_path)
            payload = {"file_name": file_name, "contents": img_data}

            response = requests.post(
                "https://api.printify.com/v1/uploads/images.json",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=30,
            )

            if response.status_code in [200, 201]:
                data = response.json()
                print(f"   [OK] Uploaded {file_name} -> ID: {data.get('id')}")
                return data.get("id")
            else:
                print(
                    f"   [WARN] Upload failed: {response.status_code} - {response.text[:200]}"
                )
                return None

        except Exception as e:
            print(f"   [WARN] Upload error: {e}")
            return None

    def sync_product_to_printify(self, product, design_mapping):
        """Sync individual product to Printify"""
        product_name = product["name"]
        blueprint_id = product["blueprint_id"]

        print(f"   SYNCING: {product_name}")

        try:
            # Get design path from theme
            theme = self.extract_theme_from_name(product_name)
            design_path = design_mapping.get("designs", {}).get(theme)

            if not design_path or not os.path.exists(design_path):
                print(f"   WARNING: Design not found for theme: {theme}")
                self.stats["failed"] += 1
                return False

            # Upload design
            image_id = self.upload_design_to_printify(design_path)
            if not image_id:
                print(f"   FAILED: Design upload failed")
                self.stats["failed"] += 1
                return False

            # Get correct provider for this blueprint
            provider_id = self.get_provider_for_blueprint(blueprint_id)

            # Get variants for blueprint + provider combination
            variants_response = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
                headers=self.headers,
                timeout=30,
            )

            if variants_response.status_code != 200:
                print(
                    f"   FAILED: Could not get variants for blueprint {blueprint_id}, provider {provider_id}"
                )
                self.stats["failed"] += 1
                return False

            variants = variants_response.json().get("variants", [])
            if not variants:
                print(
                    f"   FAILED: No variants found for blueprint {blueprint_id}, provider {provider_id}"
                )
                self.stats["failed"] += 1
                return False

            # Create product variants (use first variant)
            product_variants = [
                {
                    "id": variants[0]["id"],
                    "price": int(product["price"] * 100),
                    "is_enabled": True,
                }
            ]

            # Create product data
            product_data = {
                "title": product_name[:255],
                "description": product.get(
                    "description", f"{product_name} - NLBL Galaxy Collection"
                ),
                "blueprint_id": blueprint_id,
                "print_provider_id": provider_id,
                "variants": product_variants,
                "print_areas": [
                    {
                        "variant_ids": [v["id"] for v in product_variants],
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
                "tags": product.get("tags", ["NLBL", "Galaxy", "Cosmic"]),
                "visible": product.get("visible", True),
            }

            # Create product in Printify
            response = requests.post(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json",
                headers=self.headers,
                json=product_data,
                timeout=30,
            )

            if response.status_code in [200, 201]:
                self.stats["created"] += 1
                print(f"   SUCCESS: {product_name}")
                return True
            else:
                error_msg = response.json().get("message", "Unknown error")
                print(f"   FAILED: {error_msg}")
                self.stats["failed"] += 1
                return False

        except Exception as e:
            print(f"   ERROR: {str(e)[:100]}")
            self.stats["failed"] += 1
            return False

    def extract_theme_from_name(self, product_name):
        """Extract galaxy theme from product name"""
        themes = [
            "cosmic_nebula",
            "stellar_dust",
            "galactic_core",
            "milky_way",
            "aurora_borealis",
            "meteor_shower",
            "black_hole",
            "solar_flare",
            "supernova",
            "eclipse",
        ]

        for theme in themes:
            if theme.replace("_", " ").title() in product_name:
                return theme

        return themes[hash(product_name) % len(themes)]

    def sync_all_products(self):
        """Sync all NLBL galaxy products to Printify"""
        print("\nNLBL GALAXY SYNC TO PRINTIFY")
        print("=" * 50)

        catalog = self.load_nlbl_catalog()
        if not catalog:
            return

        designs = self.load_design_mapping()
        if not designs:
            return

        products = catalog.get("products", [])
        print(f"Syncing {len(products)} galaxy-themed products...")

        # Check existing products
        try:
            existing_response = requests.get(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json?limit=250",
                headers=self.headers,
                timeout=30,
            )

            existing_titles = set()
            if existing_response.status_code == 200:
                existing_data = existing_response.json()
                existing_titles = {p["title"] for p in existing_data.get("data", [])}

            print(f"Found {len(existing_titles)} existing products in Printify")
        except:
            existing_titles = set()
            print("WARNING: Could not check existing products")

        # Sync products (limit to first 10 for testing)
        for i, product in enumerate(products[:10], 1):
            product_name = product["name"]

            if product_name in existing_titles:
                self.stats["skipped"] += 1
                print(f"   SKIPPED (exists): {product_name}")
                continue

            success = self.sync_product_to_printify(product, designs)

            if i % 5 == 0:
                progress = (i / len(products)) * 100
                print(f"\n  [{i}/{len(products)}] Progress: {progress:.1f}%")
                print(
                    f"  Created: {self.stats['created']} | Skipped: {self.stats['skipped']} | Failed: {self.stats['failed']}"
                )

        # Final stats
        print("\n" + "=" * 50)
        print("SYNC COMPLETE")
        print("=" * 50)
        print(f"Successfully Created: {self.stats['created']}")
        print(f"Skipped (exists): {self.stats['skipped']}")
        print(f"Failed: {self.stats['failed']}")
        print(
            f"Total NLBL Galaxy Products: {self.stats['created'] + self.stats['skipped']}"
        )

    def create_website_feed(self):
        """Create website product feed"""
        print("\nCreating website product feed...")

        try:
            catalog = self.load_nlbl_catalog()
            if not catalog:
                return

            web_products = []
            for product in catalog.get("products", []):
                web_product = {
                    "id": product["id"],
                    "name": product["name"],
                    "category": product["category"],
                    "price": product["price"],
                    "image": f"galaxy_designs/{self.extract_theme_from_name(product['name'])}.png",
                    "description": product["description"],
                    "tags": product.get("tags", []),
                }
                web_products.append(web_product)

            web_feed = {
                "source": "NLBL Galaxy Collection",
                "total_products": len(web_products),
                "products": web_products,
            }

            with open("nlbl_galaxy_shop.json", "w") as f:
                json.dump(web_feed, f, indent=2)

            print("[OK] Website feed saved: nlbl_galaxy_shop.json")
            print(f"[INFO] {len(web_products)} products ready for website display")

        except Exception as e:
            print(f"[ERROR] Error creating website feed: {e}")


def main():
    """Main function"""
    print("NLBL GALAXY COMPLETE SYNC")
    print("=" * 50)
    print("This will sync your NLBL galaxy-themed products to Printify & website")

    if not os.path.exists("nlbl_galaxy_catalog.json"):
        print(
            "ERROR: Missing nlbl_galaxy_catalog.json - Run get_printify_catalog.py first"
        )
        return

    if not os.path.exists("galaxy_designs.json"):
        print("ERROR: Missing galaxy_designs.json - Run create_galaxy_designs.py first")
        return

    if not os.path.exists("galaxy_designs"):
        print(
            "ERROR: Missing galaxy_designs/ folder - Run create_galaxy_designs.py first"
        )
        return

    syncer = NLBLGalaxySync()
    syncer.sync_all_products()
    syncer.create_website_feed()

    print("\n" + "=" * 50)
    print("NLBL GALAXY SYNC COMPLETE!")
    print("=" * 50)
    print("Your galaxy-themed NLBL products are now live!")
    print("Check your Printify dashboard")


if __name__ == "__main__":
    main()

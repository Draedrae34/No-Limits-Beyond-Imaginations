#!/usr/bin/env python3
"""
NLBL to Printify SYNC - Upload all products with correct names, prices, images
This is the MASTER sync that puts everything live on Printify
"""
import os
import json
import requests
import time
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class PrintifySyncMaster:
    def __init__(self):
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        self.shop_id = os.getenv("PRINTIFY_SHOP_ID")

        if not self.token:
            print("❌ PRINTIFY_API_TOKEN not found in .env")
            exit(1)
        if not self.shop_id:
            print("❌ PRINTIFY_SHOP_ID not found in .env")
            exit(1)

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        self.stats = {
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
            "success": 0
        }

    def upload_image_to_printify(self, image_path):
        """Upload image to Printify and get print file ID"""
        try:
            if not os.path.exists(image_path):
                print(f"   ⚠️  Image not found: {image_path}")
                return None

            with open(image_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(
                    f"https://api.printify.com/v1/uploads/images.json",
                    headers={"Authorization": f"Bearer {self.token}"},
                    files=files,
                    timeout=30
                )

            if response.status_code == 201:
                return response.json().get('id')
            else:
                print(f"   ⚠️  Image upload failed: {response.status_code}")
                return None

        except Exception as e:
            print(f"   ⚠️  Error uploading image: {e}")
            return None

    def get_provider_and_variants(self, blueprint_id):
        """Get the first available print provider and its variants for a blueprint"""
        try:
            # 1. Fetch available print providers for this blueprint
            providers_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers.json",
                headers=self.headers,
                timeout=30
            )
            if providers_resp.status_code != 200 or not providers_resp.json():
                return None, []
            
            provider = providers_resp.json()[0]
            provider_id = provider['id']
            
            # 2. Fetch variants specific to this provider
            variants_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json",
                headers=self.headers,
                timeout=30
            )
            if variants_resp.status_code == 200:
                return provider_id, variants_resp.json().get('variants', [])
            return None, []
        except Exception:
            return None, []

    def sync_product_to_printify(self, product, existing_products):
        """Upload single product to Printify"""

        product_name = product['name']
        product_id = product['id']

        # Check if already exists
        if product_name in existing_products:
            self.stats['skipped'] += 1
            print(f"   ⏭️  SKIPPED (exists): {product_name}")
            return

        try:
            # Get image path
            image_path = product.get('image', '')
            script_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.normpath(os.path.join(script_dir, image_path))

            # Build product for Printify
            print(f"   📤 Uploading: {product_name}")

            blueprint_id = product.get('blueprint_id', 0)
            provider_id, variants = self.get_provider_and_variants(blueprint_id)

            if not provider_id or not variants:
                self.stats['failed'] += 1
                print(f"   ❌ FAILED: No provider/variants found for blueprint {blueprint_id}")
                return

            # Clean price and cost (ensure they are floats)
            try:
                price_val = float(product.get('price', 24.99))
                cost_val = float(product.get('cost', 10.0))
            except (ValueError, TypeError):
                price_val = 24.99
                cost_val = 10.0

            # Upload image and get file ID
            image_id = self.upload_image_to_printify(full_path)
            if not image_id:
                self.stats['failed'] += 1
                print(f"   ❌ FAILED: Image upload failed for {product_name}")
                return

            # Select available variants with pricing
            product_variants = []
            for var in variants:
                # Only add enabled variants
                if var.get('is_enabled', True):
                    product_variants.append({
                        "id": var.get('id'),
                        "price": int(price_val * 100),  # Convert to cents
                        "is_enabled": True
                    })

            if not product_variants:
                print(f"   ❌ FAILED: All variants disabled for blueprint {blueprint_id}")
                return

            # Create product data with dynamic provider
            product_data = {
                "title": product_name[:255],
                "description": product.get('description', f"{product_name} - NLBL Legacy Collection"),
                "blueprint_id": blueprint_id,
                "print_provider_id": provider_id,
                "variants": product_variants,
                "print_areas": [
                    {
                        "variant_ids": [v['id'] for v in product_variants],
                        "placeholders": [
                            {
                                "position": "front",
                                "images": [{"id": image_id, "x": 0.5, "y": 0.5, "scale": 1, "angle": 0}]
                            }
                        ]
                    }
                ],
                "tags": product.get('tags', ['NLBL']),
                "visible": product.get('visible', True)
            }

            # Upload to Printify
            response = requests.post(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json",
                headers=self.headers,
                json=product_data,
                timeout=30
            )

            if response.status_code in [200, 201]:
                self.stats['created'] += 1
                self.stats['success'] += 1
                print(f"   ✅ CREATED: {product_name} - ${price_val:.2f}")
                return True
            else:
                self.stats['failed'] += 1
                error_msg = response.json().get('message', 'Unknown error')
                print(f"   ❌ FAILED: {error_msg}")
                return False

        except requests.exceptions.Timeout:
            self.stats['failed'] += 1
            print(f"   ❌ TIMEOUT: {product_name}")
            return False
        except Exception as e:
            self.stats['failed'] += 1
            print(f"   ❌ ERROR: {str(e)[:100]}")
            return False

    def get_existing_products(self):
        """Get all products already in Printify"""
        try:
            response = requests.get(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json?limit=250",
                headers=self.headers,
                timeout=30
            )

            if response.status_code == 200:
                products = response.json().get('data', [])
                return {p['title']: p['id'] for p in products}
            return {}
        except Exception as e:
            print(f"⚠️  Could not fetch existing products: {e}")
            return {}

    def sync_all(self, catalog_file="products_catalog.json", batch_delay=1):
        """Sync entire catalog to Printify"""

        print(f"\n📦 Loading catalog from {catalog_file}...")

        try:
            with open(catalog_file, 'r') as f:
                catalog = json.load(f)
        except Exception as e:
            print(f"❌ Could not load catalog: {e}")
            print(f"\nFirst, run: python3 generate-product-catalog.py")
            return

        products = catalog.get('products', [])
        print(f"📊 Total products to sync: {len(products)}")

        # Get existing products
        print("\n🔍 Checking existing products...")
        existing = self.get_existing_products()
        print(f"   Found {len(existing)} existing products in Printify")

        # Start sync
        print(f"\n🚀 Starting sync to Printify...")
        start_time = time.time()

        for idx, product in enumerate(products, 1):
            self.sync_product_to_printify(product, existing)

            # Progress updates
            if idx % 20 == 0:
                elapsed = time.time() - start_time
                rate = idx / elapsed if elapsed > 0 else 0
                eta = (len(products) - idx) / rate if rate > 0 else 0
                progress = (idx / len(products)) * 100
                print(f"\n  [{idx}/{len(products)}] Progress: {progress:.1f} percent")
                print(f"  Rate: {rate:.1f} products/sec | ETA: {eta:.0f}s")

            # Rate limiting
            if idx % 50 == 0 and idx < len(products):
                print(f"   ⏸️  Rate limit pause...")
                time.sleep(batch_delay)

        elapsed = time.time() - start_time
        self.print_summary(elapsed)

    def print_summary(self, elapsed):
        """Print sync summary"""
        total = sum(self.stats.values())

        print(f"\n{'='*60}")
        print(f"✅ SYNC COMPLETE")
        print(f"{'='*60}")
        print(f"✨ Successfully Created: {self.stats['success']}")
        print(f"🔄 Updated: {self.stats['updated']}")
        print(f"⏭️  Skipped (exists): {self.stats['skipped']}")
        print(f"❌ Failed: {self.stats['failed']}")
        print(f"{'='*60}")
        print(f"⏱️  Total Time: {elapsed:.1f} seconds")
        print(f"📈 Rate: {(self.stats['success']/elapsed):.1f} products/sec" if elapsed > 0 else "")
        print(f"\n💰 Your Printify shop now has {self.stats['success'] + self.stats['skipped']} products!")

if __name__ == "__main__":
    print("\n🚀 NLBL PRINTIFY MASTER SYNC 🚀")
    print("=" * 60)
    print("This syncs your complete product catalog to Printify")
    print("with correct names, prices, and images.\n")

    syncer = PrintifySyncMaster()
    syncer.sync_all()

    print(f"\n🎯 Next steps:")
    print(f"   1. Check your Printify dashboard")
    print(f"   2. Verify all {syncer.stats['success']} products are there")
    print(f"   3. Run: python3 generate-shop-feed.py")
    print(f"   4. Update your website to use the new product feed")

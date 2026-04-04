#!/usr/bin/env python3
"""
NLBL BULK PRODUCT UPLOAD - Sync All 2000+ Products to Printify
Handles batch uploads with rate limiting and progress tracking
"""
import os
import json
import requests
import time
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class PrintifyBulkUploader:
    def __init__(self):
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        self.shop_id = os.getenv("PRINTIFY_SHOP_ID")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        self.uploaded = 0
        self.failed = 0
        self.skipped = 0
        self.upload_log = []

    def validate_credentials(self):
        """Verify credentials are valid"""
        try:
            response = requests.get(
                "https://api.printify.com/v1/shops.json",
                headers=self.headers,
                timeout=10
            )
            if response.status_code != 200:
                print(f"❌ Invalid credentials: {response.status_code}")
                return False
            print("✅ Credentials verified!")
            return True
        except Exception as e:
            print(f"❌ Credential check failed: {e}")
            return False

    def get_existing_products(self):
        """Get list of products already in Printify"""
        try:
            response = requests.get(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json",
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                existing = {p['title']: p['id'] for p in data.get('data', [])}
                print(f"✅ Found {len(existing)} existing products in Printify")
                return existing
            return {}
        except Exception as e:
            print(f"⚠️ Could not fetch existing products: {e}")
            return {}

    def get_blueprint_variants(self, blueprint_id=0):
        """Get variant options for a blueprint (default: T-Shirt)"""
        try:
            response = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/variants.json",
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception:
            return []

    def create_product(self, product_name, blueprint_id=0):
        """Create a single product in Printify"""
        try:
            # Get variants for this blueprint
            variants_response = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/variants.json",
                headers=self.headers,
                timeout=30
            )

            if variants_response.status_code != 200:
                return False, "Could not fetch variants"

            variants = variants_response.json()

            # Create product with first variant
            product_data = {
                "title": product_name[:255],  # Printify title limit
                "description": f"NLBL Legacy Collection - {product_name}",
                "blueprint_id": blueprint_id,
                "print_providers": [1],  # Default print provider
                "variants": [
                    {
                        "id": var.get('id'),
                        "price": int(var.get('price', 2500)),  # Default $25
                        "title": var.get('title', 'Default'),
                    }
                    for var in variants[:5]  # Limit to 5 variants per product
                ][:1]  # Start with 1 variant
            }

            response = requests.post(
                f"https://api.printify.com/v1/shops/{self.shop_id}/products.json",
                headers=self.headers,
                json=product_data,
                timeout=30
            )

            if response.status_code in [200, 201]:
                self.uploaded += 1
                return True, "Created"
            else:
                self.failed += 1
                return False, f"HTTP {response.status_code}"

        except requests.exceptions.Timeout:
            self.failed += 1
            return False, "Timeout"
        except Exception as e:
            self.failed += 1
            return False, str(e)

    def bulk_upload(self, json_file="all_products_inventory.json", batch_size=50):
        """Upload all products from JSON file"""
        print(f"\n📦 Loading products from {json_file}...")

        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ Could not load file: {e}")
            return

        # Extract product list
        if isinstance(data, dict):
            if 'products' in data:
                products = data['products']
            elif 'data' in data:
                products = data['data']
            else:
                products = list(data.values()) if data else []
        else:
            products = data if isinstance(data, list) else []

        print(f"📊 Total products to upload: {len(products)}")

        # Check existing products
        existing = self.get_existing_products()

        # Start upload
        print(f"\n🚀 Starting bulk upload...")
        start_time = datetime.now()

        for idx, product in enumerate(products, 1):
            # Extract product name
            if isinstance(product, dict):
                product_name = product.get('name') or product.get('title') or f"Product_{idx}"
            else:
                product_name = str(product)

            # Skip if already exists
            if product_name in existing:
                self.skipped += 1
                status = "SKIPPED (exists)"
            else:
                success, msg = self.create_product(product_name)
                status = f"UPLOADED: {msg}" if success else f"FAILED: {msg}"

            # Log result
            self.upload_log.append({
                "index": idx,
                "name": product_name,
                "status": status
            })

            # Progress output
            if idx % 10 == 0:
                elapsed = (datetime.now() - start_time).total_seconds()
                rate = idx / elapsed if elapsed > 0 else 0
                eta = (len(products) - idx) / rate if rate > 0 else 0
                print(f"  [{idx}/{len(products)}] {status} (Rate: {rate:.1f}/sec, ETA: {eta:.0f}s)")

            # Rate limiting - Printify allows ~10 requests/sec
            if idx % batch_size == 0:
                print(f"⏸️  Batch {idx//batch_size} complete. Waiting 2 seconds...")
                time.sleep(2)

        # Summary
        elapsed = (datetime.now() - start_time).total_seconds()
        self.print_summary(len(products), elapsed)

    def print_summary(self, total, elapsed):
        """Print upload summary"""
        print(f"\n{'='*60}")
        print(f"📊 UPLOAD COMPLETE")
        print(f"{'='*60}")
        print(f"✅ Uploaded: {self.uploaded}")
        print(f"❌ Failed: {self.failed}")
        print(f"⏭️  Skipped: {self.skipped}")
        print(f"📈 Total Processed: {total}")
        print(f"⏱️  Time Elapsed: {elapsed:.1f} seconds")
        print(f"📈 Rate: {total/elapsed:.1f} products/sec")
        print(f"\n🎯 Your Printify shop now has {self.skipped + self.uploaded} products!")

        # Save log
        log_file = f"upload_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(self.upload_log[-20:], f, indent=2)  # Save last 20 for review
        print(f"📝 Log saved to {log_file}")

if __name__ == "__main__":
    print("🌌 SILENT SPIRITS LEGACY - BULK UPLOADER 🌌")
    print("=" * 60)

    uploader = PrintifyBulkUploader()

    if not uploader.validate_credentials():
        print("❌ Please set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in .env")
        exit(1)

    # Start upload
    uploader.bulk_upload("all_products_inventory.json", batch_size=50)

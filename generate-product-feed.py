#!/usr/bin/env python3
"""
NLBL Product Feed Generator - Creates product catalog for website
Generates JSON feed from Printify or local inventory
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

class ProductFeedGenerator:
    def __init__(self):
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        self.shop_id = os.getenv("PRINTIFY_SHOP_ID")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def fetch_printify_products(self):
        """Fetch all products from Printify"""
        all_products = []
        page = 1

        print("🔄 Fetching products from Printify...")

        while True:
            try:
                response = requests.get(
                    f"https://api.printify.com/v1/shops/{self.shop_id}/products.json?page={page}",
                    headers=self.headers,
                    timeout=30
                )

                if response.status_code != 200:
                    break

                data = response.json()
                products = data.get('data', [])

                if not products:
                    break

                all_products.extend(products)
                page += 1

                print(f"  Page {page-1}: {len(products)} products (Total: {len(all_products)})")

            except Exception as e:
                print(f"⚠️  Error fetching page {page}: {e}")
                break

        return all_products

    def format_product_for_web(self, printify_product):
        """Convert Printify product to web format"""
        return {
            "id": printify_product.get('id'),
            "name": printify_product.get('title'),
            "description": printify_product.get('description', ''),
            "image": printify_product.get('images', [{}])[0].get('src', ''),
            "price": min([
                v.get('price', 2500)
                for v in printify_product.get('variants', [])
            ]) / 100,  # Convert cents to dollars
            "variants": len(printify_product.get('variants', [])),
            "status": printify_product.get('status', 'draft'),
            "visible": printify_product.get('visible', False)
        }

    def generate_feed(self, output_file="product-feed.json"):
        """Generate complete product feed"""

        # Try Printify first
        if self.token and self.shop_id:
            products = self.fetch_printify_products()
            if products:
                feed = {
                    "source": "printify",
                    "total": len(products),
                    "products": [self.format_product_for_web(p) for p in products]
                }
            else:
                print("⚠️  No Printify products found, using local inventory...")
                feed = self.load_local_inventory()
        else:
            print("⚠️  No Printify credentials, using local inventory...")
            feed = self.load_local_inventory()

        # Save feed
        with open(output_file, 'w') as f:
            json.dump(feed, f, indent=2)

        print(f"\n✅ Product feed generated: {output_file}")
        print(f"   Total products: {feed['total']}")
        return feed

    def load_local_inventory(self):
        """Load products from local inventory file"""
        try:
            with open("all_products_inventory.json", 'r') as f:
                data = json.load(f)

            # Extract products
            if isinstance(data, dict) and 'products' in data:
                products = data['products']
            else:
                products = list(data.values()) if isinstance(data, dict) else data

            # Format for web
            feed = {
                "source": "local_inventory",
                "total": len(products),
                "categories": data.get('categories', {}),
                "products": [
                    {
                        "name": p.get('name', f"Product_{idx}"),
                        "category": p.get('category', 'uncategorized'),
                        "price": p.get('price', 24.99),
                    }
                    for idx, p in enumerate(products[:1000], 1)  # First 1000 for preview
                ]
            }
            return feed
        except Exception as e:
            print(f"❌ Could not load inventory: {e}")
            return {"source": "error", "total": 0, "products": []}

if __name__ == "__main__":
    print("🌟 NLBL PRODUCT FEED GENERATOR 🌟")
    print("=" * 60)

    generator = ProductFeedGenerator()
    feed = generator.generate_feed()

    # Display summary
    print(f"\n📊 Feed Summary:")
    print(f"   Source: {feed['source']}")
    print(f"   Total Products: {feed['total']}")
    print(f"\n✅ Ready to display on website!")

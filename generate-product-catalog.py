#!/usr/bin/env python3
"""
NLBL Product Catalog Generator
Converts inventory into proper product names, pricing, and Printify-ready format
"""
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class ProductCatalogGenerator:
    def __init__(self):
        self.token = os.getenv("PRINTIFY_API_TOKEN")
        # Product type pricing (Printify base costs + margin)
        self.pricing = {
            "T-shirts": {"base": 8.50, "retail": 24.99},
            "Hoodies": {"base": 14.00, "retail": 44.99},
            "Jackets": {"base": 18.00, "retail": 54.99},
            "Sweatshirts": {"base": 12.00, "retail": 39.99},
            "Leggings": {"base": 10.00, "retail": 34.99},
            "Joggers": {"base": 12.00, "retail": 39.99},
            "Dresses": {"base": 12.00, "retail": 39.99},
            "Skirts": {"base": 10.00, "retail": 34.99},
            "Tank tops": {"base": 7.50, "retail": 21.99},
            "Sports bras": {"base": 9.00, "retail": 28.99},
            "Bodysuits": {"base": 11.00, "retail": 34.99},
            "Bibs": {"base": 4.00, "retail": 12.99},
            "Hats": {"base": 6.00, "retail": 19.99},
            "Bags": {"base": 12.00, "retail": 44.99},
            "Shoes": {"base": 15.00, "retail": 54.99},
            "Swimwear": {"base": 10.00, "retail": 34.99},
        }

        # NLBL brand collections
        self.collections = {
            "Baby": "NLBL Tiny Souls",
            "Kids": "NLBL Youth Legacy",
            "Men": "NLBL Eternal Gent",
            "Women": "NLBL Essence Femme",
            "Unisex": "NLBL Spirit Bound",
        }

    def fetch_real_blueprints(self):
        """Fetch all blueprints from Printify API"""
        if not self.token:
            print("❌ Error: PRINTIFY_API_TOKEN missing.")
            return []
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get("https://api.printify.com/v1/catalog/blueprints.json", headers=headers)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            print(f"❌ API Error: {e}")
            return []

    def get_demographic(self, blueprint):
        """Determine if product is for Baby, Kids, Men, Women, or Unisex"""
        title = blueprint.get('title', '').lower()
        tags = [t.lower() for t in blueprint.get('tags', [])]
        
        if any(x in title or x in tags for x in ['baby', 'infant', 'newborn', 'onesie', 'bib']):
            return "Baby"
        if any(x in title or x in tags for x in ['kids', 'youth', 'toddler']):
            return "Kids"
        if 'women' in title or 'women' in tags:
            return "Women"
        if 'men' in title or 'men' in tags:
            return "Men"
        return "Unisex"

    def generate_catalog(self, output_file="products_catalog.json"):
        """Fetch live catalog and generate the NLBL Galaxy version"""
        print("🔍 Connecting to Printify Catalog...")
        blueprints = self.fetch_real_blueprints()
        
        if not blueprints:
            print("❌ Could not fetch blueprints. Check your API token.")
            return

        print(f"✅ Found {len(blueprints)} blueprints. Transforming into NLBL Galaxy items...")

        themes = ["Cosmic", "Nebula", "Void", "Supernova", "Event Horizon", "Stellar"]
        cleaned_products = []
        count = 0

        # We want to use the galaxy theme for the fill space
        # Logic: If it's a hoodie or jacket, we use the galaxy_pattern.png
        # If it's a shirt or logo item, we use logo_main.png

        for bp in blueprints:
            demographic = self.get_demographic(bp)
            bp_title = bp.get('title', 'Unknown Product')
            
            # Determine general category for pricing
            category = "T-shirts"
            for key in self.pricing.keys():
                if key.lower() in bp_title.lower():
                    category = key
                    break
            
            # Create multiple theme variants for each blueprint
            for theme in themes[:2]: # Get 2 themes per blueprint to avoid hitting Printify limits too fast
                product_name = f"NLBL {theme} {bp_title}"
                
                # Determine which asset to use based on galaxy theme request
                # Galaxy theme (all-over-ish) or Logo focus
                if any(x in bp_title.lower() for x in ['hoodie', 'jacket', 'leggings', 'dress']):
                    img_asset = "galaxy_pattern.png"
                else:
                    img_asset = "logo_main.png"

                price_info = self.pricing.get(category, {"base": 10.00, "retail": 29.99})

                cleaned = {
                    "id": f"NLBL-{bp['id']}-{count}",
                    "name": product_name,
                    "category": category,
                    "demographic": demographic,
                    "collection": self.collections.get(demographic, "NLBL Legacy"),
                    "price": price_info["retail"],
                    "cost": price_info["base"],
                    "image": f"Clothing_Product/{img_asset}",
                    "blueprint_id": bp['id'],
                    "tags": ["NLBL", theme, demographic, "Galaxy"],
                    "visible": True,
                    "description": f"The {product_name}. A premium {demographic} {category} from the No Limits Beyond Limitations Legacy Collection. Features high-definition {theme} galaxy aesthetics."
                }
                
                cleaned_products.append(cleaned)
                count += 1
                
                # Stop at a reasonable limit for initial sync, or let it rip
                if count >= 1000: break
            if count >= 1000: break

        catalog = {
            "source": "Live Printify Catalog",
            "total_products": len(cleaned_products),
            "products": cleaned_products
        }

        with open(output_file, 'w') as f:
            json.dump(catalog, f, indent=2)

        print(f"\n✨ SUCCESS: Generated {len(cleaned_products)} products.")
        print(f"👶 Demographic coverage: Baby, Kids, Men, Women, Unisex.")
        print(f"📁 Saved to: {output_file}")
        return catalog


if __name__ == "__main__":
    print("🌟 NLBL PRODUCT CATALOG GENERATOR 🌟")
    print("=" * 60)

    generator = ProductCatalogGenerator()
    generator.generate_catalog()

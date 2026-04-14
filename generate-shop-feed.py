#!/usr/bin/env python3
"""
NLBL Shop Feed Generator
Creates JSON feed for website to display products with images and prices
"""

import json
import os


class ShopFeedGenerator:
    def __init__(self):
        pass

    def generate_feed(
        self, catalog_file="products_catalog.json", output_file="shop-products.json"
    ):
        """Generate shop-ready product feed from catalog"""

        print("Loading catalog from " + catalog_file + "...")

        try:
            with open(catalog_file, "r") as f:
                catalog = json.load(f)
        except Exception as e:
            print("Could not load catalog: " + str(e))
            print("\nFirst, run: python3 generate-product-catalog.py")
            return

        products = catalog.get("products", [])
        print(f"Processing {len(products)} products for web display...")

        # Group by category
        categories = {}
        feed_products = []

        for product in products:
            category = product.get("category", "Mixed")

            # Format for web
            web_product = {
                "id": product.get("id"),
                "name": product.get("name"),
                "category": category,
                "collection": product.get("collection"),
                "price": product.get("price"),
                "image": product.get("image"),
                "url": f"/product-detail.html?id={product.get('id')}",
                "addToCart": f"/api/add-to-cart?id={product.get('id')}",
                "buyNow": f"/api/checkout?id={product.get('id')}",
                "description": product.get("description"),
                "tags": product.get("tags", []),
                "visible": product.get("visible", True),
            }

            feed_products.append(web_product)

            # Count by category
            if category not in categories:
                categories[category] = 0
            categories[category] += 1

        # Sort by category for better display
        feed_products_sorted = sorted(feed_products, key=lambda x: x["category"])

        # Create feed structure
        shop_feed = {
            "store": "No Limits Beyond Limitations",
            "collection": "NLBL Legacy Collection",
            "description": "Premium clothing & accessories honoring R.J. and T-Mainney",
            "theme": "Cosmic, ethereal, remembrance-focused",
            "generated": "2026-03-04",
            "total_products": len(feed_products),
            "categories": categories,
            "products": feed_products_sorted,
        }

        # Save feed
        with open(output_file, "w") as f:
            json.dump(shop_feed, f, indent=2)

        print(f"\nShop feed generated: {output_file}")
        print(f"Total products: {len(feed_products)}")
        print(f"Categories: {len(categories)}")
        print(f"\n Product distribution:")
        for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:10]:
            print(f"   • {cat}: {count} products")

        return shop_feed


if __name__ == "__main__":
    print("NLBL SHOP FEED GENERATOR")
    print("=" * 60)

    generator = ShopFeedGenerator()
    feed = generator.generate_feed()

    if feed:
        print("\nReady to display on your website!")
        print("Use this in your shop.html:")
        print("   <script src='js/shop-loader.js'></script>")

#!/usr/bin/env python3
"""
Generate shop-products.json from Printify products
This creates a file that can be deployed with your website
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def fetch_all_products():
    """Fetch all products from Printify"""
    token = os.getenv("PRINTIFY_API_TOKEN")
    shop_id = os.getenv("PRINTIFY_SHOP_ID")

    if not token or not shop_id:
        print("ERROR: Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID")
        return []

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    all_products = []
    page = 1

    print("Fetching products from Printify...")
    while True:
        try:
            response = requests.get(
                f"https://api.printify.com/v1/shops/{shop_id}/products.json",
                headers=headers,
                params={"limit": 50, "page": page},
                timeout=30
            )

            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                break

            data = response.json()
            products = data.get("data", [])

            if not products:
                break

            all_products.extend(products)
            print(f"   Page {page}: {len(products)} products")
            page += 1

        except Exception as e:
            print(f"Error: {e}")
            break

    return all_products

def categorize_product(product):
    """Determine category based on product title and tags"""
    title = product.get("title", "").lower()
    tags = [t.lower() for t in product.get("tags", [])]
    all_text = title + " " + " ".join(tags)

    # Determine category
    if any(w in all_text for w in ["baby", "infant", "onesie", "kid", "youth", "toddler"]):
        if "baby" in all_text or "onesie" in all_text:
            return "Babies"
        return "Kids"
    elif any(w in all_text for w in ["women", "woman", "ladies", "female", "crop", "legging", "bra"]):
        return "Women"
    elif any(w in all_text for w in ["men", "man", "male", "guy", "hoodie", "jacket", "sweat"]):
        return "Men"
    elif any(w in all_text for w in ["hat", "cap", "sock", "sneaker", "shoe", "accessory", "bag"]):
        return "Accessories"
    else:
        return "Unisex"

def convert_products(printify_products):
    """Convert Printify products to shop format"""
    shop_products = []

    for p in printify_products:
        # Get first image
        images = p.get("images", [])
        image_url = images[0].get("src", "") if images else ""

        # Get price from first variant
        variants = p.get("variants", [])
        price = 0
        for v in variants:
            if v.get("is_enabled", False):
                price = v.get("price", 0) / 100  # Convert cents to dollars
                break
        if price == 0 and variants:
            price = variants[0].get("price", 0) / 100

        category = categorize_product(p)

        shop_product = {
            "id": p.get("id", ""),
            "name": p.get("title", "Untitled Product"),
            "price": round(price, 2),
            "image": image_url,
            "category": category,
            "description": p.get("description", ""),
            "visible": p.get("visible", True)
        }

        shop_products.append(shop_product)

    return shop_products

def main():
    print("=" * 50)
    print("GENERATING SHOP PRODUCTS FROM PRINTIFY")
    print("=" * 50)

    # Fetch products
    printify_products = fetch_all_products()

    if not printify_products:
        print("No products fetched!")
        return

    print(f"\nTotal products: {len(printify_products)}")

    # Convert to shop format
    shop_products = convert_products(printify_products)

    # Filter visible only
    visible_products = [p for p in shop_products if p.get("visible", False)]

    print(f"Visible products: {len(visible_products)}")

    # Count by category
    categories = {}
    for p in visible_products:
        cat = p.get("category", "Unisex")
        categories[cat] = categories.get(cat, 0) + 1

    print("\nProducts by category:")
    for cat, count in sorted(categories.items()):
        print(f"   {cat}: {count}")

    # Save to file
    output = {
        "success": True,
        "total": len(visible_products),
        "categories": categories,
        "products": visible_products
    }

    with open("shop-products.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved to shop-products.json")
    print("Deploy this file with your website!")

if __name__ == "__main__":
    main()

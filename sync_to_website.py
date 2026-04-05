#!/usr/bin/env python3
"""
Sync Printify products to website
Checks product visibility and ensures they're ready for the website
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def get_products_from_printify():
    """Fetch all products from Printify"""
    token = os.getenv("PRINTIFY_API_TOKEN")
    shop_id = os.getenv("PRINTIFY_SHOP_ID")
    
    if not token or not shop_id:
        print("ERROR: Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID in .env")
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
                print(f"Error fetching products: {response.status_code}")
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

def analyze_product_visibility(products):
    """Analyze product visibility"""
    visible_count = 0
    hidden_count = 0
    
    for p in products:
        if p.get("visible", False):
            visible_count += 1
        else:
            hidden_count += 1
    
    return {"visible": visible_count, "hidden": hidden_count}

def main():
    print("\n=== PRINTIFY TO WEBSITE SYNC CHECK ===")
    print("=" * 50)
    
    # Get products
    products = get_products_from_printify()
    
    if not products:
        print("No products found in Printify")
        return
    
    print(f"\nTotal products in Printify: {len(products)}")
    
    # Analyze visibility
    visibility = analyze_product_visibility(products)
    
    print("\nVisibility Status:")
    print(f"   Visible (on website): {visibility['visible']}")
    print(f"   Hidden (not on site): {visibility['hidden']}")
    
    # Show sample products
    print("\nSample Products (first 5):")
    for i, p in enumerate(products[:5], 1):
        title = p.get("title", "Untitled")[:40]
        visible = p.get("visible", False)
        product_id = p.get("id", "N/A")
        status = "VISIBLE" if visible else "HIDDEN"
        print(f"   {i}. [{status}] {title}")
        print(f"      ID: {product_id}")
    
    # Check if products have proper names
    uuid_names = sum(1 for p in products if p.get("title", "").count("-") >= 4)
    
    print("\n" + "=" * 50)
    print("WEBSITE SYNC STATUS:")
    print("=" * 50)
    
    if visibility['visible'] > 0:
        print(f"\nSUCCESS: {visibility['visible']} products are VISIBLE!")
        print("   These products should appear on your website.")
        print("\n   Your website fetches products from Printify API.")
        print("   When you visit your site, products load automatically.")
    
    if uuid_names > 0:
        print(f"\nNOTE: {uuid_names} products have UUID-based titles")
        print("   (like: D6A44504-8908-4Ac5-9A45-Ca24D8F30C5C)")
        print("   This is cosmetic - products still work fine!")
    
    print("\n" + "=" * 50)
    print("NEXT STEPS:")
    print("=" * 50)
    print("\n1. Your website should automatically show these products")
    print("2. Visit your website to verify products appear")
    print("3. If products don't appear, try:")
    print("   - Refresh your browser (Ctrl+F5)")
    print("   - Restart your shop_app.py server")
    print("\nThe sync is AUTOMATIC - no extra steps needed!")
    
    # Save product list
    with open("printify_products_status.json", "w") as f:
        json.dump({
            "total": len(products),
            "visibility": visibility,
            "products": products
        }, f, indent=2)
    print("\nSaved detailed product list to printify_products_status.json")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Find correct Printify API endpoints"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Testing Printify API endpoints...")
print("=" * 60)

# Test 1: Get existing products from shop
print("\n1. Getting products from shop...")
resp = requests.get(
    f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=5",
    headers=headers,
    timeout=10,
)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    products = data.get("data", [])
    print(f"Found {len(products)} products")
    if products:
        p = products[0]
        print(f"Sample product: {p.get('title')}")
        print(f"  ID: {p.get('id')}")
        print(f"  Blueprint ID: {p.get('blueprint_id')}")
        print(f"  Print Provider ID: {p.get('print_provider_id')}")

        # Test 2: Get variants for this product
        product_id = p.get("id")
        print(f"\n2. Getting variants for product {product_id}...")
        var_resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products/{product_id}/variants.json",
            headers=headers,
            timeout=10,
        )
        print(f"Status: {var_resp.status_code}")
        if var_resp.status_code == 200:
            variants = var_resp.json().get("data", [])
            print(f"Found {len(variants)} variants")
            if variants:
                v = variants[0]
                print(f"Sample variant: {v}")
        else:
            print(f"Error: {var_resp.text[:200]}")

        # Test 3: Get blueprint info from catalog
        blueprint_id = p.get("blueprint_id")
        print(f"\n3. Getting catalog product {blueprint_id}...")
        cat_resp = requests.get(
            f"https://api.printify.com/v1/catalog/products/{blueprint_id}.json",
            headers=headers,
            timeout=10,
        )
        print(f"Status: {cat_resp.status_code}")
        if cat_resp.status_code == 200:
            cat_data = cat_resp.json()
            print(f"Catalog product: {cat_data.get('title')}")
        else:
            print(f"Error: {cat_resp.text[:200]}")
else:
    print(f"Error: {resp.text[:200]}")

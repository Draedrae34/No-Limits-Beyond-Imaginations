#!/usr/bin/env python3
"""Find correct variant and catalog endpoints"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get a product
resp = requests.get(
    f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=1",
    headers=headers,
    timeout=10,
)
product = resp.json()["data"][0]
product_id = product["id"]
blueprint_id = product["blueprint_id"]
print_provider_id = product["print_provider_id"]

print(f"Product ID: {product_id}")
print(f"Blueprint ID: {blueprint_id}")
print(f"Print Provider ID: {print_provider_id}")
print()

# Try variant endpoints
variant_endpoints = [
    f"/shops/{shop_id}/products/{product_id}/variants",
    f"/shops/{shop_id}/products/{product_id}/variants.json",
    f"/catalog/blueprints/{blueprint_id}/print_providers/{print_provider_id}/variants",
    f"/catalog/blueprints/{blueprint_id}/print_providers/{print_provider_id}/variants.json",
]

print("Testing variant endpoints...")
for ep in variant_endpoints:
    url = f"https://api.printify.com/v1{ep}"
    r = requests.get(url, headers=headers, timeout=10)
    print(f"{ep}")
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        variants = data.get("variants", data.get("data", []))
        print(f"  SUCCESS! Found {len(variants)} variants")
        if variants:
            print(f"  Sample: {variants[0]}")
        break
    else:
        print(f"  Error: {r.text[:100]}")

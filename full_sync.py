#!/usr/bin/env python
"""Full Printify sync - fetch all products and save to data/products.json"""
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os
import json

load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

print(f'Starting Full Printify Sync for shop {shop_id}...')

client = PrintifyAPI(token, shop_id)

# Get ALL products (handle pagination - max 50 per page)
all_products = []
page = 1
while True:
    print(f'Fetching page {page}...')
    # Printify API limits to 50 per page
    response = client._get(f"/shops/{shop_id}/products.json", params={"limit": 50, "page": page})
    products = response.get("data", [])
    if not products:
        break
    all_products.extend(products)
    print(f'  Got {len(products)} products (total: {len(all_products)})')
    page += 1
    if len(products) < 50:
        break

print(f'\nTotal products fetched: {len(all_products)}')

# Transform products to match our format
transformed = []
for p in all_products:
    transformed.append({
        "id": p.get("id"),
        "title": p.get("title"),
        "description": p.get("description", ""),
        "price": p.get("price") or 29.99,
        "image": p.get("thumbnail_url", ""),
        "printfulVariantId": None,  # Not applicable for Printify
        "printifyProductId": p.get("id"),
    })

# Save to products.json
output = {"items": transformed}
with open("data/products.json", "w") as f:
    json.dump(output, f, indent=2)

print(f'Saved {len(transformed)} products to data/products.json')
print('\n✅ Full sync complete!')
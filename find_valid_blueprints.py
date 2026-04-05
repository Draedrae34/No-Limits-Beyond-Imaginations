#!/usr/bin/env python3
"""
Find all valid Printify blueprints by searching the catalog
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Fetching Printify catalog collections...")

# Get collections
collections_resp = requests.get(
    "https://api.printify.com/v1/catalog/collections.json", headers=headers, timeout=10
)

if collections_resp.status_code != 200:
    print(f"Failed to get collections: {collections_resp.status_code}")
    exit(1)

collections = collections_resp.json().get("data", [])
print(f"Found {len(collections)} collections")

# Search for products in each collection
all_products = []

for coll in collections:
    coll_id = coll["id"]
    coll_title = coll.get("title", "Unknown")

    print(f"\nSearching collection: {coll_title} (ID: {coll_id})")

    prod_resp = requests.get(
        f"https://api.printify.com/v1/catalog/collections/{coll_id}/products.json",
        headers=headers,
        timeout=10,
    )

    if prod_resp.status_code == 200:
        products = prod_resp.json().get("data", [])
        print(f"  Found {len(products)} products")

        for p in products:
            all_products.append(
                {
                    "id": p["id"],
                    "title": p["title"],
                    "collection": coll_title,
                    "collection_id": coll_id,
                }
            )
    else:
        print(f"  Failed: {prod_resp.status_code}")

print(f"\n{'=' * 70}")
print(f"TOTAL PRODUCTS FOUND: {len(all_products)}")
print(f"{'=' * 70}")

# Filter for common apparel types
keywords = [
    "t-shirt",
    "tee",
    "hoodie",
    "sweatshirt",
    "jacket",
    "pants",
    "shorts",
    "dress",
    "skirt",
    "leggings",
    "shoes",
    "hat",
    "cap",
    "beanie",
    "socks",
    "backpack",
    "bag",
    "tank",
    "mug",
    "phone",
    "pillow",
    "blanket",
    "towel",
]

print("\nFILTERING FOR APPAREL & ACCESSORIES:")
print("=" * 70)

filtered = []
for p in all_products:
    title_lower = p["title"].lower()
    if any(kw in title_lower for kw in keywords):
        filtered.append(p)
        print(f"  [{p['id']}] {p['title']} ({p['collection']})")

print(f"\nFound {len(filtered)} relevant products")

# Save all products
with open("printify_catalog_all.json", "w") as f:
    json.dump(all_products, f, indent=2)

# Save filtered products
with open("printify_catalog_filtered.json", "w") as f:
    json.dump(filtered, f, indent=2)

print(f"\nAll products saved to printify_catalog_all.json")
print(f"Filtered products saved to printify_catalog_filtered.json")

# Create a mapping of common product types
print("\n" + "=" * 70)
print("RECOMMENDED BLUEPRINT IDs:")
print("=" * 70)

common_types = {
    "t-shirt": None,
    "hoodie": None,
    "sweatshirt": None,
    "jacket": None,
    "dress": None,
    "leggings": None,
    "hat": None,
    "beanie": None,
    "socks": None,
    "backpack": None,
}

for p in filtered:
    title_lower = p["title"].lower()
    for ctype in common_types:
        if ctype in title_lower and common_types[ctype] is None:
            common_types[ctype] = p
            break

for ctype, product in common_types.items():
    if product:
        print(f"  {ctype}: Blueprint ID {product['id']} - {product['title']}")
    else:
        print(f"  {ctype}: NOT FOUND")

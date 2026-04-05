#!/usr/bin/env python3
"""
Delete old products - Batch version
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Fetching and deleting old products...")
print("=" * 70)

# Correct design names to KEEP
keep_names = [
    "Black Hole Memorial",
    "Milky Way Gold",
    "Meteor Shower",
    "Pink Nebula",
    "Purple Nebula",
    "Solar Flare",
    "Zodiac",
    "Pink Nebula AOP",
    "Solar Flare AOP",
    "Untitled",
]

deleted = 0
kept = 0
page = 1

while True:
    print(f"\nFetching page {page}...")
    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=50&page={page}",
        headers=headers,
        timeout=30,
    )

    if resp.status_code != 200:
        print(f"Failed: {resp.status_code}")
        break

    products = resp.json().get("data", [])
    if not products:
        print("No more products")
        break

    print(f"  Found {len(products)} products")

    # Process each product
    for p in products:
        title = p.get("title", "")
        is_correct = any(f"NLBL {name}" in title for name in keep_names)

        if is_correct:
            kept += 1
        else:
            # Delete this product
            del_resp = requests.delete(
                f"https://api.printify.com/v1/shops/{shop_id}/products/{p['id']}.json",
                headers=headers,
                timeout=30,
            )
            if del_resp.status_code in [200, 204]:
                deleted += 1
                if deleted % 50 == 0:
                    print(f"    Deleted {deleted} old products...")
            else:
                print(f"    Failed to delete: {title[:50]}")

    if len(products) < 50:
        break
    page += 1

print("\n" + "=" * 70)
print("COMPLETE")
print("=" * 70)
print(f"Deleted old products: {deleted}")
print(f"Kept correct products: {kept}")
print("=" * 70)

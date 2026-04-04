#!/usr/bin/env python3
"""
Delete all old products with WRONG designs from Printify
Keeps only the 30 new products with CORRECT NLBL designs
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=" * 70)
print("DELETING OLD PRODUCTS WITH WRONG DESIGNS")
print("=" * 70)

# Get all products
print("\nFetching all products from Printify...")
all_products = []
for page in range(1, 100):
    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"Failed at page {page}: {resp.status_code}")
        break
    data = resp.json().get("data", [])
    all_products.extend(data)
    print(f"  Page {page}: {len(data)} products (Total: {len(all_products)})")
    if len(data) < 100:
        break

print(f"\nTotal products found: {len(all_products)}")

# The 30 new products have titles starting with "NLBL " and use correct designs
# We want to KEEP products with titles matching our 10 correct designs
correct_design_names = [
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

# Find products to DELETE (old ones with wrong designs)
to_delete = []
to_keep = []

for p in all_products:
    title = p.get("title", "")
    # Check if this is one of the new correct products
    is_correct = any(f"NLBL {name}" in title for name in correct_design_names)

    if is_correct:
        to_keep.append(p)
    else:
        to_delete.append(p)

print(f"\nProducts to KEEP (correct designs): {len(to_keep)}")
print(f"Products to DELETE (wrong designs): {len(to_delete)}")

if len(to_delete) == 0:
    print("\nNo old products to delete!")
    exit(0)

# Confirm deletion
print(f"\n{'=' * 70}")
print(f"WARNING: This will delete {len(to_delete)} products from your Printify shop!")
print(f"{'=' * 70}")

# Delete products
print("\nDeleting old products...")
deleted = 0
failed = 0

for i, product in enumerate(to_delete):
    resp = requests.delete(
        f"https://api.printify.com/v1/shops/{shop_id}/products/{product['id']}.json",
        headers=headers,
        timeout=10,
    )

    if resp.status_code in [200, 204]:
        deleted += 1
    else:
        failed += 1
        print(f"  Failed to delete: {product['title'][:50]} - {resp.status_code}")

    if (deleted + failed) % 100 == 0:
        print(
            f"  Progress: {deleted + failed}/{len(to_delete)} (Deleted: {deleted}, Failed: {failed})"
        )

print("\n" + "=" * 70)
print("DELETION COMPLETE")
print("=" * 70)
print(f"Deleted: {deleted}")
print(f"Failed: {failed}")
print(f"Kept: {len(to_keep)}")
print(f"Remaining in shop: {len(all_products) - deleted}")
print("=" * 70)

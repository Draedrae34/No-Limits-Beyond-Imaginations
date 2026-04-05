#!/usr/bin/env python3
"""
Test specific blueprint IDs to see which ones work
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")

if not token:
    print("No token found")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test blueprint IDs from generate-product-catalog.py
test_blueprints = [0, 1, 2, 3, 4, 6, 10, 12, 14, 18, 19, 20, 23, 25, 26, 27, 28]

print("Testing blueprint IDs...")
print("=" * 40)

for blueprint_id in test_blueprints:
    try:
        response = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/variants.json",
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            variants = response.json()
            print(f"Blueprint {blueprint_id}: ✅ {len(variants)} variants")
        else:
            print(f"Blueprint {blueprint_id}: ❌ {response.status_code}")

    except Exception as e:
        print(f"Blueprint {blueprint_id}: ❌ Error - {e}")

print("\nDone!")
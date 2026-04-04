#!/usr/bin/env python3
"""
Find valid Printify blueprints using correct API endpoints
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Testing Printify catalog API endpoints...")
print("=" * 70)

# Try different catalog endpoints
endpoints = [
    "https://api.printify.com/v1/catalog/collections.json",
    "https://api.printify.com/v1/catalog/collections",
    "https://api.printify.com/v1/catalog/products.json",
    "https://api.printify.com/v1/catalog/products",
    "https://api.printify.com/v1/catalog/blueprints.json",
    "https://api.printify.com/v1/catalog/blueprints",
]

for ep in endpoints:
    print(f"\nTrying: {ep}")
    resp = requests.get(ep, headers=headers, timeout=10)
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, dict):
            keys = list(data.keys())
            print(f"  Response keys: {keys}")
            if "data" in data:
                items = data["data"]
                print(f"  Found {len(items)} items in 'data'")
                if items:
                    print(f"  First item: {json.dumps(items[0], indent=2)[:200]}")
        elif isinstance(data, list):
            print(f"  Found {len(data)} items (list)")
            if data:
                print(f"  First item: {json.dumps(data[0], indent=2)[:200]}")
        break
    else:
        print(f"  Error: {resp.text[:200]}")

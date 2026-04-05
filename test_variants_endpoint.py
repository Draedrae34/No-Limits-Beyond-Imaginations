#!/usr/bin/env python3
"""Debug variants endpoint"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

blueprint_id = 10  # Basic Hoodie

print(f"Testing blueprint: {blueprint_id}")
print()

# Try different endpoint patterns
endpoints = [
    f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/variants.json",
    f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/variants",
    f"https://api.printify.com/v1/blueprints/{blueprint_id}/variants.json",
    f"https://api.printify.com/v1/catalog/products/{blueprint_id}/variants.json",
]

for endpoint in endpoints:
    print(f"Trying: {endpoint}")
    resp = requests.get(endpoint, headers=headers, timeout=10)
    print(f"  Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(
            f"  Response keys: {list(data.keys()) if isinstance(data, dict) else 'list'}"
        )
        if isinstance(data, dict) and "variants" in data:
            print(f"  Variants: {len(data['variants'])}")
        elif isinstance(data, list):
            print(f"  Items: {len(data)}")
        print(f"  First item: {str(data)[:200]}")
        break
    else:
        print(f"  Error: {resp.text[:100]}")
    print()

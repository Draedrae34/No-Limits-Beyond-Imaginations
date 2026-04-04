#!/usr/bin/env python3
"""
Debug shop access issues
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print(f"Testing with Shop ID: {shop_id}")
print(f"Token starts with: {token[:20]}...")
print()

# Test different endpoints
endpoints = [
    f"https://api.printify.com/v1/shops/{shop_id}.json",
    f"https://api.printify.com/v1/shops/{shop_id}",
    f"https://api.printify.com/v1/shops.json",
]

for i, endpoint in enumerate(endpoints, 1):
    print(f"Testing endpoint {i}: {endpoint}")
    try:
        response = requests.get(endpoint, headers=headers, timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  Found {len(data)} shops")
                for shop in data[:3]:
                    print(f"    Shop {shop.get('id')}: {shop.get('title')}")
            else:
                print(f"  Shop: {data.get('title', 'Unknown')}")
            break
        else:
            print(f"  Error: {response.text[:200]}")
    except Exception as e:
        print(f"  Exception: {e}")
    print()
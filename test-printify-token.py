#!/usr/bin/env python3
"""
Test Printify API Token
Quick test to verify your token works
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")

print("TESTING PRINTIFY API TOKEN")
print("=" * 40)

if not token:
    print("PRINTIFY_API_TOKEN not found in environment")
    print("\n\nTO FIX:")
    print("1. Go to Printify Dashboard → Settings → API")
    print("2. Copy your API token")
    print("3. Add to .env file: PRINTIFY_API_TOKEN=your_token_here")
    exit(1)

if not shop_id:
    print("PRINTIFY_SHOP_ID not found in environment")
    print("\n\nTO FIX:")
    print("1. Go to Printify Dashboard")
    print("2. Copy shop ID from URL or settings")
    print("3. Add to .env file: PRINTIFY_SHOP_ID=your_shop_id_here")
    exit(1)

print(f"Token found (length: {len(token)})")
print(f"Shop ID found: {shop_id}")

# Test API connection
print("\nTesting API connection...")

try:
    response = requests.get(
        "https://api.printify.com/v1/shops.json",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )

    if response.status_code == 200:
        shops = response.json()
        print(f"API connection successful!")
        print(f"Found {len(shops)} Printify shops")

        # Find the matching shop
        shop = next((s for s in shops if str(s["id"]) == str(shop_id)), None)
        if shop:
            print(f"Shop verified: {shop['title']}")
            print("\nPRINTIFY TOKEN IS WORKING!")
            print("Ready to upload your NLBL designs!")
        else:
            print(f"Shop ID {shop_id} not found in your account")
            print("Available shops:", [s["title"] for s in shops])

    else:
        print(f"API test failed: {response.status_code}")
        print(f"Response: {response.text[:200]}")

except Exception as e:
    print(f"Connection error: {e}")

print("\n" + "=" * 40)

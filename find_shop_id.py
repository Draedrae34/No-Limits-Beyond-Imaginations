#!/usr/bin/env python3
"""
Find the correct Printify shop ID for this account
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

print("Finding Printify shops for this account...")
print("=" * 50)

try:
    # Get list of shops
    response = requests.get(
        "https://api.printify.com/v1/shops.json",
        headers=headers,
        timeout=10
    )

    if response.status_code == 200:
        shops = response.json()
        print(f"Found {len(shops)} shops:")

        for i, shop in enumerate(shops, 1):
            shop_id = shop.get("id")
            title = shop.get("title", "Unnamed Shop")
            print(f"  {i}. Shop ID: {shop_id} - {title}")

        if shops:
            print("\nUse one of these shop IDs in your .env file:")
            print(f"PRINTIFY_SHOP_ID={shops[0]['id']}")
        else:
            print("\nNo shops found for this account.")
            print("Please create a shop in Printify first.")

    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"Error: {e}")
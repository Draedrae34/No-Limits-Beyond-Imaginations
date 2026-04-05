#!/usr/bin/env python
"""Test Printify with different tokens"""
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os
import json

load_dotenv()

# Test 1: Try old API key
print("=== Test 1: PRINTIFY_API_KEY ===")
token1 = os.getenv('PRINTIFY_API_KEY')
shop_id = os.getenv('PRINTIFY_SHOP_ID')
print(f"Token: {token1[:30] if token1 else 'None'}...")
print(f"Shop ID: {shop_id}")

if token1:
    client1 = PrintifyAPI(token1, shop_id)
    try:
        shop = client1.get_shop(shop_id)
        print("SUCCESS:", json.dumps(shop, indent=2))
    except Exception as e:
        print(f"FAILED: {e}")

# Test 2: Try new API token
print("\n=== Test 2: PRINTIFY_API_TOKEN ===")
token2 = os.getenv('PRINTIFY_API_TOKEN')
print(f"Token: {token2[:30] if token2 else 'None'}...")

if token2:
    client2 = PrintifyAPI(token2, shop_id)
    try:
        shop = client2.get_shop(shop_id)
        print("SUCCESS:", json.dumps(shop, indent=2))
    except Exception as e:
        print(f"FAILED: {e}")

# Test 3: Try without shop_id
print("\n=== Test 3: List shops ===")
if token2:
    client3 = PrintifyAPI(token2, None)
    try:
        shops = client3.list_shops()
        print("Shops:", json.dumps(shops, indent=2))
    except Exception as e:
        print(f"FAILED: {e}")

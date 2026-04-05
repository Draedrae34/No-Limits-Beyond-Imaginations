#!/usr/bin/env python
"""Test Printify connection"""
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os
import json

load_dotenv()

# Use the API token which is the newer format
token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

print(f'Token: {token[:50] if token else "None"}...')
print(f'Shop ID: {shop_id}')

if not token:
    print('ERROR: No token found!')
    exit(1)

client = PrintifyAPI(token, shop_id)

print('\n--- Testing get_shop ---')
try:
    shop = client.get_shop(shop_id)
    print(json.dumps(shop, indent=2))
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')

print('\n--- Testing get_products (limit 3) ---')
try:
    products = client.get_products(limit=3)
    print(f'Found {len(products)} products')
    for p in products[:3]:
        print(f'  - {p.get("title", "Untitled")} (ID: {p.get("id")})')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')

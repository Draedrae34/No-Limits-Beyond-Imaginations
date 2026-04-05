#!/usr/bin/env python
"""Run Printify sync"""
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os
import json

load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

print(f'Starting Printify sync for shop {shop_id}...')

client = PrintifyAPI(token, shop_id)

# Get all products
print('Fetching products from Printify...')
products = client.get_products(limit=100)
print(f'Found {len(products)} products')

# Show first few
for p in products[:5]:
    title = p.get('title', 'Untitled')[:50]
    print(f'  - {title}')

if len(products) > 5:
    print(f'  ... and {len(products) - 5} more')

print(f'\nSync complete! {len(products)} products ready to sync to your website.')

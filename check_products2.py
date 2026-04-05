#!/usr/bin/env python
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os

load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

client = PrintifyAPI(token, shop_id)

# Get products from store
products = client.get_products(limit=5)
print('Existing products:')
for p in products:
    print(f'  - {p.get("title", "Untitled")[:50]}')
    print(f'    Blueprint ID: {p.get("blueprint_id")}')
    print(f'    Print Provider: {p.get("print_provider_id")}')

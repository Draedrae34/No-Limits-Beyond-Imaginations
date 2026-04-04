#!/usr/bin/env python
"""Check Printify catalog for available products"""
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os
import json

load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

client = PrintifyAPI(token, shop_id)

print('Fetching Printify catalog blueprints...')

# Get catalog blueprints
response = client._get('/catalog/blueprints.json', params={'limit': 20})
blueprints = response.get('data', [])

print(f'Found {len(blueprints)} blueprints:')
for bp in blueprints[:20]:
    title = bp.get('title', 'Untitled')[:50]
    print(f'  - {title} (ID: {bp.get("id")})')

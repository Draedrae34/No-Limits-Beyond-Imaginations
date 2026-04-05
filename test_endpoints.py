#!/usr/bin/env python
"""Debug Printify API endpoints"""
import requests
import os
from dotenv import load_dotenv
load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
headers = {'Authorization': f'Bearer {token}'}

# Try different endpoints
print('--- Test 1: /v1/catalog/blueprints.json ---')
r = requests.get('https://api.printify.com/v1/catalog/blueprints.json?limit=1', headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:300]}')

print('\n--- Test 2: /v1/shops/26615963/products ---')
r = requests.get('https://api.printify.com/v1/shops/26615963/products', headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:300]}')

print('\n--- Test 3: /v1/shops/26615963/products.json ---')
r = requests.get('https://api.printify.com/v1/shops/26615963/products.json', headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:300]}')

#!/usr/bin/env python
"""Debug params issue"""
import requests
import os
from dotenv import load_dotenv
load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
headers = {'Authorization': f'Bearer {token}'}

# Test with limit param
print('--- Test /v1/shops/26615963/products.json?limit=100 ---')
r = requests.get('https://api.printify.com/v1/shops/26615963/products.json?limit=100', headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:300]}')

print('\n--- Test /v1/shops/26615963/products.json with params ---')
r = requests.get('https://api.printify.com/v1/shops/26615963/products.json', headers=headers, params={'limit': 100})
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:300]}')

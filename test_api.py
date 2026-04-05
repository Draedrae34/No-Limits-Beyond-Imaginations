#!/usr/bin/env python
"""Debug Printify API"""
import requests
import os
from dotenv import load_dotenv
load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
print(f'Token: {token[:30]}...')

headers = {'Authorization': f'Bearer {token}'}

# Test 1: Get user info
print('\n--- Test 1: /v1/user.json ---')
try:
    r = requests.get('https://api.printify.com/v1/user.json', headers=headers)
    print(f'Status: {r.status_code}')
    print(f'Response: {r.text[:500]}')
except Exception as e:
    print(f'Error: {e}')

# Test 2: Get shops
print('\n--- Test 2: /v1/shops.json ---')
try:
    r = requests.get('https://api.printify.com/v1/shops.json', headers=headers)
    print(f'Status: {r.status_code}')
    print(f'Response: {r.text[:500]}')
except Exception as e:
    print(f'Error: {e}')

# Test 3: Old endpoint /shops
print('\n--- Test 3: /v1/shops (no .json) ---')
try:
    r = requests.get('https://api.printify.com/v1/shops', headers=headers)
    print(f'Status: {r.status_code}')
    print(f'Response: {r.text[:500]}')
except Exception as e:
    print(f'Error: {e}')

#!/usr/bin/env python
import json

with open('data/products_owner.json', 'r') as f:
    data = json.load(f)

print(f'Owner products: {len(data.get("items", []))}')
for item in data.get('items', [])[:10]:
    title = item.get('title', item.get('name', 'Untitled'))[:60]
    print(f'  - {title}')

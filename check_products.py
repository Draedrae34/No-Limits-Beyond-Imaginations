#!/usr/bin/env python
import json

with open('data/products.json', 'r') as f:
    data = json.load(f)

print(f'Products in data/products.json: {len(data.get("items", []))}')
for item in data.get('items', [])[:5]:
    title = item.get('title', 'Untitled')[:60]
    print(f'  - {title}')
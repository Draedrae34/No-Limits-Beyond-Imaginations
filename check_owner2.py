#!/usr/bin/env python
import json

with open('data/products_owner.json', 'r') as f:
    data = json.load(f)

items = data.get('items', [])
print(f'Total: {len(items)} products')

if items:
    print('\nFirst product structure:')
    for key in items[0].keys():
        print(f'  {key}: {type(items[0][key]).__name__}')

    print('\nFirst 5 products:')
    for item in items[:5]:
        title = item.get('title', item.get('name', 'NO NAME'))
        print(f"  - {title[:60] if title else 'NO TITLE'}")

#!/usr/bin/env python
from dotenv import load_dotenv
from printify_client import PrintifyAPI
import os

load_dotenv()

token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

client = PrintifyAPI(token, shop_id)

# Get first product
products = client.get_products(limit=1)
if products:
    p = products[0]
    print('Product:', p.get('title'))
    print('ID:', p.get('id'))
    print('Blueprint ID:', p.get('blueprint_id'))
    print('Provider ID:', p.get('print_provider_id'))

    # Try to get variants from product directly
    print('Variants:', p.get('variants')[:1] if p.get('variants') else 'None')

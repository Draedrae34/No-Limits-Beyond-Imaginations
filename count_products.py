import json
with open('properly-mapped-products.json', 'r') as f:
    data = json.load(f)
    total = data.get('total_products')
    products = data.get('products', [])
    count = len(products)
    print(f"Total products from field: {total}")
    print(f"Actual count in array: {count}")
    if total == count:
        print("Counts match.")
    else:
        print("Counts do not match.")
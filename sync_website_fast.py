#!/usr/bin/env python3
"""Quick website sync - fetch products and generate feed"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Fetching products from Printify...")
all_products = []
for page in range(1, 50):
    resp = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=50&page={page}",
        headers=headers,
        timeout=60,
    )

    if resp.status_code != 200:
        print(f"Failed at page {page}: {resp.status_code}")
        break

    data = resp.json().get("data", [])
    all_products.extend(data)
    print(f"  Page {page}: {len(data)} products (Total: {len(all_products)})")

    if len(data) < 50:
        break

products = all_products
print(f"\nTotal products fetched: {len(products)}")

# Transform
website_products = []
for p in products:
    price = p.get("variants", [{}])[0].get("price", 0) / 100
    image = p.get("images", [])
    image = image[0].get("src", "") if image else ""

    website_products.append(
        {
            "id": p["id"],
            "title": p.get("title", ""),
            "description": p.get("description", ""),
            "price": price,
            "image": image,
            "tags": p.get("tags", []),
            "visible": p.get("visible", True),
        }
    )

# Save JSON
with open("website_products.json", "w") as f:
    json.dump(
        {"total": len(website_products), "products": website_products}, f, indent=2
    )

print(f"Saved {len(website_products)} products to website_products.json")

# Generate simple HTML
html = f"""<!DOCTYPE html>
<html>
<head>
    <title>NLBL Shop - {len(website_products)} Products</title>
    <style>
        body {{ background: #0a0a0a; color: #fff; font-family: Arial; padding: 20px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }}
        .product {{ background: #1a1a2e; border-radius: 10px; overflow: hidden; }}
        .product img {{ width: 100%; height: 250px; object-fit: cover; }}
        .product h3 {{ padding: 10px; font-size: 0.9em; }}
        .product .price {{ padding: 0 10px 10px; color: #4ecdc4; font-size: 1.2em; }}
    </style>
</head>
<body>
    <h1>NLBL Galaxy Collection - {len(website_products)} Products</h1>
    <div class="grid">
        {"".join(f'<div class="product"><img src="{p["image"]}"><h3>{p["title"]}</h3><p class="price">${p["price"]:.2f}</p></div>' for p in website_products[:100])}
    </div>
</body>
</html>
"""

with open("website_products.html", "w") as f:
    f.write(html)

print("Generated website_products.html")
print("Done!")

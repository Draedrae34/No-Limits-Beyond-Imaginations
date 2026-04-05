import json

# Load the inventory
with open('all_products_inventory.json', 'r') as f:
    data = json.load(f)

# Mapping old categories to new e-commerce friendly categories
category_mapping = {
    "shirts": "T-Shirts",
    "hoodies": "Hoodies & Sweatshirts",
    "pants": "Pants",
    "shorts": "Shorts",
    "dresses": "Dresses",
    "skirts": "Skirts",
    "jackets": "Jackets",
    "sweats": "Sweatshirts",
    "leggings": "Leggings",
    "tank tops": "Tank Tops",
    "hats": "Hats",
    "beanies": "Beanies",
    "snapback_hats": "Snapback Hats",
    "socks": "Socks",
    "underwear": "Underwear",
    "womens_panties": "Panties",
    "bra's": "Bras",
    "lingere": "Lingerie",
    "womens_night_wear": "Sleepwear",
    "onesie": "Onesies",
    "full_outfits": "Outfits",
    "kids_wear": "Kids' Clothing",
    "shoes": "Shoes",
    "backpacks": "Backpacks",
    "accessabilites": "Accessories",
    "long sleeves": "Long Sleeve Shirts",
    "tee's": "T-Shirts",
    "clothing_product_3": "Custom T-Shirts",  # Assuming based on common
    "clothing_product_5": "Custom Apparel",
    "clothing_product_6": "Custom Clothing",
    "clothing_product_4": "Custom Accessories",
    "clothing_poduct": "Custom Products",  # Typo fix
    "reve_images_2026-02-22_00-05-24": "Galaxy Theme Apparel",
    "reve_images_2026-02-22_03-50-24": "Galaxy Theme Apparel",
    "reve_images_2026-02-22_03-57-11": "Galaxy Theme Apparel",
    "reve_images_2026-02-22_04-06-06": "Galaxy Theme Apparel",
    "photos-3-001-2": "Memorial Theme Apparel",
    "photos-3-001-1": "Memorial Theme Apparel",
    "mix1": "Mixed Apparel",
    "mixed": "Mixed Products"
}

# Update categories
new_categories = {}
for old_cat, count in data['categories'].items():
    new_cat = category_mapping.get(old_cat, old_cat)  # Default to old if not mapped
    if new_cat in new_categories:
        new_categories[new_cat] += count
    else:
        new_categories[new_cat] = count

data['categories'] = new_categories

# Save the updated JSON
with open('all_products_inventory_updated.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Categories updated. New categories:", new_categories)

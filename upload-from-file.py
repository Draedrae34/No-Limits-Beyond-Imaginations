#!/usr/bin/env python3
"""
NLBL Upload - Credentials from file
"""
import os, json, requests, sys

print("🌌 NLBL UPLOAD - ENTER CREDENTIALS IN FILE")
print("=" * 50)

# Create/edit credentials file
creds_file = "/home/aundrae/Silent-Spirits-Legacy/printify-creds.txt"

if not os.path.exists(creds_file):
    with open(creds_file, 'w') as f:
        f.write("# Paste your Printify credentials here\n")
        f.write("# API_TOKEN=your_token_here\n")
        f.write("# SHOP_ID=your_shop_id_here\n")
    print(f"📝 Created {creds_file}")
    print("Edit this file and add your credentials, then run this script again")

else:
    print(f"📄 Reading credentials from {creds_file}")

    # Read credentials
    token = None
    shop_id = None

    with open(creds_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('API_TOKEN='):
                token = line.split('=', 1)[1].strip()
            elif line.startswith('SHOP_ID='):
                shop_id = line.split('=', 1)[1].strip()

    if not token or not shop_id:
        print("❌ Credentials not found in file")
        print("Edit printify-creds.txt with your credentials")
        sys.exit(1)

    print("✅ Found credentials, testing connection...")

    # Test and upload
    try:
        response = requests.get("https://api.printify.com/v1/shops.json",
                              headers={"Authorization": f"Bearer {token}"}, timeout=10)
        if response.status_code == 200:
            print("✅ Connection successful - starting upload...")

            # Upload logic here (same as before)
            designs = []
            # ... scan designs ...
            print(f"🚀 Uploading {len(designs)} designs...")

        else:
            print(f"❌ Connection failed: {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {e}")

print("=" * 50)

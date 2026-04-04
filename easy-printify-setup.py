#!/usr/bin/env python3
"""
Easy Printify Setup - Just enter your credentials
"""
import os

print("🔥 EASY PRINTIFY SETUP")
print("=" * 40)

# Get Printify API Token
print("\n📋 STEP 1: Get your Printify API Token")
print("   Go to: https://printify.com/dashboard → Settings → API")
print("   Copy the token (long string starting with 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...')")
token = input("\n🔑 Paste your Printify API Token: ").strip()

if not token:
    print("❌ No token entered. Please try again.")
    exit(1)

if len(token) < 50:
    print("❌ Token seems too short. Please check and try again.")
    exit(1)

# Get Printify Shop ID
print("\n📋 STEP 2: Get your Printify Shop ID")
print("   In Printify dashboard, look at the URL: https://printify.com/dashboard/shops/[SHOP_ID]")
print("   Or go to Settings → General and copy the Shop ID")
shop_id = input("\n🏪 Enter your Printify Shop ID: ").strip()

if not shop_id:
    print("❌ No shop ID entered. Please try again.")
    exit(1)

# Save to .env file
env_file = "/home/aundrae/Silent-Spirits-Legacy/.env"

try:
    # Read existing .env content
    env_content = ""
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            env_content = f.read()

    # Remove any existing Printify lines
    lines = env_content.split('\n')
    lines = [line for line in lines if not line.startswith('PRINTIFY_')]

    # Add new Printify lines
    lines.append(f"PRINTIFY_API_TOKEN={token}")
    lines.append(f"PRINTIFY_SHOP_ID={shop_id}")

    # Write back to file
    with open(env_file, 'w') as f:
        f.write('\n'.join(lines))

    print("
✅ SUCCESS! Credentials saved to .env file"    print(f"   • Token: {token[:20]}... (length: {len(token)})")
    print(f"   • Shop ID: {shop_id}")

    # Test the token
    print("
🔗 Testing your credentials..."    import requests
    try:
        response = requests.get(
            "https://api.printify.com/v1/shops.json",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )

        if response.status_code == 200:
            shops = response.json()
            print("✅ API connection successful!")
            print(f"📊 Found {len(shops)} Printify shops")

            # Check if shop exists
            shop = next((s for s in shops if str(s['id']) == str(shop_id)), None)
            if shop:
                print(f"✅ Shop verified: {shop['title']}")
                print("\n🎉 SETUP COMPLETE!")
                print("🚀 Ready to upload your NLBL designs!")
                print("\nRun: python3 upload-all-nlbl-designs.py")
            else:
                print(f"⚠️ Shop ID {shop_id} not found in your account")
                print("Available shops:", [s['title'] for s in shops])
        else:
            print(f"❌ API test failed: {response.status_code}")
            print("Please check your token and try again.")

    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("Please check your internet connection and try again.")

except Exception as e:
    print(f"❌ Error saving to .env file: {e}")

print("\n" + "=" * 40)

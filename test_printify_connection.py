#!/usr/bin/env python3
"""
Test Printify API Connection
Verifies credentials and shows shop status
"""
import os
import sys
from dotenv import load_dotenv
import requests

def test_connection():
    """Test Printify API connection"""
    print("\nPRINTIFY CONNECTION TEST")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    token = os.getenv("PRINTIFY_API_TOKEN")
    shop_id = os.getenv("PRINTIFY_SHOP_ID")
    
    # Check if credentials exist
    print("\nCredential Check:")
    print(f"   PRINTIFY_API_TOKEN: {'SET' if token else 'MISSING'}")
    print(f"   PRINTIFY_SHOP_ID: {'SET' if shop_id else 'MISSING'}")
    
    if not token:
        print("\nERROR: PRINTIFY_API_TOKEN not found in .env")
        print("\nFIX:")
        print("   1. Create a .env file in your project root")
        print("   2. Add: PRINTIFY_API_TOKEN=your_token_here")
        print("   3. Get token from: Printify Dashboard > Settings > API")
        return False
    
    if not shop_id:
        print("\nERROR: PRINTIFY_SHOP_ID not found in .env")
        print("\nFIX:")
        print("   1. Add to .env: PRINTIFY_SHOP_ID=your_shop_id")
        print("   2. Get shop ID from Printify dashboard URL")
        return False
    
    # Test API connection
    print("\nTesting API Connection...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test 1: Get shop info
        print("   Testing shop access...")
        response = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}.json",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            shop_data = response.json()
            print(f"   Shop found: {shop_data.get('title', 'Unknown')}")
            print(f"   Shop ID: {shop_id}")
        elif response.status_code == 401:
            print("   Authentication failed - Invalid API token")
            print("\nFIX:")
            print("   1. Go to Printify Dashboard > Settings > API")
            print("   2. Generate a new API token")
            print("   3. Update .env file with new token")
            return False
        elif response.status_code == 404:
            print("   Shop not found - Invalid shop ID")
            print("\nFIX:")
            print("   1. Check your Printify dashboard URL")
            print("   2. Copy the shop ID from the URL")
            print("   3. Update .env file")
            return False
        else:
            print(f"   Unexpected error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
        
        # Test 2: Get products
        print("\nChecking products in shop...")
        response = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=50",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("data", [])
            print(f"   Found {len(products)} products in shop")
            
            if products:
                print("\nSample Products:")
                for i, product in enumerate(products[:5], 1):
                    title = product.get("title", "Untitled")[:40]
                    visible = product.get("visible", False)
                    status = "VISIBLE" if visible else "HIDDEN"
                    print(f"   {i}. [{status}] {title}")
                
                if len(products) > 5:
                    print(f"   ... and {len(products) - 5} more products")
            else:
                print("   No products found in shop")
                print("   This is normal if you haven't synced yet")
        else:
            print(f"   Could not fetch products: {response.status_code}")
        
        # Test 3: Check API limits
        print("\nAPI Status:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Rate Limit: {response.headers.get('X-RateLimit-Remaining', 'Unknown')} remaining")
        
        print("\n" + "=" * 50)
        print("CONNECTION TEST PASSED")
        print("=" * 50)
        print("\nYour Printify credentials are working!")
        print("   You can now run: python printify-sync-master.py")
        
        return True
        
    except requests.exceptions.Timeout:
        print("   Connection timeout - Check your internet connection")
        return False
    except requests.exceptions.ConnectionError:
        print("   Connection error - Cannot reach Printify API")
        print("   Check your internet connection and firewall settings")
        return False
    except Exception as e:
        print(f"   Unexpected error: {e}")
        return False

def check_env_file():
    """Check if .env file exists and has correct format"""
    print("\nChecking .env file...")
    
    env_path = os.path.join(os.getcwd(), ".env")
    
    if not os.path.exists(env_path):
        print("   .env file not found")
        print("\nCreating .env template...")
        
        template = """# Printify Configuration
PRINTIFY_API_TOKEN=your_printify_api_token_here
PRINTIFY_SHOP_ID=your_printify_shop_id_here

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
"""
        
        with open(env_path, 'w') as f:
            f.write(template)
        
        print("   Created .env template")
        print("   Please edit .env and add your actual credentials")
        return False
    
    # Check if file has content
    with open(env_path, 'r') as f:
        content = f.read()
    
    if "PRINTIFY_API_TOKEN" not in content:
        print("   .env exists but missing PRINTIFY_API_TOKEN")
        print("   Please add: PRINTIFY_API_TOKEN=your_token")
        return False
    
    if "PRINTIFY_SHOP_ID" not in content:
        print("   .env exists but missing PRINTIFY_SHOP_ID")
        print("   Please add: PRINTIFY_SHOP_ID=your_shop_id")
        return False
    
    print("   .env file exists with required variables")
    return True

def main():
    """Main function"""
    print("\nPRINTIFY CONNECTION DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # Check .env file
    env_ok = check_env_file()
    
    if not env_ok:
        print("\nPlease fix .env file first")
        return
    
    # Test connection
    success = test_connection()
    
    if not success:
        print("\nConnection test failed")
        print("   Please check the errors above and fix them")
        print("\nSee PRINTIFY_SYNC_TROUBLESHOOTING.md for detailed help")
    else:
        print("\nAll tests passed!")
        print("   Your Printify integration is ready to use")

if __name__ == "__main__":
    main()

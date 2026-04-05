#!/usr/bin/env python3
"""
Interactive Printify Setup Script
Helps configure credentials and test connection
"""
import os
import sys
from pathlib import Path

def print_header():
    """Print header"""
    print("\n" + "=" * 60)
    print("🌟 PRINTIFY SETUP WIZARD 🌟")
    print("=" * 60)
    print("This script will help you configure Printify sync")
    print("=" * 60)

def check_env_file():
    """Check if .env file exists"""
    env_path = Path(".env")
    
    if env_path.exists():
        print("\n📁 Found existing .env file")
        with open(env_path, 'r') as f:
            content = f.read()
        
        has_token = "PRINTIFY_API_TOKEN" in content
        has_shop = "PRINTIFY_SHOP_ID" in content
        
        print(f"   PRINTIFY_API_TOKEN: {'✅ Found' if has_token else '❌ Missing'}")
        print(f"   PRINTIFY_SHOP_ID: {'✅ Found' if has_shop else '❌ Missing'}")
        
        return has_token and has_shop
    
    return False

def get_credentials():
    """Get credentials from user"""
    print("\n📋 PRINTIFY CREDENTIALS")
    print("-" * 60)
    print("\nTo get your credentials:")
    print("1. Go to https://printify.com/dashboard")
    print("2. Click Settings → API")
    print("3. Copy your API Token")
    print("4. Your Shop ID is in the dashboard URL")
    print("   Example: https://printify.com/dashboard/shops/123456/products")
    print("   Shop ID = 123456")
    print()
    
    token = input("🔑 Enter your Printify API Token: ").strip()
    shop_id = input("🏪 Enter your Printify Shop ID: ").strip()
    
    if not token:
        print("❌ API Token cannot be empty")
        return None, None
    
    if not shop_id:
        print("❌ Shop ID cannot be empty")
        return None, None
    
    return token, shop_id

def create_env_file(token, shop_id):
    """Create .env file with credentials"""
    env_content = f"""# Printify Configuration
PRINTIFY_API_TOKEN={token}
PRINTIFY_SHOP_ID={shop_id}

# Stripe Configuration (optional - add if needed)
# STRIPE_SECRET_KEY=sk_live_your_stripe_key
# STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
"""
    
    with open(".env", 'w') as f:
        f.write(env_content)
    
    print("\n✅ Created .env file with your credentials")

def test_connection():
    """Test Printify connection"""
    print("\n🔍 Testing Printify connection...")
    
    try:
        from dotenv import load_dotenv
        import requests
        
        load_dotenv()
        
        token = os.getenv("PRINTIFY_API_TOKEN")
        shop_id = os.getenv("PRINTIFY_SHOP_ID")
        
        if not token or not shop_id:
            print("❌ Credentials not loaded properly")
            return False
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}.json",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            shop_data = response.json()
            print(f"✅ Connected to shop: {shop_data.get('title', 'Unknown')}")
            return True
        elif response.status_code == 401:
            print("❌ Authentication failed - Invalid API token")
            return False
        elif response.status_code == 404:
            print("❌ Shop not found - Invalid shop ID")
            return False
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return False
            
    except ImportError:
        print("⚠️  Missing dependencies. Install with:")
        print("   pip install python-dotenv requests")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def show_next_steps():
    """Show next steps"""
    print("\n" + "=" * 60)
    print("🎯 NEXT STEPS")
    print("=" * 60)
    
    print("\n1. Get valid blueprint IDs from Printify:")
    print("   - Go to Printify Dashboard → Catalog")
    print("   - Choose a product (e.g., T-Shirts → Gildan 5000)")
    print("   - Note the blueprint ID from the URL")
    
    print("\n2. Update generate-product-catalog.py with correct blueprint IDs")
    
    print("\n3. Run the sync:")
    print("   python generate-product-catalog.py")
    print("   python printify-sync-master.py")
    
    print("\n4. Check your Printify dashboard for products")
    
    print("\n5. Test your website:")
    print("   python sync_to_website.py")
    
    print("\n📖 For detailed help, see:")
    print("   - QUICK_START_PRINTIFY.md")
    print("   - PRINTIFY_SYNC_TROUBLESHOOTING.md")

def main():
    """Main function"""
    print_header()
    
    # Check if .env already exists
    if check_env_file():
        print("\n✅ .env file already configured")
        test = input("\n🔍 Test connection? (y/n): ").lower().strip()
        
        if test == 'y':
            if test_connection():
                show_next_steps()
            else:
                print("\n❌ Connection test failed")
                print("   Please check your credentials in .env file")
        return
    
    # Get credentials
    token, shop_id = get_credentials()
    
    if not token or not shop_id:
        print("\n❌ Setup cancelled")
        return
    
    # Create .env file
    create_env_file(token, shop_id)
    
    # Test connection
    if test_connection():
        show_next_steps()
    else:
        print("\n⚠️  Connection test failed")
        print("   Please check your credentials and try again")
        print("   You can manually edit .env file to fix credentials")

if __name__ == "__main__":
    main()

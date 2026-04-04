#!/usr/bin/env python3
"""
Secure Printify Token Configuration
Helps user safely configure their Printify API token
"""
import os
from pathlib import Path

def configure_printify_token():
    """Safely configure Printify API token"""
    
    print("🔥 PRINTIFY TOKEN CONFIGURATION")
    print("🛒 Let's sync your 2000+ products to Printify!")
    print()
    
    print("📋 INSTRUCTIONS:")
    print("1. Go to your Printify dashboard")
    print("2. Go to Settings → API")
    print("3. Copy your API token")
    print("4. Paste it below when prompted")
    print()
    
    # Get token from user
    token = input("🔑 Enter your Printify API token: ").strip()
    
    if not token:
        print("❌ No token provided. Please try again.")
        return False
    
    if len(token) < 20:
        print("❌ Token seems too short. Please check your token.")
        return False
    
    # Validate token format (Printify tokens are typically long strings)
    if not token.startswith('pk_') and not token.startswith('sk_') and len(token) < 30:
        print("⚠️ Token format seems unusual. Double-check your Printify API token.")
        proceed = input("Continue anyway? (y/n): ").lower().strip()
        if proceed != 'y':
            return False
    
    # Update .env file (use relative path)
    env_file = Path(".env")
    
    try:
        # Read existing .env
        env_content = ""
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
        
        # Update or add PRINTIFY_API_TOKEN
        lines = env_content.split('\n')
        updated_lines = []
        token_updated = False
        
        for line in lines:
            if line.startswith('PRINTIFY_API_TOKEN='):
                updated_lines.append(f'PRINTIFY_API_TOKEN={token}')
                token_updated = True
            else:
                updated_lines.append(line)
        
        if not token_updated:
            updated_lines.append(f'PRINTIFY_API_TOKEN={token}')
        
        # Write back to .env
        with open(env_file, 'w') as f:
            f.write('\n'.join(updated_lines))
        
        print("✅ Printify API token configured successfully!")
        print("🔒 Token saved to .env file")
        print("🛒 Ready to sync 2000+ products!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error configuring token: {e}")
        return False

def main():
    """Main function"""
    print("🌟 No Limits Beyond Limitations - Printify Setup")
    print("🛍️ Syncing your massive product empire to Printify!")
    print()
    
    success = configure_printify_token()
    
    if success:
        print()
        print("🚀 NEXT STEPS:")
        print("1. Run: python api/sync-printify-products.py")
        print("2. Watch your 2000+ products upload to Printify!")
        print("3. Check your Printify dashboard to see all products!")
        print()
        print("🔥 Your empire is ready to conquer the world!")
    
    return success

if __name__ == "__main__":
    main()

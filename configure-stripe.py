#!/usr/bin/env python3
"""
Configure Stripe for your shop
"""
import os
from pathlib import Path

def configure_stripe():
    print("🔥 STRIPE PAYMENT SETUP")
    print("💳 Let's configure your payment system!")
    print()
    
    print("📋 INSTRUCTIONS:")
    print("1. Go to stripe.com dashboard")
    print("2. Get your Publishable Key (pk_test_...)")
    print("3. Get your Secret Key (sk_test_...)")
    print("4. Enter them below")
    print()
    
    publishable_key = input("🔑 Enter your Stripe Publishable Key: ").strip()
    secret_key = input("🔒 Enter your Stripe Secret Key: ").strip()
    
    if not publishable_key or not secret_key:
        print("❌ Both keys are required!")
        return False
    
    # Update .env file
    env_file = Path("/home/aundrae/Silent-Spirits-Legacy/.env")
    
    try:
        env_content = ""
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
        
        lines = env_content.split('\n')
        updated_lines = []
        
        stripe_pub_updated = False
        stripe_secret_updated = False
        
        for line in lines:
            if line.startswith('STRIPE_PUBLISHABLE_KEY='):
                updated_lines.append(f'STRIPE_PUBLISHABLE_KEY={publishable_key}')
                stripe_pub_updated = True
            elif line.startswith('STRIPE_SECRET_KEY='):
                updated_lines.append(f'STRIPE_SECRET_KEY={secret_key}')
                stripe_secret_updated = True
            else:
                updated_lines.append(line)
        
        if not stripe_pub_updated:
            updated_lines.append(f'STRIPE_PUBLISHABLE_KEY={publishable_key}')
        if not stripe_secret_updated:
            updated_lines.append(f'STRIPE_SECRET_KEY={secret_key}')
        
        with open(env_file, 'w') as f:
            f.write('\n'.join(updated_lines))
        
        print("✅ Stripe keys configured successfully!")
        print("💳 Payment system ready!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error configuring Stripe: {e}")
        return False

if __name__ == "__main__":
    configure_stripe()

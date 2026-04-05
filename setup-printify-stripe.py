#!/usr/bin/env python3
"""
Setup script for Printify + Stripe integration
Guides through getting API keys and configuring environment
"""
import os
import sys
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n🔥 {title}")
    print("=" * 50)

def print_step(step, description):
    """Print a step with description"""
    print(f"\n✅ STEP {step}: {description}")

def print_command(command, description):
    """Print a command with description"""
    print(f"\n💻 COMMAND: {command}")
    print(f"📝 DESCRIPTION: {description}")

def print_url(title, url):
    """Print a URL with title"""
    print(f"\n🌐 {title}: {url}")

def print_warning(message):
    """Print a warning message"""
    print(f"\n⚠️  WARNING: {message}")

def main():
    print_header("PRINTIFY + STRIPE SETUP GUIDE")
    
    print_step(1, "Get Your API Keys")
    print_url("Stripe Dashboard", "https://dashboard.stripe.com/apikeys")
    print_url("Printify Dashboard", "https://printify.com/dashboard/settings/api")
    
    print_step(2, "Environment Setup")
    print_command("cp .env.example .env", "Copy example environment file")
    print_command("nano .env", "Edit environment file with your keys")
    
    print_step(3, "Required API Keys")
    print("📋 You'll need these keys:")
    print("   • STRIPE_SECRET_KEY (from Stripe)")
    print("   • STRIPE_PUBLISHABLE_KEY (from Stripe)")
    print("   • STRIPE_WEBHOOK_SECRET (from Stripe)")
    print("   • PRINTIFY_API_KEY (from Printify)")
    print("   • SENDGRID_API_KEY (from SendGrid)")
    
    print_step(4, "Webhook Configuration")
    print_url("Stripe Webhook Setup", "https://dashboard.stripe.com/webhooks")
    print("🎯 Webhook URL: https://your-domain.vercel.app/api/stripe-webhook")
    
    print_step(5, "Test Integration")
    print_command("python api/create-payment-intent.py", "Test payment intent creation")
    print_command("python api/create-printify-order.py", "Test Printify order creation")
    
    print_step(6, "Deploy to Vercel")
    print_command("vercel --prod", "Deploy to production")
    
    print_warning("⚠️  Make sure to:")
    print("   • Add .env to .gitignore")
    print("   • Test with test keys first!")
    print("   • Update webhook URL in Stripe dashboard")
    
    print_header("READY TO LAUNCH! 🚀")
    print("✨ Your Stripe → Printify integration is complete!")
    print("💰 Customers pay via Stripe, orders go to Printify")
    print("📧 Full setup guide in .env.example")

if __name__ == "__main__":
    main()

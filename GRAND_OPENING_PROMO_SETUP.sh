#!/bin/bash
# NLBL Grand Opening Promo Setup Guide

# This guide helps you set up working discount codes for your grand opening

# ============================================================================
# PART 1: Your Website Links (Share These on Social Media!)
# ============================================================================

# Once you deploy, your shareable links will be:

# MAIN SHOP:
# https://www.nolimitsbeyondlimitations.com
# or your actual domain name

# WITH PROMO CODE (Pre-filled for customers):
# https://www.nolimitsbeyondlimitations.com/shop.html?promo=LAUNCH25
# https://www.nolimitsbeyondlimitations.com/shop.html?promo=WELCOME20

echo "📍 Your Website Links for Social Media:"
echo "Main Shop: https://www.nolimitsbeyondlimitations.com"
echo "With Promo LAUNCH25: https://www.nolimitsbeyondlimitations.com?promo=LAUNCH25"
echo "With Promo WELCOME20: https://www.nolimitsbeyondlimitations.com?promo=WELCOME20"
echo ""

# ============================================================================
# PART 2: Promotion Codes to Create in Stripe
# ============================================================================

echo "🎁 GRAND OPENING PROMO CODES (Create in Stripe Dashboard)"
echo ""
echo "Step-by-step to add these to Stripe:"
echo "1. Go to https://dashboard.stripe.com/coupons"
echo "2. Click 'Create Coupon'"
echo "3. Enter the details below"
echo "4. Click 'Create Coupon'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PROMO CODE #1: LAUNCH25"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Coupon code: LAUNCH25"
echo "Discount type: Percentage"
echo "Percentage off: 25%"
echo "Duration: Limited time"
echo "Expiration date: [One month from launch date, e.g., April 4, 2026]"
echo "Description: Grand Opening - 25% Off Everything"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PROMO CODE #2: WELCOME20"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Coupon code: WELCOME20"
echo "Discount type: Percentage"
echo "Percentage off: 20%"
echo "Duration: Limited time"
echo "Expiration date: [One month from launch date, e.g., April 4, 2026]"
echo "Description: Welcome Discount - 20% Off"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PROMO CODE #3: FIRSTORDER10"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Coupon code: FIRSTORDER10"
echo "Discount type: Percentage"
echo "Percentage off: 10%"
echo "Duration: Limited time"
echo "Expiration date: [One month from launch date, e.g., April 4, 2026]"
echo "Description: First Time Customer - 10% Off"
echo ""

# ============================================================================
# PART 3: Social Media Copy (Ready to Paste!)
# ============================================================================

echo "📱 SOCIAL MEDIA COPY TO USE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TIKTOK/INSTAGRAM POST #1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
🎉 WE'RE LIVE! 🎉

No Limits Beyond Limitations is officially OPEN!

🌌 Custom Galaxy-Themed Memorial Apparel
✨ Wear Your Story
💫 25% OFF GRAND OPENING

Use code: LAUNCH25
Link in bio!

First 50 orders get exclusive sticker pack 📦

#NoLimitsBeyondLimitations #NLBL #GrandOpening #CustomApparel #MemorialWear #SupportSmallBusiness #GalaxyAesthetic
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TIKTOK/INSTAGRAM POST #2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
Every shirt tells a story ✨

At NLBL, we create custom apparel that celebrates life and honors memory.

🌌 Galaxy-themed designs
💕 Perfect for remembrance
👕 Premium quality

LIMITED TIME: Use code WELCOME20 for 20% off your first order!

www.nolimitsbeyondlimitations.com

#CustomClothing #MemorialApparel #SmallBusiness #SustainableFashion #CustomApparel
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "INSTAGRAM STORIES/REELS POST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
🚀 GRAND OPENING WEEK

30 days of exclusive deals!

🎁 Save 25% → Use LAUNCH25
🎁 Save 20% → Use WELCOME20
🎁 Save 10% → Use FIRSTORDER10

First 50 orders: FREE sticker pack 📦

Shop now: [Link in bio]

Expires in 30 days! ⏰

#NLBL #GrandOpening #ShopSmall #SupportIndependent
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FACEBOOK POST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
Welcome to No Limits Beyond Limitations! 🌌

We're thrilled to announce the grand opening of our custom apparel shop. Every piece is designed with care, from galaxy-themed masterpieces to heartfelt memorial wear.

🎯 GRAND OPENING SPECIAL (30 Days Only)
💫 25% Off with code LAUNCH25
💫 20% Off with code WELCOME20
💫 10% Off with code FIRSTORDER10

Plus: First 50 orders receive an exclusive sticker pack!

Visit us today: [OUR WEBSITE LINK]

Thank you for supporting our journey! 💙
EOF

echo ""

# ============================================================================
# PART 4: How to Share the Links
# ============================================================================

echo "📤 HOW TO SHARE YOUR PROMO LINKS"
echo ""
echo "1. Copy this exact link:"
echo "   https://www.nolimitsbeyondlimitations.com/?promo=LAUNCH25"
echo ""
echo "2. Share in your social media bio (edit profile, add link to shop)"
echo "3. In TikTok/Instagram: Type 'Link in bio!' in posts"
echo "4. In Twitter/X: Tweet the link"
echo "5. In Facebook: Post the link and watch engagement!"
echo ""

echo "✅ DOMAIN SETUP (Next Step)"
echo ""
echo "To use a custom domain, you need to:"
echo "1. Register domain: nolimitsbeyondlimitations.com or similar"
echo "   Platforms: Namecheap, GoDaddy, Google Domains ($10-15/year)"
echo ""
echo "2. Deploy website: Then connect domain"
echo "   Options: Netlify (free), Vercel (free), or traditional hosting"
echo ""
echo "3. Once deployed, your shareable link becomes:"
echo "   https://nolimitsbeyondlimitations.com/?promo=LAUNCH25"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#!/usr/bin/env python3
"""
Simple test script for promo code API
"""
import os
import json
import stripe
from dotenv import load_dotenv

load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def test_promo_code():
    """Test creating a payment intent with promo code"""
    try:
        # Test data
        test_data = {
            "product_id": "test_product_1",
            "quantity": 1,
            "promo_code": "LAUNCH25",
            "customer_info": {
                "name": "Test User",
                "email": "test@example.com",
                "address": "123 Test St",
                "city": "Test City",
                "zip": "12345"
            }
        }

        # Base price
        base_price = 2999  # $29.99 in cents
        quantity = test_data["quantity"]
        amount = base_price * quantity

        # Apply promo code discount
        promo_code = test_data.get("promo_code")
        discount_percent = 0

        if promo_code == "LAUNCH25":
            discount_percent = 25
        elif promo_code == "WELCOME20":
            discount_percent = 20
        elif promo_code == "FIRSTORDER10":
            discount_percent = 10

        if discount_percent > 0:
            discount_amount = int(amount * discount_percent / 100)
            amount = amount - discount_amount
            print(f"✅ Applied {discount_percent}% discount: ${discount_amount/100:.2f} off")

        # Create payment intent
        payment_intent_params = {
            "amount": amount,
            "currency": "usd",
            "payment_method_types": ["card"],
            "metadata": {
                "product_id": str(test_data["product_id"]),
                "quantity": str(test_data["quantity"]),
                "customer_email": test_data["customer_info"]["email"],
                "promo_code": promo_code or "",
                "original_amount": str(base_price * quantity),
                "discount_applied": str(discount_percent) + "%" if discount_percent > 0 else "0%"
            }
        }

        intent = stripe.PaymentIntent.create(**payment_intent_params)

        return {
            "success": True,
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount,
            "currency": "usd",
            "promo_code": promo_code,
            "discount_applied": f"{discount_percent}%" if discount_percent > 0 else "0%",
            "original_price": f"${base_price * quantity / 100:.2f}",
            "final_price": f"${amount / 100:.2f}"
        }

    except stripe.error.InvalidRequestError as e:
        return {
            "success": False,
            "error": f"Invalid coupon: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    print("🧪 Testing promo code API...")
    result = test_promo_code()
    print(json.dumps(result, indent=2))

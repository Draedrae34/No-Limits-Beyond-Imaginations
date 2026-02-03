# Printful API v2 Integration for NoLimitsClothing

This integration allows your website to connect with Printful's API v2 for custom clothing orders, catalog browsing, and mockup generation.

## Setup Instructions

### 1. Get Printful API Token
1. Go to [Printful Dashboard](https://www.printful.com/dashboard)
2. Navigate to Settings > Stores > API
3. Create a new API token (store-level or account-level)
4. Copy the token

### 2. Environment Variables
Set the following environment variables:

```bash
export PRINTFUL_API_TOKEN="your_api_token_here"
export PRINTFUL_STORE_ID="your_store_id_if_needed"
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Flask Backend
```bash
python shop_app.py
```

The backend will run on http://localhost:5000

### 5. Access the Shop
Open `shop.html` in your browser (served by the static server on port 8000).

## Files Created

- `printful_client.py`: Python client library for Printful API v2
- `shop_app.py`: Flask backend providing API endpoints
- `shop.html`: Frontend shop page with catalog browsing and order creation
- `requirements.txt`: Updated with Flask and flask-cors

## API Endpoints

The Flask app provides the following endpoints:

- `GET /api/products`: Get catalog products
- `GET /api/products/<id>`: Get single product
- `GET /api/products/<id>/variants`: Get product variants
- `GET /api/variants/<id>`: Get single variant
- `GET /api/products/<id>/prices`: Get product prices
- `POST /api/shipping-rates`: Calculate shipping rates
- `POST /api/order-estimation`: Create order estimation
- `GET /api/order-estimation/<task_id>`: Get estimation result
- `POST /api/orders`: Create order
- `POST /api/orders/<id>/confirm`: Confirm order
- `POST /api/mockups`: Generate mockups
- `GET /api/mockups`: Get mockup tasks

## Features

- Browse Printful catalog products
- View product variants and pricing
- Estimate order costs
- Create and confirm orders
- Generate custom mockups for designs

## Security Notes

- API tokens are sensitive - never expose them in client-side code
- For production, use HTTPS and proper authentication
- The current setup uses CORS for development; configure appropriately for production

## Next Steps

1. Customize the shop.html styling to match your site's theme
2. Add payment integration (Stripe, PayPal, etc.)
3. Implement user authentication
4. Add order tracking and management
5. Set up webhooks for order status updates

## Printful API Documentation

For full API documentation, visit: https://developers.printful.com/docs/
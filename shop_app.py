import base64
import hashlib
import hmac
import json
import logging
import os
import random
import re
import threading
import time
import traceback
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone

import pyotp
from flask import (
    Flask,
    g,
    jsonify,
    make_response,
    request,
    send_from_directory,
    url_for,
)
from werkzeug.utils import secure_filename

from ai_services import AIServiceManager, photographic_memory
from auth_service import auth_service, owner_required, token_required
from printify_client import PrintifyAPI
from security_service import security_service

# Lazy imports to prevent errors if files are missing during initial setup
try:
    from auth_service import auth_service, owner_required, token_required
    from printify_client import PrintifyAPI
    from security_service import security_service
    import stripe
    import pyotp
except ImportError as e:
    logger.warning(f"Missing dependency: {e}. Run 'pip install flask stripe pyotp'")

app = Flask(__name__)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(funcName)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("shop_app.log")],
)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Static assets directory (current repo root)
STATIC_DIR = os.path.abspath(os.path.dirname(__file__))
AI_GENERATED_DIR = os.path.join(STATIC_DIR, "ai_generated")
AI_UPLOADS_DIR = os.path.join(AI_GENERATED_DIR, "uploads")


# Simple CORS handling
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# Load API token from environment variable (Printify)
API_TOKEN = os.getenv("PRINTIFY_API_TOKEN")
SHOP_ID = os.getenv("PRINTIFY_SHOP_ID")
OPENAI_API_KEY = None
REPLICATE_API_TOKEN = None

# Initialize AI Service Manager (prefers Ollama when API keys are missing)
ai_service_manager = None
try:
    ai_service_manager = AIServiceManager(
        ollama_api_url=os.getenv("OLLAMA_API_URL", "http://127.0.0.1:11434"),
    )
    logger.info(
        "AIServiceManager initialized (OpenAI/Replicate keys optional, Ollama ready)."
    )
except Exception as exc:
    logger.warning(
        "AIServiceManager failed to initialize (check local Ollama or API keys): %s"
        % exc
    )

# Initialize Printify API client
api = None
if API_TOKEN and SHOP_ID:
    try:
        api = PrintifyAPI(API_TOKEN, SHOP_ID)
        logger.info("PrintifyAPI initialized successfully with shop_id: %s" % SHOP_ID)
    except Exception as e:
        logger.error("Could not initialize PrintifyAPI: %s" % e)
else:
    logger.error("Printify credentials not found - ensure PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID are set in .env")

# Global cache for stock data
stock_cache = {}

# Global storage for order statuses and notifications
order_statuses = {}  # order_id: {'status': str, 'updated_at': timestamp, 'history': []}
order_notifications = []  # list of notifications

DATA_DIR = "data"
CATALOG_METADATA_PATH = os.path.join(DATA_DIR, "catalog-metadata.json")
OWNER_SAMPLES_PATH = os.path.join(DATA_DIR, "owner-samples.json")
ANALYTICS_EVENTS_PATH = os.path.join(DATA_DIR, "analytics-events.json")
DAILY_TARGET_LOW = 5000 / 30
DAILY_TARGET_HIGH = 10000 / 30


def load_json_file(path, default=None):
    if default is None:
        default = []
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json_file(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)


def save_reference_image(data_uri):
    if not data_uri:
        return None
    match = re.match(r"data:(image/[^;]+);base64,(.+)", data_uri)
    if not match:
        raise ValueError("Unsupported image data")
    mime, payload = match.groups()
    extension = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
    }.get(mime, "png")
    ensure_directory(AI_UPLOADS_DIR)
    filename = f"upload_{uuid.uuid4().hex[:8]}.{extension}"
    target_path = os.path.join(AI_UPLOADS_DIR, filename)
    with open(target_path, "wb") as fh:
        fh.write(base64.b64decode(payload))
    return filename


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)


def parse_timestamp(ts):
    if not ts:
        return None
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except ValueError:
        try:
            return datetime.fromtimestamp(float(ts), tz=timezone.utc)
        except Exception:
            return None


def prepare_processed_events():
    events = load_json_file(ANALYTICS_EVENTS_PATH, [])
    processed = []
    for event in events:
        ts = parse_timestamp(event.get("timestamp"))
        if not ts:
            continue
        processed.append((event, ts))
    return processed


def format_duration(seconds):
    try:
        minutes = int(seconds) // 60
        secs = int(seconds) % 60
        return f"{minutes}:{secs:02d}"
    except Exception:
        return "0:00"


def build_analytics_dashboard():
    processed_events = prepare_processed_events()
    now = datetime.now(timezone.utc)
    traffic = []
    for offset in range(23, -1, -1):
        start = now - timedelta(hours=offset + 1)
        end = start + timedelta(hours=1)
        bucket = [event for event, ts in processed_events if start <= ts < end]
        visits = sum(1 for event in bucket if event.get("type") == "visit")
        orders = sum(1 for event in bucket if event.get("type") == "order")
        returns = sum(1 for event in bucket if event.get("type") == "return")
        revenue = sum(
            float(event.get("value", 0))
            for event in bucket
            if event.get("type") == "order"
        )
        traffic.append(
            {
                "label": start.strftime("%H:%M"),
                "visits": visits,
                "orders": orders,
                "returns": returns,
                "revenue": round(revenue, 2),
            }
        )

    daily = []
    for days_ago in range(13, -1, -1):
        day = (now - timedelta(days=days_ago)).date()
        day_revenue = sum(
            float(event.get("value", 0))
            for event, ts in processed_events
            if ts.date() == day and event.get("type") == "order"
        )
        daily.append({"date": day.isoformat(), "revenue": round(day_revenue, 2)})

    total_visits = sum(
        1 for event, _ in processed_events if event.get("type") == "visit"
    )
    total_orders = sum(
        1 for event, _ in processed_events if event.get("type") == "order"
    )
    total_returns = sum(
        1 for event, _ in processed_events if event.get("type") == "return"
    )
    total_revenue = sum(
        float(event.get("value", 0))
        for event, _ in processed_events
        if event.get("type") == "order"
    )
    session_durations = [
        float(event.get("sessionDuration", 0))
        for event, _ in processed_events
        if event.get("type") == "visit"
    ]
    avg_session = (
        sum(session_durations) / len(session_durations) if session_durations else 0
    )
    conversion_rate = (total_orders / total_visits) * 100 if total_visits else 0
    return_rate = (total_returns / total_orders) * 100 if total_orders else 0

    order_counter = Counter()
    revenue_counter = Counter()
    for event, _ in processed_events:
        if event.get("type") == "order":
            design = event.get("design", "unknown")
            order_counter[design] += int(event.get("quantity", 1))
            revenue_counter[design] += float(event.get("value", 0))

    top_trend = []
    for design, count in order_counter.most_common(6):
        top_trend.append(
            {
                "design": design,
                "orders": count,
                "revenue": round(revenue_counter.get(design, 0), 2),
            }
        )

    daily_avg = sum(item["revenue"] for item in daily) / max(len(daily), 1)
    monthly_projection = daily_avg * 30

    owner_samples = load_json_file(OWNER_SAMPLES_PATH, [])
    status_breakdown = Counter(item.get("status", "unknown") for item in owner_samples)

    return {
        "traffic": traffic,
        "dailyRevenue": daily,
        "trend": top_trend,
        "behavior": {
            "conversionRate": round(conversion_rate, 2),
            "returnRate": round(return_rate, 2),
            "avgSession": format_duration(avg_session),
        },
        "kpis": {
            "totalRevenue": round(total_revenue, 2),
            "uniqueVisitors": total_visits,
            "conversionRate": round(conversion_rate, 2),
            "avgSession": format_duration(avg_session),
        },
        "targets": {
            "dailyLow": round(DAILY_TARGET_LOW, 2),
            "dailyHigh": round(DAILY_TARGET_HIGH, 2),
            "monthlyProjection": round(monthly_projection, 2),
        },
        "ownerSamples": {
            "total": len(owner_samples),
            "statusBreakdown": dict(status_breakdown),
        },
    }


def poll_stock():
    """Background function to poll stock levels periodically. (Printify version)

    With Printify the "stock" data is not provided in a unified availability
    endpoint, so we simply cache product and variant information. This allows
    the frontend to query /api/stock and get the most recent snapshot without
    hammering the Printify API.
    """
    while True:
        try:
            if api is None:
                logger.warning("API not initialized, skipping stock poll")
                time.sleep(600)
                continue
            logger.info("Starting stock polling cycle (Printify)")
            products = api.get_products()
            product_list = products.get('data', []) if isinstance(products, dict) else products
            
            # Spread out requests to prevent CPU spikes and API rate limiting
            for product in product_list:
                product_id = product.get("id")
                variants = []
                try:
                    variants = api.get_variants(product_id)
                    time.sleep(1)  # 1 second gap between variant fetches
                except Exception:
                    # some products may not have variants or the call may fail
                    logger.debug(f"Could not load variants for {product_id}")
                stock_cache[product_id] = {"product": product, "variants": variants}
            logger.info(f"Stock cache updated for {len(product_list)} products. System stable.")
        except Exception as e:
            logger.error(f"Error polling stock: {str(e)}", exc_info=True)
        time.sleep(3600)  # Polling once per hour is plenty for POD stock


def log_owner_sample_from_order(product_name, quantity):
    """Automatically queue an owner sample when a customer buys."""
    try:
        samples = load_json_file(OWNER_SAMPLES_PATH, [])
        new_sample = {
            "id": f"AUTO-{uuid.uuid4().hex[:6]}",
            "product": f"OWNER COPY: {product_name}",
            "quantity": int(quantity),
            "desiredDate": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "shippingUrgency": "Express (3-5 days)",
            "notes": "Automatic sample triggered by customer purchase.",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        samples.append(new_sample)
        save_json_file(OWNER_SAMPLES_PATH, samples)
        logger.info(f"Owner sample auto-queued for {product_name}")
    except Exception as e:
        logger.error(f"Failed to auto-queue sample: {e}")


def update_order_status(order_id, new_status):
    """Update order status and create notification (used by Printify/Stripe workflows)."""
    current_time = time.time()
    if order_id not in order_statuses:
        order_statuses[order_id] = {
            "status": new_status,
            "updated_at": current_time,
            "history": [{"status": new_status, "timestamp": current_time}],
        }
        logger.info(f"New order status initialized for order {order_id}: {new_status}")
    else:
        old_status = order_statuses[order_id]["status"]
        if old_status != new_status:
            order_statuses[order_id]["status"] = new_status
            order_statuses[order_id]["updated_at"] = current_time
            order_statuses[order_id]["history"].append(
                {"status": new_status, "timestamp": current_time}
            )

            # Create notification
            notification = {
                "order_id": order_id,
                "old_status": old_status,
                "new_status": new_status,
                "timestamp": current_time,
                "message": f"Order {order_id} status changed from {old_status} to {new_status}",
            }
            order_notifications.append(notification)
            logger.info(
                f"Order {order_id} status updated: {old_status} -> {new_status}"
            )


def handle_printify_fulfillment(payment_intent):
    """Trigger actual order creation in Printify after payment."""
    if api is None:
        logger.error("Printify API not initialized, cannot fulfill order")
        return

    metadata = payment_intent.get("metadata", {})
    try:
        # Extract shipping info from Stripe (Requires customer_info in PaymentIntent)
        # This is a simplified version; in production, you'd map Stripe addresses
        order_data = {
            "external_id": payment_intent.get("id"),
            "line_items": [
                {
                    "product_id": metadata.get("product_id"),
                    "quantity": int(metadata.get("quantity", 1)),
                    # Note: Printify usually requires variant_id for line items
                    "variant_id": metadata.get("variant_id") 
                }
            ],
            "shipping_method": 1,
            "send_shipping_notification": True,
            "address_to": {
                "first_name": metadata.get("customer_name", "Valued"),
                "last_name": "Customer",
                "email": metadata.get("customer_email"),
                "phone": "",
                "country": "US",
                "region": "",
                "city": "",
                "address1": "",
                "zip": ""
            }
        }
        
        result = api.create_order(order_data)
        order_id = result.get("id")
        update_order_status(order_id, "pending")
        logger.info(f"Fulfillment automated: Printify order {order_id} created.")
    except Exception as e:
        logger.error(f"Failed to automate fulfillment: {e}")


@app.before_request
def apply_security():
    security_service.monitor_request()


@app.route("/api/products", methods=["GET"])
def get_products():
    """Get catalog products."""
    params = request.args.to_dict()
    try:
        logger.info("Fetching products catalog")
        data = api.get_products(**params)
        logger.info(f"Retrieved {len(data.get('result', []))} products")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Get a single product."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching product {product_id}")
        data = api.get_product(product_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting product {product_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>/variants", methods=["GET"])
def get_product_variants(product_id):
    """Get product variants."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching variants for product {product_id}")
        data = api.get_product_variants(product_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(
            f"Error getting variants for product {product_id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@app.route("/api/variants/<int:variant_id>", methods=["GET"])
def get_variant(variant_id):
    """Get a single variant."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching variant {variant_id}")
        data = api.get_variant(variant_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting variant {variant_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>/prices", methods=["GET"])
def get_product_prices(product_id):
    """Get product prices."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching prices for product {product_id}")
        data = api.get_product_prices(product_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(
            f"Error getting prices for product {product_id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@app.route("/api/shipping-rates", methods=["POST"])
def calculate_shipping():
    """Calculate shipping rates."""
    data = request.get_json()
    try:
        logger.info("Calculating shipping rates")
        result = api.calculate_shipping_rates(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error calculating shipping rates: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/order-estimation", methods=["POST"])
def estimate_order():
    """Create order estimation task."""
    data = request.get_json()
    try:
        logger.info("Creating order estimation task")
        result = api.create_order_estimation_task(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error creating order estimation: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/order-estimation/<task_id>", methods=["GET"])
def get_estimation(task_id):
    """Get order estimation result."""
    try:
        logger.info(f"Getting order estimation for task {task_id}")
        result = api.get_order_estimation_task(task_id)
        return jsonify(result)
    except Exception as e:
        logger.error(
            f"Error getting estimation for task {task_id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@app.route("/api/orders", methods=["POST"])
def create_order():
    """Create a new order."""
    data = request.get_json()
    try:
        logger.info("Creating new order")
        result = api.create_order(data)
        logger.info(f"Order created: {result.get('result', {}).get('id')}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/orders/<order_id>/confirm", methods=["POST"])
def confirm_order(order_id):
    """Confirm an order."""
    try:
        logger.info(f"Confirming order {order_id}")
        result = api.confirm_order(order_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error confirming order {order_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stripe-payment", methods=["POST"])
def create_stripe_payment():
    """
    Create a Stripe payment intent with optional promo code support.
    Expects: {
        "product_id": str,
        "quantity": int,
        "promo_code": str (optional),
        "customer_info": {...}
    }
    """
    try:
        import stripe
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

        data = request.get_json()
        product_id = data.get("product_id")
        quantity = data.get("quantity", 1)
        promo_code = data.get("promo_code")
        customer_info = data.get("customer_info", {})

        # For demo purposes, use a fixed price per product
        # In production, look up product price from all_products_inventory.json
        price_per_item = 2999  # $29.99 in cents

        try:
            # Load product and apply 2.2x multiplier for ~55% profit margin
            import json
            with open("all_products_inventory.json", "r") as f:
                inventory = json.load(f)
                for product in inventory.get("products", []):
                    if str(product.get("id")) == str(product_id):
                        # Cost from Printify * 2.2 (Targeting 40-70% range)
                        price_per_item = int(float(product.get("price", 25.00)) * 2.2 * 100)
                        break
        except:
            # Fall back to default price
            pass

        amount = price_per_item * quantity

        # Apply promo code discount
        discount_percent = 0
        if promo_code == "LAUNCH25":
            discount_percent = 25
        elif promo_code == "WELCOME20":
            discount_percent = 20
        elif promo_code == "FIRSTORDER10":
            discount_percent = 10

        original_amount = amount
        if discount_percent > 0:
            discount_amount = int(amount * discount_percent / 100)
            amount = amount - discount_amount

        # Create payment intent
        payment_intent_params = {
            "amount": amount,
            "currency": "usd",
            "payment_method_types": ["card"],
            "metadata": {
                "product_id": str(product_id),
                "quantity": str(quantity),
                "customer_email": customer_info.get("email", ""),
                "promo_code": promo_code or "",
                "original_amount": str(original_amount),
                "discount_applied": str(discount_percent) + "%" if discount_percent > 0 else "0%"
            }
        }

        intent = stripe.PaymentIntent.create(**payment_intent_params)

        return jsonify({
            "success": True,
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount,
            "currency": "usd",
            "promo_code": promo_code,
            "discount_applied": f"{discount_percent}%" if discount_percent > 0 else "0%",
            "original_price": f"${original_amount / 100:.2f}",
            "final_price": f"${amount / 100:.2f}"
        })

    except stripe.error.CardError as e:
        logger.error(f"Card error: {e.user_message}")
        return jsonify({
            "success": False,
            "error": e.user_message
        }), 400
    except stripe.error.InvalidRequestError as e:
        logger.error(f"Invalid request: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Invalid request: {str(e)}"
        }), 400
    except Exception as e:
        logger.error(f"Stripe payment error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Payment processing error: {str(e)}"
        }), 500


def create_mockups():
    """Create mockup generation tasks."""
    data = request.get_json()
    try:
        logger.info("Creating mockup tasks")
        result = api.create_mockup_tasks(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error creating mockups: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/mockups", methods=["GET"])
def get_mockups():
    """Get mockup tasks."""
    params = request.args.to_dict()
    try:
        logger.info("Fetching mockup tasks")
        result = api.get_mockup_tasks(**params)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting mockups: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Authentication endpoints
@app.route("/api/auth/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    mfa_code = data.get("mfa_code")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    success, result = auth_service.authenticate_user(username, password, mfa_code)
    if not success:
        return jsonify({"error": result}), 401

    token = auth_service.generate_token(result)
    return jsonify(
        {
            "token": token,
            "user": {"username": result["username"], "role": result["role"]},
            "mfa_required": bool(result.get("mfa_secret") and not mfa_code),
        }
    )


@app.route("/api/auth", methods=["POST"])
def access_control():
    """Support AccessControl.js login/verify actions"""
    data = request.get_json() or {}
    action = data.get("action")
    if action == "login":
        username = data.get("username", "owner")
        password = data.get("password")
        target = "owner" if username == "admin" else username
        if not password:
            return jsonify({"success": False, "error": "Password required"}), 400

        success, result = auth_service.authenticate_user(target, password)
        if not success:
            return jsonify({"success": False, "error": result}), 401

        token = auth_service.generate_token(result)
        return jsonify({"success": True, "token": token})
    elif action == "verify":
        token = data.get("token")
        if not token:
            return jsonify({"success": False, "error": "Token missing"}), 400

        valid, _ = auth_service.verify_token(token)
        return jsonify({"success": valid})

    return jsonify({"success": False, "error": "Unknown action"}), 400


@app.route("/api/auth/setup-mfa", methods=["POST"])
@token_required
def setup_mfa():
    """Setup MFA for authenticated user"""
    username = g.user["username"]
    secret = auth_service.setup_mfa(username)
    if secret:
        # Generate QR code URL
        totp = pyotp.TOTP(secret)
        qr_url = totp.provisioning_uri(name=username, issuer_name="NoLimitsClothing")
        return jsonify({"secret": secret, "qr_url": qr_url})
    return jsonify({"error": "Failed to setup MFA"}), 500


@app.route("/api/auth/verify-mfa", methods=["POST"])
@token_required
def verify_mfa():
    """Verify MFA code"""
    data = request.get_json()
    code = data.get("code")
    username = g.user["username"]

    user = auth_service._get_user_by_username(username)
    if not user or not user.get("mfa_secret"):
        return jsonify({"error": "MFA not configured"}), 400

    totp = pyotp.TOTP(user["mfa_secret"])
    if totp.verify(code):
        return jsonify({"valid": True})
    return jsonify({"valid": False, "error": "Invalid MFA code"}), 401


@app.route("/api/auth/audit-logs", methods=["GET"])
@token_required
@owner_required
def get_audit_logs():
    """Get audit logs (owner only)"""
    limit = request.args.get("limit", 100, type=int)
    logs = auth_service.get_audit_logs(limit)
    return jsonify(logs)


@app.route("/api/auth/create-customer", methods=["POST"])
@token_required
@owner_required
def create_customer():
    """Create a new customer account (owner only)"""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    success, result = auth_service.create_customer(username, password, email)
    if not success:
        return jsonify({"error": result}), 400

    return jsonify(
        {
            "message": "Customer created successfully",
            "customer": {
                "username": result["username"],
                "role": result["role"],
                "email": result.get("email"),
            },
        }
    )


@app.route("/api/ai/generate/text", methods=["POST"])
@token_required
@owner_required
def ai_generate_text():
    if not ai_service_manager:
        return jsonify(
            {"error": "AI Service Manager not initialized. Missing API keys."}
        ), 500

    try:
        data = request.get_json()
        prompt = data.get("prompt")
        model = data.get("model", "gpt-4o-mini")

        if not prompt:
            return jsonify({"error": "Prompt is required for text generation."}), 400

        logger.info(
            f"Generating text with model '{model}' for prompt: {prompt[:100]}..."
        )
        generated_text, filepath = ai_service_manager.generate_text(prompt, model)
        logger.info(f"Text generated and saved to {filepath}")

        return jsonify(
            {"generated_text": generated_text, "filepath": filepath, "model": model}
        )

    except Exception as e:
        logger.error(f"Error in AI text generation: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# AI Assistant endpoints (protected)
@app.route("/api/ai/chat", methods=["POST"])
@token_required
@owner_required
def ai_chat():
    if not ai_service_manager:
        return jsonify(
            {"error": "AI Service Manager not initialized. Missing API keys."}
        ), 500

    data = request.get_json() or {}
    query = data.get("query", "").strip()
    model = data.get("model")

    if not query:
        return jsonify({"error": "Query is required for AI chat."}), 400

    try:
        logger.info(f"AI chat prompt received: {query[:80]}")
        # Lil-Mystic processes the request through Gemini
        generated_text, _ = ai_service_manager.generate_text(query, "gemini-1.5-flash")
        return jsonify({"response": generated_text, "result": generated_text})
    except Exception as exc:
        logger.error("AI chat generation failed", exc_info=exc)
        fallback = f"Lil-Mystic is having a moment. Let's try that again, friend."
        return jsonify({"response": fallback})


@app.route("/api/ai/generate", methods=["POST"])
@token_required
@owner_required
def ai_generate():
    return jsonify(
        {"error": "Unsupported generation endpoint—use /api/ai/upload-generate"}
    ), 501


@app.route("/api/ai/upload-generate", methods=["POST"])
@token_required
@owner_required
def ai_upload_generate():
    if not ai_service_manager:
        return jsonify(
            {"error": "AI Service Manager not initialized. Missing API keys."}
        ), 500

    data = request.get_json()
    prompt = data.get("prompt")
    provider = data.get("provider", "local")
    model = data.get("model", "dall-e-3")
    source_image = data.get("source_image")

    if not prompt:
        return jsonify({"error": "Prompt is required for generation."}), 400

    reference_url = None
    local_ref_path = None
    if source_image:
        try:
            filename = save_reference_image(source_image)
            local_ref_path = os.path.join(AI_UPLOADS_DIR, filename)
            reference_url = url_for("ai_assets", filename=f"uploads/{filename}")
        except Exception as exc:
            logger.error(f"Unable to save reference image: {exc}", exc_info=True)
            return jsonify({"error": f"Reference image error: {exc}"}), 400

    try:
        generated_result = ai_service_manager.generate_image(prompt, provider, model, source_image_path=local_ref_path)
        result_url, filepath = generated_result
        logger.info(f"Uploaded design generated for prompt: {prompt[:60]}...")

        return jsonify(
            {
                "type": "image",
                "result": result_url,
                "filepath": filepath,
                "prompt": prompt,
                "provider": provider,
                "model": model,
                "reference_url": reference_url,
            }
        )
    except Exception as e:
        logger.error(f"Error in upload-based AI generation: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stock", methods=["GET"])
def get_stock():
    """Retrieve cached stock/product information.

    This endpoint uses the in-memory ``stock_cache`` that is populated by the
    ``poll_stock`` background thread. Query parameters:

    - ``product_id``: return the cached product entry (including variants).
    - ``variant_id``: search all cached variants for the given id and return it.
    - no parameters: return the entire cache.
    """
    product_id = request.args.get("product_id", type=int)
    variant_id = request.args.get("variant_id", type=int)
    try:
        if product_id:
            return jsonify(stock_cache.get(product_id, {}))
        if variant_id:
            for pid, info in stock_cache.items():
                for v in info.get("variants", []):
                    if v.get("id") == variant_id:
                        return jsonify(v)
            return jsonify({})
        # default: return full cache
        return jsonify(stock_cache)
    except Exception as e:
        logger.error(f"Error getting stock: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    """Return the local products inventory JSON file."""
    try:
        inventory = load_json_file("all_products_inventory.json", {"products": []})
        return jsonify(inventory)
    except Exception as e:
        logger.error(f"Error reading inventory file: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/sync-products", methods=["POST"])
def sync_products():
    """Fetch product list from Printify and save to local inventory file.

    The JSON structure matches the existing ``all_products_inventory.json``
    format used by the frontend. Only a minimal set of fields is stored; you
    can extend this logic with additional metadata as needed.
    """
    if api is None:
        return jsonify({"error": "API client not initialized"}), 500
    try:
        # Handle both list and dict response formats from Printify
        raw_data = api.get_products()
        products = raw_data.get('data', []) if isinstance(raw_data, dict) else raw_data
        
        inventory = {"products": []}
        for p in products:
            # Extract variants to find the price
            p_variants = p.get("variants", [])
            entry = {
                "id": p.get("id"),
                "name": p.get("title") or p.get("name") or "Unknown Product",
                "price": None,
                "image": None,
                "shop_id": p.get("shop_id")
            }
            
            if p_variants:
                price = p_variants[0].get("price")
                if isinstance(price, (int, float)):
                    entry["price"] = price / 100.0
                else:
                    try:
                        entry["price"] = float(price) / 100.0
                    except Exception:
                        entry["price"] = None
            
            inventory["products"].append(entry)
            
        save_json_file("all_products_inventory.json", inventory)
        return jsonify({"success": True, "count": len(inventory["products"])})
    except Exception as e:
        logger.error(f"Error syncing products: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stock-updates", methods=["GET"])
def get_stock_updates():
    """Get the latest cached stock information."""
    logger.info("Fetching stock updates cache")
    return jsonify(stock_cache)


@app.route("/api/custom-design", methods=["POST"])
def upload_custom_design():
    """Upload a custom design file.

    Printify does not currently support a one‑shot design upload endpoint the
    way Printful did, so this route simply proxies to ``api.upload_image`` if
    available and returns an informative error otherwise.
    """
    data = request.get_json()
    try:
        if not hasattr(api, "upload_image"):
            raise RuntimeError("Custom design upload is not implemented for Printify")
        logger.info("Uploading custom design via Printify")
        # expect data to include ``file_path`` key pointing to a local file
        result = api.upload_image(data.get("file_path"))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error uploading custom design: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/upload-design", methods=["POST"])
def upload_design_file():
    """Upload a design file and return the file URL."""
    try:
        if "file" not in request.files:
            logger.warning("File upload attempted without file part")
            return jsonify({"error": "No file part"}), 400
        file = request.files["file"]
        if file.filename == "":
            logger.warning("File upload with empty filename")
            return jsonify({"error": "No selected file"}), 400
        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            logger.info(f"File uploaded: {filename} to {filepath}")
            # Create URL for the uploaded file
            file_url = f"http://localhost:5000/uploads/{filename}"
            # Upload to Printify
            design_data = {"url": file_url, "filename": filename, "visible": True}
            result = api.upload_image(filepath)
            logger.info(f"Design uploaded to Printify: {result}")
            return jsonify({"file_url": file_url, "printify_file": result})
        logger.error("File upload failed unexpectedly")
        return jsonify({"error": "File upload failed"}), 400
    except Exception as e:
        logger.error(f"Error uploading design file: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/api/ai-generate", methods=["POST"])
def ai_generate_design():
    """Generate AI design."""
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        logger.info(f"Mock AI design generation for prompt: {prompt[:50]}...")
        # Mock AI design generation
        design_url = f"https://example.com/generated-design-{hash(prompt)}.png"
        logger.info(f"Mock design generated: {design_url}")
        return jsonify({"design_url": design_url, "prompt": prompt})
    except Exception as e:
        logger.error(f"Error in mock AI generation: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    """Get a single order."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching order {order_id}")
        data = api.get_order(order_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting order {order_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/orders", methods=["GET"])
def get_orders():
    """Get list of orders."""
    params = request.args.to_dict()
    try:
        logger.info("Fetching orders list")
        data = api.get_orders(**params)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting orders: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/order-status/<order_id>", methods=["GET"])
def get_order_status(order_id):
    """Get order status."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching status for order {order_id}")
        data = api.get_order_status(order_id, **params)
        return jsonify(data)
    except Exception as e:
        logger.error(
            f"Error getting order status for {order_id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@app.route("/api/fulfillment/<order_id>", methods=["GET"])
def get_fulfillment(order_id):
    """Get fulfillment status for an order with progress tracking."""
    params = request.args.to_dict()
    try:
        logger.info(f"Fetching fulfillment status for order {order_id}")
        data = api.get_fulfillment_status(order_id, **params)
        # Add our tracking info
        if order_id in order_statuses:
            data["tracking"] = order_statuses[order_id]
            data["progress_percentage"] = calculate_progress_percentage(
                order_statuses[order_id]["status"]
            )
            logger.info(f"Fulfillment data retrieved for order {order_id}")
        else:
            logger.warning(f"No tracking info found for order {order_id}")
        return jsonify(data)
    except Exception as e:
        logger.error(
            f"Error getting fulfillment for order {order_id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@app.route("/api/webhooks/stripe", methods=["POST"])
def stripe_webhook():
    """Handle Stripe webhook for successful payments."""
    import stripe
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        return jsonify({"error": str(e)}), 400

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        logger.info(f"Payment Succeeded: {payment_intent['id']}")
        
        # Extract metadata for fulfillment and samples
        prod_name = payment_intent.get('metadata', {}).get('product_name', 'Unknown Product')
        qty = payment_intent.get('metadata', {}).get('quantity', 1)
        
        log_owner_sample_from_order(prod_name, qty)
        # handle_printify_fulfillment(payment_intent) # Trigger actual Printify order

    return jsonify({"success": True}), 200


@app.route("/api/order-status-history/<order_id>", methods=["GET"])
def get_order_status_history(order_id):
    """Get status history for an order."""
    if order_id in order_statuses:
        return jsonify(order_statuses[order_id])
    else:
        return jsonify({"error": "Order not found"}), 404


@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    """Get recent order notifications."""
    limit = request.args.get("limit", default=10, type=int)
    recent_notifications = order_notifications[-limit:]
    return jsonify(recent_notifications)


@app.route("/api/analytics/dashboard", methods=["GET"])
def analytics_dashboard():
    """Return aggregated analytics for the private workshop."""
    payload = build_analytics_dashboard()
    return jsonify(payload)


@app.route("/api/owner-samples", methods=["POST"])
def create_owner_sample():
    """Create an owner sample entry."""
    data = request.get_json() or {}
    product = data.get("product")
    quantity = data.get("quantity", 1)
    desired_date = data.get("desiredDate")
    shipping_urgency = data.get("shippingUrgency", "Standard (5-7 days)")
    notes = data.get("notes", "")

    if not product:
        return jsonify({"error": "Product name required"}), 400

    samples = load_json_file(OWNER_SAMPLES_PATH, [])
    new_sample = {
        "id": str(uuid.uuid4()),
        "product": product,
        "quantity": int(quantity),
        "desiredDate": desired_date,
        "shippingUrgency": shipping_urgency,
        "notes": notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    samples.append(new_sample)
    save_json_file(OWNER_SAMPLES_PATH, samples)
    logger.info(f"Owner sample logged: {new_sample['id']} for {product}")
    return jsonify(new_sample), 201


@app.route("/api/owner-samples", methods=["PATCH"])
def update_owner_sample():
    """Update an owner sample status."""
    data = request.get_json() or {}
    sample_id = data.get("id")
    status = data.get("status")

    if not sample_id or not status:
        return jsonify({"error": "id and status are required"}), 400

    samples = load_json_file(OWNER_SAMPLES_PATH, [])
    updated = False
    for sample in samples:
        if sample.get("id") == sample_id:
            sample["status"] = status
            sample["updated_at"] = datetime.now(timezone.utc).isoformat()
            updated = True
            break

    if not updated:
        return jsonify({"error": "Sample not found"}), 404

    save_json_file(OWNER_SAMPLES_PATH, samples)
    logger.info(f"Owner sample {sample_id} status updated to {status}")
    return jsonify({"status": "ok", "id": sample_id, "new_status": status})


@app.route("/api/owner-samples", methods=["GET"])
def list_owner_samples():
    """Return the owner sample queue."""
    samples = load_json_file(OWNER_SAMPLES_PATH, [])
    status_filter = request.args.get("status")
    if status_filter and status_filter != "all":
        samples = [s for s in samples if s.get("status") == status_filter]
    return jsonify(samples)


@app.route("/api/fulfillment-progress/<order_id>", methods=["GET"])
def get_fulfillment_progress(order_id):
    """Get detailed fulfillment progress for an order."""
    try:
        logger.info(f"Fetching detailed fulfillment progress for order {order_id}")
        # Get order details
        order_data = api.get_order(order_id)
        order = order_data.get("result", {})

        # Get shipments
        shipments_data = api.get_shipments(order_id)
        shipments = shipments_data.get("result", [])

        # Get current status from our tracking
        status_info = order_statuses.get(order_id, {})

        progress = {
            "order_id": order_id,
            "status": order.get("status"),
            "tracking_info": status_info,
            "shipments": shipments,
            "progress_percentage": calculate_progress_percentage(order.get("status")),
        }

        logger.info(
            f"Fulfillment progress retrieved for order {order_id}: {progress['progress_percentage']}%"
        )
        return jsonify(progress)
    except Exception as e:
        logger.error(
            f"Error getting fulfillment progress for order {order_id}: {str(e)}",
            exc_info=True,
        )
        return jsonify({"error": str(e)}), 500


def calculate_progress_percentage(status):
    """Calculate progress percentage based on order status."""
    status_progress = {
        "draft": 0,
        "pending": 10,
        "failed": 0,
        "cancelled": 0,
        "on_hold": 20,
        "in_process": 50,
        "partially_fulfilled": 75,
        "fulfilled": 100,
        "archived": 100,
    }
    return status_progress.get(status, 0)


# Security monitoring endpoints
@app.route("/api/security/logs", methods=["GET"])
def get_security_logs():
    # Return threat logs and blockchain summary
    logs = {
        "threats": security_service.threat_log[-50:],  # Last 50
        "blockchain_length": len(security_service.blockchain),
        "last_scan": "Just Now",
    }
    return jsonify(logs)


@app.route("/api/security/scan", methods=["POST"])
def run_security_scan():
    # Trigger security scan
    security_service.self_recode()  # Retrain model
    return jsonify(
        {"status": "Scan completed", "threats": len(security_service.threat_log)}
    )


@app.route("/api/security/interaction", methods=["POST"])
def log_interaction():
    data = request.get_json()
    # Log interaction for monitoring
    interaction_log = {
        "timestamp": data.get("timestamp"),
        "type": data.get("type"),
        "data": data.get("data"),
        "sessionId": data.get("sessionId"),
    }
    # Could store in security_service or separate log
    # For now, just acknowledge
    return jsonify({"status": "logged"})


# Honeypot routes
@app.route("/admin", methods=["GET", "POST"])
def honeypot_admin():
    security_service.handle_threat(request, -1)  # Force log as threat
    return jsonify({"error": "Access denied"}), 403


@app.route("/login", methods=["POST"])
def honeypot_login():
    security_service.handle_threat(request, -1)
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/config", methods=["GET"])
def honeypot_config():
    security_service.handle_threat(request, -1)
    return jsonify({"error": "Access forbidden"}), 403


@app.route("/")
def customer_index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/<path:filename>")
def customer_files(filename):
    return send_from_directory(STATIC_DIR, filename)


@app.route("/workshop/")
def workshop():
    return send_from_directory(STATIC_DIR, "private.html")


@app.route("/workshop/<path:filename>")
def workshop_files(filename):
    return send_from_directory(STATIC_DIR, filename)


@app.route("/ai-assets/<path:filename>")
def ai_assets(filename):
    ensure_directory(AI_GENERATED_DIR)
    return send_from_directory(AI_GENERATED_DIR, filename)


@app.route("/memory/<path:filename>")
def memory_files(filename):
    memory_dir = os.path.join(STATIC_DIR, "memory")
    return send_from_directory(memory_dir, filename)


if __name__ == "__main__":
    # Perform an initial product sync so inventory.json reflects Printify data
    if api is not None:
        try:
            logger.info("Running initial product sync from Printify")
            sync_products()
        except Exception as e:
            logger.warning(f"Initial product sync failed: {e}")

    # Start background thread for stock polling
    stock_thread = threading.Thread(target=poll_stock, daemon=True)
    stock_thread.start()
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)

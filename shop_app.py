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
from printful_client import PrintfulAPI
from security_service import security_service

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


# Load API token from environment variable or use provided token for testing
API_TOKEN = os.getenv("PRINTFUL_API_TOKEN", "CjDCeFeC9Dzg877DKifxM8xagXxUHVOPhheHC353")
STORE_ID = os.getenv("PRINTFUL_STORE_ID")
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

if not API_TOKEN:
    raise ValueError("PRINTFUL_API_TOKEN environment variable is required")

api = PrintfulAPI(API_TOKEN, STORE_ID)

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
    """Background function to poll stock levels periodically."""
    while True:
        try:
            logger.info("Starting stock polling cycle")
            # Get all products
            products_response = api.get_products()
            products = products_response.get("result", [])
            for product in products:
                product_id = product["id"]
                # Get availability for this product (includes variants)
                availability = api.get_product_availability(product_id)
                stock_cache[product_id] = availability
            logger.info(f"Stock cache updated for {len(products)} products")
        except Exception as e:
            logger.error(f"Error polling stock: {str(e)}", exc_info=True)
        time.sleep(300)  # Poll every 5 minutes


def update_order_status(order_id, new_status):
    """Update order status and create notification."""
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


@app.route("/api/mockups", methods=["POST"])
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
        generated_text, _ = ai_service_manager.generate_text(query, model)
        return jsonify({"response": generated_text})
    except Exception as exc:
        logger.error("AI chat generation failed", exc_info=exc)
        fallback = f"[Local Seethrough] {query}"
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
    if source_image:
        try:
            filename = save_reference_image(source_image)
            reference_url = url_for("ai_assets", filename=f"uploads/{filename}")
        except Exception as exc:
            logger.error(f"Unable to save reference image: {exc}", exc_info=True)
            return jsonify({"error": f"Reference image error: {exc}"}), 400

    try:
        generated_result = ai_service_manager.generate_image(prompt, provider, model)
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
    """Get stock availability for products or variants."""
    product_id = request.args.get("product_id", type=int)
    variant_id = request.args.get("variant_id", type=int)
    params = request.args.to_dict()
    try:
        if product_id:
            logger.info(f"Fetching stock for product {product_id}")
            data = api.get_product_availability(product_id, **params)
        elif variant_id:
            logger.info(f"Fetching stock for variant {variant_id}")
            data = api.get_variant_availability(variant_id, **params)
        else:
            logger.warning("Stock request without product_id or variant_id")
            return jsonify({"error": "Provide product_id or variant_id"}), 400
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting stock: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stock-updates", methods=["GET"])
def get_stock_updates():
    """Get the latest cached stock information."""
    logger.info("Fetching stock updates cache")
    return jsonify(stock_cache)


@app.route("/api/custom-design", methods=["POST"])
def upload_custom_design():
    """Upload a custom design file."""
    data = request.get_json()
    try:
        logger.info("Uploading custom design")
        result = api.upload_custom_design(data)
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
            # Upload to Printful
            design_data = {"url": file_url, "filename": filename, "visible": True}
            result = api.upload_custom_design(design_data)
            logger.info(f"Design uploaded to Printful: {result}")
            return jsonify({"file_url": file_url, "printful_file": result})
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


@app.route("/api/webhooks/printful", methods=["POST"])
def printful_webhook():
    """Handle Printful webhook for order status updates."""
    try:
        data = request.get_json()
        if not data:
            logger.warning("Webhook received with no data")
            return jsonify({"error": "No data"}), 400

        logger.info(f"Received webhook: {data.get('type')}")

        # Verify webhook signature if secret is provided
        webhook_secret = os.getenv("PRINTFUL_WEBHOOK_SECRET")
        if webhook_secret:
            signature = request.headers.get("X-PF-Signature")
            if not signature:
                logger.error("Webhook missing signature")
                return jsonify({"error": "Missing signature"}), 401

            payload = request.get_data()
            expected_signature = hmac.new(
                webhook_secret.encode(), payload, hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                logger.error("Webhook invalid signature")
                return jsonify({"error": "Invalid signature"}), 401

        # Process webhook event
        event_type = data.get("type")
        if event_type == "order_updated":
            order_id = data.get("data", {}).get("order", {}).get("id")
            new_status = data.get("data", {}).get("order", {}).get("status")

            if order_id and new_status:
                update_order_status(order_id, new_status)
                logger.info(f"Processed order update: {order_id} to {new_status}")
            else:
                logger.warning("Webhook order_updated missing order_id or status")

        return jsonify({"status": "ok"}), 200
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


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
    return send_from_directory("../web_assets", "index.html")


@app.route("/<path:filename>")
def customer_files(filename):
    return send_from_directory("../web_assets", filename)


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
    # Start background thread for stock polling
    stock_thread = threading.Thread(target=poll_stock, daemon=True)
    stock_thread.start()
    app.run(host="127.0.0.1", port=5001, debug=False, use_reloader=False)

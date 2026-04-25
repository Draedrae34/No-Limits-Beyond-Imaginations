from flask import Flask, jsonify, request
import os
import quantum_assistant
import shop_app

app = Flask(__name__)


@app.route("/")
def root():
    return jsonify(
        {
            "status": "Silent Spirits API is Active",
            "backend": "Google Cloud / Vercel Bridge",
            "identity": "Lil-Mystic",
            "version": "3.0.0",
        }
    )


@app.route("/api/test")
def test_endpoint():
    return jsonify(
        {
            "status": "Backend is live",
            "identity": "Lil-Mystic",
            "timestamp": os.getenv("VERCEL_DEPLOYMENT_ID", "local-dev"),
        }
    )


@app.route("/api/health")
def health():
    # Check environment variable status
    env_vars = {
        "GOOGLE_API_KEY": bool(os.getenv("GOOGLE_API_KEY")),
        "STRIPE_SECRET_KEY": bool(os.getenv("STRIPE_SECRET_KEY")),
        "PRINTIFY_API_TOKEN": bool(os.getenv("PRINTIFY_API_TOKEN")),
        "PRINTIFY_SHOP_ID": bool(os.getenv("PRINTIFY_SHOP_ID")),
        "QUANTUM_ADMIN_PASS": bool(os.getenv("QUANTUM_ADMIN_PASS")),
        "VERCEL": bool(os.getenv("VERCEL")),
        "VERCEL_ENV": os.getenv("VERCEL_ENV", "unknown"),
    }

    return jsonify(
        {
            "status": "1100% Pure Functional",
            "timestamp": "2026",
            "services": ["auth", "ai", "products", "orders", "analytics"],
            "environment_variables": env_vars,
        }
    )


@app.route("/api/auth/login", methods=["POST"])
def login():
    return quantum_assistant.chat()


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    # Route to Lil-Mystic's real brain
    return quantum_assistant.api_chat()


@app.route("/api/upload-design", methods=["POST"])
def upload_design():
    return shop_app.upload_design_file()


@app.route("/api/owner-samples", methods=["GET", "POST", "PATCH"])
def owner_samples():
    if request.method == "GET":
        return shop_app.list_owner_samples()
    elif request.method == "POST":
        return shop_app.create_owner_sample()
    return shop_app.update_owner_sample()


@app.route("/api/business/metrics", methods=["GET"])
def business_metrics():
    return quantum_assistant.get_dashboard_metrics()


@app.route("/api/analytics/dashboard", methods=["GET"])
def analytics_dashboard():
    # This bridges the Private Workshop charts to the Stripe API
    return quantum_assistant.api_analytics_dashboard()


@app.route("/api/products", methods=["GET"])
def products():
    return shop_app.get_products()


@app.route("/api/env-check")
def env_check():
    """Debug endpoint to check environment variables"""
    return jsonify(
        {
            "GOOGLE_API_KEY": (
                "***" + os.getenv("GOOGLE_API_KEY", "NOT_SET")[-4:]
                if os.getenv("GOOGLE_API_KEY")
                else "NOT_SET"
            ),
            "STRIPE_SECRET_KEY": (
                "***" + os.getenv("STRIPE_SECRET_KEY", "NOT_SET")[-4:]
                if os.getenv("STRIPE_SECRET_KEY")
                else "NOT_SET"
            ),
            "PRINTIFY_API_TOKEN": (
                "***" + os.getenv("PRINTIFY_API_TOKEN", "NOT_SET")[-4:]
                if os.getenv("PRINTIFY_API_TOKEN")
                else "NOT_SET"
            ),
            "PRINTIFY_SHOP_ID": os.getenv("PRINTIFY_SHOP_ID", "NOT_SET"),
            "QUANTUM_ADMIN_PASS": (
                "CONFIGURED" if os.getenv("QUANTUM_ADMIN_PASS") else "NOT_SET"
            ),
        }
    )


# Export the app directly for Vercel's Python runtime
handler = app

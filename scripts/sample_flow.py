import argparse
import datetime
import os
import sys
import textwrap

import requests

DEFAULT_BASE_URL = os.getenv("WORKSHOP_API_URL", "http://127.0.0.1:5001")


def call_ai_generation(session, prompt, endpoint="/api/ai/generate"):
    payload = {
        "prompt": prompt,
        "type": "image",
    }
    resp = session.post(f"{DEFAULT_BASE_URL}{endpoint}", json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    print("AI generation result:\n", data)
    return data


def log_owner_sample(session, product, quantity, desired_date, urgency, notes):
    payload = {
        "product": product,
        "quantity": quantity,
        "desiredDate": desired_date,
        "shippingUrgency": urgency,
        "notes": notes,
    }
    resp = session.post(f"{DEFAULT_BASE_URL}/api/owner-samples", json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    print("Logged owner sample:\n", data)
    return data


def fetch_analytics(session):
    resp = session.get(f"{DEFAULT_BASE_URL}/api/analytics/dashboard", timeout=20)
    resp.raise_for_status()
    data = resp.json()
    print("Analytics snapshot:\n", data.get("kpis", {}))
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Run a quick sample workflow: AI design, owner sample, analytics check"
    )
    parser.add_argument("--prompt", default="Purple nebula biker hoodie with glowing roses", help="AI prompt for the design generator")
    parser.add_argument("--product", default="Nebula Rose Hoodie", help="Product name for owner sample")
    parser.add_argument("--quantity", type=int, default=1, help="Quantity for sample log")
    parser.add_argument("--urgency", default="Express (3-5 days)", help="Shipping urgency")
    parser.add_argument("--notes", default="Sample logged via quick flow", help="Notes" )
    parser.add_argument("--date", default=datetime.date.today().isoformat(), help="Desired ship date")
    parser.add_argument("--auth", default=None, help="Bearer token if owner routes require authentication")
    args = parser.parse_args()

    session = requests.Session()
    if args.auth:
        session.headers.update({"Authorization": f"Bearer {args.auth}"})

    print(textwrap.dedent(
        f"""
        🚀 Running Cosmos Sample Flow
        BASE URL: {DEFAULT_BASE_URL}
        Prompt: {args.prompt}
        Product: {args.product}
        """
    ))

    try:
        ai_resp = call_ai_generation(session, args.prompt)
        log_owner_sample(
            session,
            args.product,
            args.quantity,
            args.date,
            args.urgency,
            args.notes,
        )
        fetch_analytics(session)
        print("✅ Sample workflow complete. Check the private workshop for results.")
    except requests.HTTPError as exc:
        print("HTTP error while running sample flow:" , exc)
        sys.exit(1)
    except Exception as exc:
        print("Unexpected error:", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()

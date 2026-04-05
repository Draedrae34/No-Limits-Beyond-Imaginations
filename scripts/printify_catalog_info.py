#!/usr/bin/env python3
"""Helpers for collecting Printify blueprint/provider metadata."""
import argparse
import json
import os
import sys
from typing import Any, Dict, Iterable

import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE = "https://api.printify.com/v1"


def print_error(message: str) -> None:
    print(f"⚠️  {message}")


def get_headers() -> Dict[str, str]:
    token = os.getenv("PRINTIFY_API_TOKEN")
    if not token:
        print_error("PRINTIFY_API_TOKEN is not set in the environment")
        sys.exit(1)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def fetch_json(path: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
    url = f"{API_BASE}{path}"
    resp = requests.get(url, headers=get_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def list_blueprints(limit: int) -> None:
    page = 1
    while True:
        payload = fetch_json("/catalog/blueprints.json", params={"limit": limit, "page": page})
        
        # Handle different response structures
        if isinstance(payload, list):
            items = payload
        else:
            items = payload.get("data", []) or payload.get("blueprints") or payload.get("catalog") or []
        
        if not items:
            print("No more blueprints")
            break

        for blueprint in items:
            print(f"Blueprint {blueprint.get('id')} → {blueprint.get('title')} ({blueprint.get('category')})")
        
        # Handle pagination for different response structures
        if isinstance(payload, dict) and payload.get("next_page"):
            page += 1
        else:
            break


def list_providers() -> None:
    payload = fetch_json("/print_providers.json")
    providers = payload.get("data", []) or payload.get("providers", [])
    for provider in providers:
        print(f"Provider {provider.get('id')} → {provider.get('title')} ({provider.get('country')})")


def describe_blueprint(blueprint_id: int) -> None:
    payload = fetch_json(f"/catalog/blueprints/{blueprint_id}.json")
    blueprint = payload.get("data") or payload
    print(json.dumps(blueprint, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lookup Printify blueprint and provider IDs")
    parser.add_argument("--list-blueprints", action="store_true", help="List blueprints from the Printify catalog")
    parser.add_argument("--list-providers", action="store_true", help="List Printify providers")
    parser.add_argument("--blueprint-id", type=int, help="Describe a specific blueprint")
    parser.add_argument("--limit", type=int, default=20, help="Number of blueprints to fetch at once")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not any([args.list_blueprints, args.list_providers, args.blueprint_id]):
        print_error("Specify --list-blueprints, --list-providers or --blueprint-id")
        sys.exit(1)
    if args.list_blueprints:
        list_blueprints(args.limit)
    if args.list_providers:
        list_providers()
    if args.blueprint_id:
        describe_blueprint(args.blueprint_id)


if __name__ == "__main__":
    main()

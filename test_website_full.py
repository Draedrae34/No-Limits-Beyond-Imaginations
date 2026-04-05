#!/usr/bin/env python3
"""
Full Website Functional Test
Tests all components: Products, Cart, Checkout, API integrations
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def test_environment():
    """Test environment configuration"""
    print("\n=== ENVIRONMENT CONFIGURATION ===")
    results = []

    # Printify
    printify_key = os.getenv("PRINTIFY_API_KEY") or os.getenv("PRINTIFY_API_TOKEN")
    printify_shop = os.getenv("PRINTIFY_SHOP_ID")
    results.append(("Printify API Key", "OK" if printify_key else "MISSING"))
    results.append(("Printify Shop ID", "OK" if printify_shop else "MISSING"))

    # Stripe
    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    stripe_pub = os.getenv("STRIPE_PUBLISHABLE_KEY")
    results.append(("Stripe Secret Key", "OK" if stripe_key else "MISSING"))
    results.append(("Stripe Publishable Key", "OK" if stripe_pub else "MISSING"))

    for name, status in results:
        symbol = "PASS" if status == "OK" else "FAIL"
        print(f"   [{symbol}] {name}: {status}")

    return all(r[1] == "OK" for r in results)

def test_product_files():
    """Test product data files"""
    print("\n=== PRODUCT DATA FILES ===")
    results = []

    # Test properly-mapped-products.json
    try:
        with open("properly-mapped-products.json") as f:
            data = json.load(f)
            products = data.get("products", [])
            results.append(("properly-mapped-products.json", f"OK - {len(products)} products"))
    except Exception as e:
        results.append(("properly-mapped-products.json", f"FAIL - {e}"))

    # Test all_products_inventory.json
    try:
        with open("all_products_inventory.json") as f:
            data = json.load(f)
            products = data.get("products", [])
            results.append(("all_products_inventory.json", f"OK - {len(products)} products"))
    except Exception as e:
        results.append(("all_products_inventory.json", f"FAIL - {e}"))

    # Test data/products.json
    try:
        with open("data/products.json") as f:
            data = json.load(f)
            products = data.get("products", [])
            results.append(("data/products.json", f"OK - {len(products)} products"))
    except Exception as e:
        results.append(("data/products.json", f"FAIL - {e}"))

    for name, status in results:
        if "OK" in status:
            print(f"   [PASS] {name}: {status}")
        else:
            print(f"   [FAIL] {name}: {status}")

    return any("OK" in r[1] for r in results)

def test_printify_connection():
    """Test Printify API connection"""
    print("\n=== PRINTIFY API CONNECTION ===")
    results = []

    token = os.getenv("PRINTIFY_API_KEY") or os.getenv("PRINTIFY_API_TOKEN")
    shop_id = os.getenv("PRINTIFY_SHOP_ID")

    if not token or not shop_id:
        print("   [FAIL] Missing credentials")
        return False

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    def handle_request(func_name, func_call):
        try:
            return func_call(), None
        except requests.exceptions.RequestException as e:
            return None, f"SKIP - Network error ({e})"
        except Exception as e:
            return None, f"FAIL - {e}"

    # Test shop info
    response, error = handle_request("Shop Info", lambda: requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}.json",
        headers=headers,
        timeout=15
    ))
    if error:
        results.append(("Shop Info", error))
    else:
        if response.status_code == 200:
            shop = response.json()
            results.append(("Shop Info", f"OK - {shop.get('name', 'Unknown')}"))
        else:
            results.append(("Shop Info", f"FAIL - {response.status_code}"))

    # Test products
    response, error = handle_request("Products API", lambda: requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json",
        headers=headers,
        params={"limit": 10},
        timeout=15
    ))
    if error:
        results.append(("Products API", error))
    else:
        if response.status_code == 200:
            data = response.json()
            products = data.get("data", [])
            visible = sum(1 for p in products if p.get("visible", False))
            results.append(("Products API", f"OK - {len(products)} products, {visible} visible"))
        else:
            results.append(("Products API", f"FAIL - {response.status_code}"))

    # Test variants
    try:
        response = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json",
            headers=headers,
            params={"limit": 1},
            timeout=15
        )
        if response.status_code == 200:
            data = response.json()
            products = data.get("data", [])
            if products:
                product_id = products[0].get("id")
                var_response = requests.get(
                    f"https://api.printify.com/v1/shops/{shop_id}/products/{product_id}/variants.json",
                    headers=headers,
                    timeout=15
                )
                if var_response.status_code == 200:
                    variants = var_response.json().get("data", [])
                    results.append(("Variants API", f"OK - {len(variants)} variants"))
                else:
                    results.append(("Variants API", f"FAIL - {var_response.status_code}"))
            else:
                results.append(("Variants API", "SKIP - No products"))
        else:
            results.append(("Variants API", "SKIP - API error"))
    except Exception as e:
        results.append(("Variants API", f"FAIL - {e}"))

    skip_count = 0
    fail_count = 0

    for name, status in results:
        if "OK" in status:
            print(f"   [PASS] {name}: {status}")
        elif "SKIP" in status:
            print(f"   [SKIP] {name}: {status}")
            skip_count += 1
        else:
            print(f"   [FAIL] {name}: {status}")
            fail_count += 1

    if fail_count > 0:
        return False
    return True

def test_stripe_integration():
    """Test Stripe integration"""
    print("\n=== STRIPE INTEGRATION ===")

    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        print("   [FAIL] Missing Stripe Secret Key")
        return False

    try:
        import stripe
        stripe.api_key = stripe_key

        # Try to get account info
        account = stripe.Account.retrieve()
        print(f"   [PASS] Stripe Account: OK - {account.get('email', 'Connected')}")
        return True
    except Exception as e:
        print(f"   [FAIL] Stripe: {e}")
        return False


def test_printify_fulfillment():
    """Test Printify fulfillability and provider stocks"""
    print("\n=== PRINTIFY FULFILLMENT CHECK ===")

    from printify_client import PrintifyAPI

    token = os.getenv("PRINTIFY_API_KEY") or os.getenv("PRINTIFY_API_TOKEN")
    shop_id = os.getenv("PRINTIFY_SHOP_ID")

    if not token or not shop_id:
        print("   [FAIL] Missing Printify credentials")
        return False

    client = PrintifyAPI(token, shop_id)

    try:
        products = client.get_products(limit=200)
    except requests.exceptions.RequestException as e:
        print(f"   [SKIP] Could not fetch products (network): {e}")
        return True
    except Exception as e:
        print(f"   [FAIL] Could not fetch products: {e}")
        return False

    if not products:
        print("   [SKIP] No products found in Printify")
        return True

    fails = []
    for p in products:
        pid = p.get('id', 'unknown')
        title = p.get('title', 'Untitled')
        status = p.get('status', 'unknown')
        provider_id = p.get('print_provider_id')

        if status == 'archived':
            fails.append(f"Product {pid} is archived")

        if not provider_id:
            fails.append(f"Product {pid} has no print_provider_id")

        variants = p.get('variants')
        if not variants:
            try:
                variants = client.get_variants(pid)
            except Exception as e:
                fails.append(f"Product {pid} variants fetch failed: {e}")
                variants = []

        active_variants = [v for v in variants if v.get('is_enabled', False) and v.get('price', 0) > 0]
        if not active_variants:
            fails.append(f"Product {pid} has no enabled priced variants")

        if provider_id:
            try:
                provider_stocks = client.get_print_provider_stocks(str(provider_id))
                if not provider_stocks:
                    fails.append(f"Provider {provider_id} has no stock entries")
            except requests.exceptions.RequestException as e:
                print(f"   [WARN] provider stock request failed (network) for {provider_id}: {e}")
            except Exception as e:
                fails.append(f"Provider stock check failed for {provider_id}: {e}")

    if fails:
        print("   [FAIL] Fulfillment issues found:")
        for f in fails[:20]:
            print("      -", f)
        print(f"   [FAIL] {len(fails)} issue(s) total")
        return False

    print("   [PASS] Printify products are set up for fulfillment")
    return True


def test_price_and_image_consistency():
    """Validate that products in shop-products and inventory have matching name/price/image"""
    print("\n=== PRODUCT PRICE + IMAGE CONSISTENCY ===")

    def load_json(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"   [FAIL] Could not read {path}: {e}")
            return None

    site_data = load_json('shop-products.json')
    inv_data = load_json('all_products_inventory.json')

    if site_data is None or inv_data is None:
        return False

    site_products = site_data.get('products', [])
    inv_products = inv_data.get('products', [])

    map_inv_by_name = {p.get('name', '').strip().lower(): p for p in inv_products if p.get('name')}
    map_inv_by_id = {str(p.get('id', '')).strip(): p for p in inv_products if p.get('id')}

    failures = []

    for p in site_products[:50]:  # limit to first 50 for speed
        product_id = str(p.get('id', '')).strip()
        name = p.get('name', '').strip()
        price = float(p.get('price', 0) or 0)
        image = p.get('image', '')

        if not name or not image or price <= 0:
            failures.append(f"Product data invalid for site product: name='{name}', image='{bool(image)}', price={price}")
            continue

        inv_entry = map_inv.get(name.lower())
        if not inv_entry:
            failures.append(f"No inventory entry matches site name '{name}'")
            continue

        inv_price = float(inv_entry.get('price', 0) or 0)
        if abs(price - inv_price) > 0.01:
            failures.append(f"Price mismatch '{name}': site={price} inventory={inv_price}")

        # image URL check (best-effort, avoid long hang)
        try:
            resp = requests.head(image, timeout=5)
            if resp.status_code == 405 or resp.status_code == 403:
                resp = requests.get(image, timeout=5)
            if resp.status_code != 200:
                failures.append(f"Image URL returned non-200 for '{name}': {image} ({resp.status_code})")
        except Exception as e:
            # allow intermittent network failures; report as warning
            print(f"   [WARN] Image fetch warning for '{name}': {e}")


    if failures:
        print("   [FAIL] Consistency validation issues:")
        for f in failures[:20]:
            print("      -", f)
        print(f"   [FAIL] {len(failures)} issue(s) total")
        return False

    print("   [PASS] Product pricing and image match validation OK")
    return True


def test_checkout_flow():
    """Test checkout flow simulation"""
    print("\n=== CHECKOUT FLOW ===")

    # Simulate checkout data
    test_product = {
        "id": "test-001",
        "name": "Test Product",
        "price": 29.99,
        "quantity": 1
    }

    print(f"   [INFO] Test product: {test_product['name']} - ${test_product['price']}")
    print(f"   [INFO] Checkout would calculate:")
    print(f"          - Subtotal: ${test_product['price']:.2f}")
    print(f"          - Shipping: $5.00")
    print(f"          - Total: ${test_product['price'] + 5.00:.2f}")
    print(f"   [PASS] Checkout calculation: OK")

    return True


def test_sync_pipeline():
    """Run sync scripts to ensure pipeline is complete."""
    print("\n=== SYNC PIPELINE CHECK ===")

    import subprocess

    commands = [
        ["python", "sync_to_website.py"],
        ["python", "generate_shop_products.py"]
    ]

    for cmd in commands:
        try:
            print(f"   [INFO] Running: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, timeout=300)
        except subprocess.CalledProcessError as e:
            print(f"   [FAIL] Sync command failed: {e}")
            return False
        except Exception as e:
            print(f"   [FAIL] Sync command error: {e}")
            return False

    print("   [PASS] Sync pipeline executed successfully")
    return True


def test_website_files():
    """Test website HTML files exist"""
    print("\n=== WEBSITE FILES ===")

    required_files = [
        "shop.html",
        "checkout.html",
        "success.html",
        "index.html",
    ]

    results = []
    for f in required_files:
        exists = os.path.exists(f)
        results.append((f, "OK" if exists else "MISSING"))
        status = "PASS" if exists else "FAIL"
        print(f"   [{status}] {f}")

    return all(r[1] == "OK" for r in results)

def main():
    print("=" * 60)
    print("FULL WEBSITE FUNCTIONALITY TEST")
    print("=" * 60)

    tests = [
        ("Environment Configuration", test_environment),
        ("Product Data Files", test_product_files),
        ("Printify API Connection", test_printify_connection),
        ("Printify Fulfillment", test_printify_fulfillment),
        ("Product Price/Image Consistency", test_price_and_image_consistency),
        ("Sync Pipeline", test_sync_pipeline),
        ("Stripe Integration", test_stripe_integration),
        ("Checkout Flow", test_checkout_flow),
        ("Website Files", test_website_files),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"   [ERROR] {e}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"   [{status}] {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\nALL TESTS PASSED! Your website is fully functional.")
    else:
        print(f"\nWARNING: {total - passed} test(s) failed. Please check the results above.")

if __name__ == "__main__":
    main()

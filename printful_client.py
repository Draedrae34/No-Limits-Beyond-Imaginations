import requests
import json
from typing import Optional, Dict, List, Any

class PrintfulAPI:
    """
    Python client for Printful API v2.
    """

    BASE_URL = "https://api.printful.com"

    def __init__(self, api_token: str, store_id: Optional[str] = None):
        """
        Initialize the API client.

        :param api_token: Your Printful API token (store-level or account-level)
        :param store_id: Store ID if using account-level token
        """
        self.api_token = api_token
        self.store_id = store_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        })
        if self.store_id:
            self.session.headers["X-PF-Store-Id"] = self.store_id

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a GET request to the API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def _post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a POST request to the API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()

    def _patch(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a PATCH request to the API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.patch(url, json=data)
        response.raise_for_status()
        return response.json()

    def _delete(self, endpoint: str) -> None:
        """Make a DELETE request to the API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.delete(url)
        response.raise_for_status()

    # OAuth Scopes
    def get_oauth_scopes(self) -> Dict[str, Any]:
        """Retrieve OAuth scopes."""
        return self._get("/v2/oauth-scopes")

    # Catalog
    def get_products(self, **params) -> Dict[str, Any]:
        """Retrieve a list of catalog products."""
        return self._get("/v2/catalog-products", params=params)

    def get_product(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve a single catalog product."""
        return self._get(f"/v2/catalog-products/{product_id}", params=params)

    def get_product_variants(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog product variants."""
        return self._get(f"/v2/catalog-products/{product_id}/catalog-variants", params=params)

    def get_variant(self, variant_id: int, **params) -> Dict[str, Any]:
        """Retrieve information about specific catalog variant."""
        return self._get(f"/v2/catalog-variants/{variant_id}", params=params)

    def get_categories(self) -> Dict[str, Any]:
        """Retrieve a list of catalog categories."""
        return self._get("/v2/catalog-categories")

    def get_category(self, category_id: int) -> Dict[str, Any]:
        """Retrieve information about specific category."""
        return self._get(f"/v2/catalog-categories/{category_id}")

    def get_product_size_guide(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve size guide for a catalog product."""
        return self._get(f"/v2/catalog-products/{product_id}/sizes", params=params)

    def get_product_prices(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog product prices."""
        return self._get(f"/v2/catalog-products/{product_id}/prices", params=params)

    def get_variant_prices(self, variant_id: int, **params) -> Dict[str, Any]:
        """Retrieve pricing information for the catalog variant."""
        return self._get(f"/v2/catalog-variants/{variant_id}/prices", params=params)

    def get_product_images(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve blank images for a catalog product."""
        return self._get(f"/v2/catalog-products/{product_id}/images", params=params)

    def get_variant_images(self, variant_id: int, **params) -> Dict[str, Any]:
        """Retrieve blank images for a catalog variant."""
        return self._get(f"/v2/catalog-variants/{variant_id}/images", params=params)

    def get_mockup_styles(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog product mockup styles."""
        return self._get(f"/v2/catalog-products/{product_id}/mockup-styles", params=params)

    def get_mockup_templates(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog product mockup templates."""
        return self._get(f"/v2/catalog-products/{product_id}/mockup-templates", params=params)

    def get_product_availability(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog product stock availability."""
        return self._get(f"/v2/catalog-products/{product_id}/availability", params=params)

    def get_variant_availability(self, variant_id: int, **params) -> Dict[str, Any]:
        """Retrieve catalog variant stock availability."""
        return self._get(f"/v2/catalog-variants/{variant_id}/availability", params=params)

    def get_product_stock(self, product_id: int, **params) -> Dict[str, Any]:
        """Retrieve stock information for a catalog product."""
        return self._get(f"/v2/catalog-products/{product_id}/availability", params=params)

    # Orders
    def get_orders(self, **params) -> Dict[str, Any]:
        """Retrieve a list of orders."""
        return self._get("/v2/orders", params=params)

    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order."""
        return self._post("/v2/orders", order_data)

    def get_order(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve a single order."""
        return self._get(f"/v2/orders/{order_id}", params=params)

    def get_order_status(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve the status of a specific order."""
        return self._get(f"/v2/orders/{order_id}", params=params)

    def update_order(self, order_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an order."""
        return self._patch(f"/v2/orders/{order_id}", order_data)

    def delete_order(self, order_id: str) -> None:
        """Delete an order."""
        self._delete(f"/v2/orders/{order_id}")

    def confirm_order(self, order_id: str) -> Dict[str, Any]:
        """Confirm an order."""
        return self._post(f"/v2/orders/{order_id}/confirmation")

    def get_order_items(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve a list of order items."""
        return self._get(f"/v2/orders/{order_id}/order-items", params=params)

    def create_order_item(self, order_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order item."""
        return self._post(f"/v2/orders/{order_id}/order-items", item_data)

    def get_order_item(self, order_id: str, item_id: str, **params) -> Dict[str, Any]:
        """Retrieve a single order item."""
        return self._get(f"/v2/orders/{order_id}/order-items/{item_id}", params=params)

    def update_order_item(self, order_id: str, item_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an order item."""
        return self._patch(f"/v2/orders/{order_id}/order-items/{item_id}", item_data)

    def delete_order_item(self, order_id: str, item_id: str) -> None:
        """Delete an order item."""
        self._delete(f"/v2/orders/{order_id}/order-items/{item_id}")

    def get_shipments(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve a list of shipments."""
        return self._get(f"/v2/orders/{order_id}/shipments", params=params)

    def get_fulfillment_status(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve fulfillment status for an order."""
        return self._get(f"/v2/orders/{order_id}/shipments", params=params)

    def get_order_invoice(self, order_id: str, **params) -> Dict[str, Any]:
        """Retrieve an invoice."""
        return self._get(f"/v2/orders/{order_id}/invoices", params=params)

    def create_order_estimation_task(self, estimation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order estimation task."""
        return self._post("/v2/order-estimation-tasks", estimation_data)

    def get_order_estimation_task(self, task_id: str, **params) -> Dict[str, Any]:
        """Retrieve an order estimation task."""
        return self._get(f"/v2/order-estimation-tasks?id={task_id}", params=params)

    # Files
    def add_file(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new file."""
        return self._post("/v2/files", file_data)

    def upload_custom_design(self, design_data: Dict[str, Any]) -> Dict[str, Any]:
        """Upload a custom design file."""
        return self._post("/v2/files", design_data)

    def get_file(self, file_id: int) -> Dict[str, Any]:
        """Retrieve a single file."""
        return self._get(f"/v2/files/{file_id}")

    # Countries
    def get_countries(self, **params) -> Dict[str, Any]:
        """Retrieve a list of countries."""
        return self._get("/v2/countries", params=params)

    # Shipping Rates
    def calculate_shipping_rates(self, shipping_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Shipping Rates."""
        return self._post("/v2/shipping-rates", shipping_data)

    # Warehouse Products
    def get_warehouse_products(self, **params) -> Dict[str, Any]:
        """Retrieve a list of warehouse products."""
        return self._get("/v2/warehouse-products", params=params)

    def get_warehouse_product(self, warehouse_product_id: int, **params) -> Dict[str, Any]:
        """Retrieve a single warehouse product."""
        return self._get(f"/v2/warehouse-products/{warehouse_product_id}", params=params)

    # Mockup Generator
    def create_mockup_tasks(self, mockup_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Mockup Generator tasks."""
        return self._post("/v2/mockup-tasks", mockup_data)

    def create_custom_mockup(self, mockup_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a custom mockup task."""
        return self._post("/v2/mockup-tasks", mockup_data)

    def get_mockup_tasks(self, **params) -> Dict[str, Any]:
        """Retrieve Mockup Generator tasks."""
        return self._get("/v2/mockup-tasks", params=params)

    # Webhooks
    def get_webhooks(self, **params) -> Dict[str, Any]:
        """Get webhook configuration."""
        return self._get("/v2/webhooks", params=params)

    def create_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Set up webhook configuration."""
        return self._post("/v2/webhooks", webhook_data)

    def update_stock_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update webhook for stock changes."""
        return self._post("/v2/webhooks", webhook_data)

    def delete_webhooks(self) -> None:
        """Disable webhook support."""
        self._delete("/v2/webhooks")

    def get_webhook_event(self, event_type: str, **params) -> Dict[str, Any]:
        """Get event configuration."""
        return self._get(f"/v2/webhooks/{event_type}", params=params)

    def create_webhook_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Set up event configuration."""
        return self._post(f"/v2/webhooks/{event_type}", event_data)

    def delete_webhook_event(self, event_type: str) -> None:
        """Disable support for event."""
        self._delete(f"/v2/webhooks/{event_type}")

    # Stores
    def get_stores(self) -> Dict[str, Any]:
        """Retrieves a list of stores."""
        return self._get("/v2/stores")

    def get_store(self, store_id: int) -> Dict[str, Any]:
        """Retrieve a single store."""
        return self._get(f"/v2/stores/{store_id}")

    def get_store_statistics(self, store_id: int, **params) -> Dict[str, Any]:
        """Retrieve statistics for a single store."""
        return self._get(f"/v2/stores/{store_id}/statistics", params=params)

    # Approval Sheets
    def get_approval_sheets(self, **params) -> Dict[str, Any]:
        """Retrieve a list of approval sheets."""
        return self._get("/v2/approval-sheets", params=params)
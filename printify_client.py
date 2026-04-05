import requests
import json
from typing import Optional, Dict, List, Any

class PrintifyAPI:
    """
    Python client for Printify API.
    Official Printify REST API: https://developers.printify.com/docs/
    """

    BASE_URL = "https://api.printify.com/v1"

    def __init__(self, api_token: str, shop_id: Optional[str] = None):
        """
        Initialize the Printify API client.

        :param api_token: Your Printify API token (Bearer token required)
        :param shop_id: Your Printify Shop ID
        """
        self.api_token = api_token
        self.shop_id = shop_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        })

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a GET request to the Printify API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def _post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a POST request to the Printify API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()

    def _patch(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a PATCH request to the Printify API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.patch(url, json=data)
        response.raise_for_status()
        return response.json()

    def _delete(self, endpoint: str) -> None:
        """Make a DELETE request to the Printify API."""
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.delete(url)
        response.raise_for_status()

    # ====== SHOP ENDPOINTS ======
    def get_shop(self, shop_id: str) -> Dict[str, Any]:
        """Get shop details."""
        return self._get(f"/shops/{shop_id}")

    def list_shops(self) -> List[Dict[str, Any]]:
        """List all shops connected to this Printify account."""
        response = self._get("/shops.json")
        return response

    # ====== PRODUCT ENDPOINTS ======
    def get_products(self, limit: int = 100, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all products for the shop.

        :param limit: Number of products to return per page (max 100)
        :param status: Filter by status ('draft', 'active', 'archived')
        :return: List of product dictionaries
        """
        if not self.shop_id:
            raise ValueError("shop_id is required for getting products")

        # Printify API limits to 50 per page
        params = {"limit": min(limit, 50)}
        if status:
            params["status"] = status

        response = self._get(f"/shops/{self.shop_id}/products.json", params=params)
        return response.get("data", [])

    def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get a specific product by ID."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._get(f"/shops/{self.shop_id}/products/{product_id}.json")

    def create_product(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new product."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._post(f"/shops/{self.shop_id}/products.json", data)

    def update_product(self, product_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a product."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._patch(f"/shops/{self.shop_id}/products/{product_id}.json", data)

    def delete_product(self, product_id: str) -> None:
        """Delete a product."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        self._delete(f"/shops/{self.shop_id}/products/{product_id}.json")

    # ====== VARIANT ENDPOINTS ======
    def get_variants(self, product_id: str) -> List[Dict[str, Any]]:
        """Get variants for a product."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        response = self._get(f"/shops/{self.shop_id}/products/{product_id}/variants.json")
        return response.get("data", [])

    def get_variant(self, product_id: str, variant_id: str) -> Dict[str, Any]:
        """Get a specific variant."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._get(f"/shops/{self.shop_id}/products/{product_id}/variants/{variant_id}.json")

    def update_variant(self, product_id: str, variant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a variant (e.g., price, MOQ)."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._patch(
            f"/shops/{self.shop_id}/products/{product_id}/variants/{variant_id}",
            data
        )

    # ====== ORDERS ENDPOINTS ======
    def get_orders(self, limit: int = 100, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get orders.

        :param limit: Number of orders to return
        :param status: Filter by status ('draft', 'pending', 'confirmed', 'failed', 'canceled', 'fulfilled')
        """
        if not self.shop_id:
            raise ValueError("shop_id is required")

        params = {"limit": limit}
        if status:
            params["status"] = status

        response = self._get(f"/shops/{self.shop_id}/orders", params=params)
        return response.get("data", [])

    def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get a specific order."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._get(f"/shops/{self.shop_id}/orders/{order_id}")

    def create_order(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an order.

        Required fields in data:
        - line_items: list of {product_id, variant_ids, quantity}
        - address_to: {first_name, last_name, email, phone, address1, city, country_code, zip}
        """
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._post(f"/shops/{self.shop_id}/orders", data)

    def send_to_production(self, order_id: str) -> Dict[str, Any]:
        """Send an order to production."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        return self._post(f"/shops/{self.shop_id}/orders/{order_id}/send-to-production", {})

    def cancel_order(self, order_id: str) -> None:
        """Cancel an order."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        self._delete(f"/shops/{self.shop_id}/orders/{order_id}")

    # ====== PRINTJOB ENDPOINTS ======
    def get_print_jobs(self, order_id: str) -> List[Dict[str, Any]]:
        """Get print jobs for an order."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        response = self._get(f"/shops/{self.shop_id}/orders/{order_id}/print_jobs")
        return response.get("data", [])

    # ====== CATALOG ENDPOINTS (For custom products) ======
    def list_collections(self) -> List[Dict[str, Any]]:
        """List available product collections."""
        response = self._get("/catalog/collections")
        return response.get("data", [])

    def list_products_in_collection(self, collection_id: str) -> List[Dict[str, Any]]:
        """List products in a collection."""
        response = self._get(f"/catalog/collections/{collection_id}/products")
        return response.get("data", [])

    def get_catalog_product(self, product_id: str) -> Dict[str, Any]:
        """Get catalog product details."""
        return self._get(f"/catalog/products/{product_id}")

    def get_catalog_product_variants(self, product_id: str) -> List[Dict[str, Any]]:
        """Get variants for a catalog product."""
        response = self._get(f"/catalog/products/{product_id}/variants")
        return response.get("data", [])

    # ====== STOCKS ENDPOINTS ======
    def get_print_provider_stocks(self, provider_id: str) -> List[Dict[str, Any]]:
        """Get available stock from a print provider."""
        response = self._get(f"/catalog/print_providers/{provider_id}/stocks")
        return response.get("data", [])

    # ====== UPLOADS ENDPOINTS ======
    def upload_image(self, file_path: str, file_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload an image file.

        :param file_path: Path to the image file
        :param file_name: Optional custom file name
        """
        import base64

        # Read and encode the image as base64
        with open(file_path, "rb") as f:
            contents = base64.b64encode(f.read()).decode('utf-8')

        # Prepare payload
        payload = {
            "file_name": file_name or file_path.split("/")[-1].split("\\")[-1],
            "contents": contents
        }

        url = f"{self.BASE_URL}/uploads/images.json"
        response = self.session.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    def upload_custom_design(self, design_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stub to mimic Printful's custom design API.

        Printify expects image uploads using `upload_image` followed by attaching
        the upload to a product/variant. This helper exists so the backend route
        can call something without crashing; users should implement the full
        workflow if they require it.
        """
        raise NotImplementedError("Custom design upload must be implemented for Printify (upload via `upload_image` then attach to product)")

    # ====== WEBHOOKS ENDPOINTS ======
    def create_webhook(self, topic: str, url: str) -> Dict[str, Any]:
        """
        Create a webhook.

        :param topic: Event topic (e.g., 'order.created', 'order.updated')
        :param url: Webhook URL to receive events
        """
        if not self.shop_id:
            raise ValueError("shop_id is required")

        data = {
            "topic": topic,
            "address": url
        }
        return self._post(f"/shops/{self.shop_id}/webhooks", data)

    def list_webhooks(self) -> List[Dict[str, Any]]:
        """List all webhooks for the shop."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        response = self._get(f"/shops/{self.shop_id}/webhooks")
        return response.get("data", [])

    def delete_webhook(self, webhook_id: str) -> None:
        """Delete a webhook."""
        if not self.shop_id:
            raise ValueError("shop_id is required")
        self._delete(f"/shops/{self.shop_id}/webhooks/{webhook_id}")

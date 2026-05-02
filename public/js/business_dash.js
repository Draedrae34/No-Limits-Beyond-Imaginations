// Business Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const revenueEl = document.getElementById('revenue');
    const productsCountEl = document.getElementById('products-count');
    const ordersCountEl = document.getElementById('orders-count');
    const productsList = document.getElementById('products-list');
    const ordersList = document.getElementById('orders-list');
    const addProductBtn = document.getElementById('add-product');

    function loadMetrics() {
        fetch('/api/business/metrics')
            .then(response => response.json())
            .then(data => {
                revenueEl.textContent = `$${data.revenue}`;
                productsCountEl.textContent = data.products;
                ordersCountEl.textContent = data.orders;
            })
            .catch(error => console.error('Error loading metrics:', error));
    }

    function loadProducts() {
        fetch('/api/business/products')
            .then(response => response.json())
            .then(data => {
                productsList.innerHTML = '';
                data.products.forEach(product => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <strong>${product.name || 'Unnamed Product'}</strong><br>
                        <small>${product.description || 'No description'}</small>
                    `;
                    productsList.appendChild(div);
                });
            })
            .catch(error => console.error('Error loading products:', error));
    }

    function loadOrders() {
        fetch('/api/business/orders')
            .then(response => response.json())
            .then(data => {
                ordersList.innerHTML = '';
                data.orders.forEach(order => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <strong>Order #${order.id || 'N/A'}</strong><br>
                        <small>Status: ${order.status || 'Unknown'}</small>
                    `;
                    ordersList.appendChild(div);
                });
            })
            .catch(error => console.error('Error loading orders:', error));
    }

    addProductBtn.addEventListener('click', function() {
        const productName = prompt('Enter product name:');
        if (productName) {
            const productData = {
                name: productName,
                description: 'New product',
                price: 0
            };

            fetch('/api/business/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadProducts();
                    loadMetrics();
                } else {
                    alert('Failed to add product');
                }
            })
            .catch(error => console.error('Error adding product:', error));
        }
    });

    // Load initial data
    loadMetrics();
    loadProducts();
    loadOrders();
});
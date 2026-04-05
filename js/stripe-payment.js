// Stripe Payment Integration for Printify Orders
class StripePaymentProcessor {
    constructor() {
        // Initialize Stripe with your publishable key
        this.stripe = Stripe('pk_live_51St8KxGbrgLPuQFwopxDC9rr1o2hYJujJ7ceGP9RgxafShwb5zlt1i96vN9jAcktWLdAsvanJdivugVGWrT1UdlJ00cLbBlzuF'); // Using actual key from .env
        this.elements = this.stripe.elements();
    }

    createPaymentForm() {
        return `
            <div id="stripe-payment-form" style="display: none;">
                <div class="payment-container">
                    <h3>Complete Your Purchase</h3>
                    <div class="product-summary" id="product-summary"></div>
                    
                    <div class="card-element">
                        <label>Card Information</label>
                        <div id="card-element"></div>
                        <div id="card-errors" role="alert"></div>
                    </div>
                    
                    <div class="billing-info">
                        <label>Email</label>
                        <input type="email" id="customer-email" placeholder="your@email.com" required>
                        
                        <label>Full Name</label>
                        <input type="text" id="customer-name" placeholder="John Doe" required>
                        
                        <div class="address-row">
                            <div class="address-field">
                                <label>Address</label>
                                <input type="text" id="address-line1" placeholder="123 Main St" required>
                            </div>
                            <div class="address-field">
                                <label>City</label>
                                <input type="text" id="city" placeholder="New York" required>
                            </div>
                        </div>
                        
                        <div class="address-row">
                            <div class="address-field">
                                <label>State</label>
                                <input type="text" id="state" placeholder="NY" required>
                            </div>
                            <div class="address-field">
                                <label>ZIP Code</label>
                                <input type="text" id="zip" placeholder="10001" required>
                            </div>
                        </div>
                    </div>
                    
                    <button id="submit-payment" class="pay-btn">
                        <span class="btn-text">Pay Now</span>
                        <span class="btn-loading" style="display: none;">Processing...</span>
                    </button>
                </div>
            </div>
        `;
    }

    async initializeStripeElements() {
        // Create card element
        const cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
            },
        });

        cardElement.mount('#card-element');

        // Handle real-time validation errors
        cardElement.on('change', ({error}) => {
            const displayError = document.getElementById('card-errors');
            if (error) {
                displayError.textContent = error.message;
            } else {
                displayError.textContent = '';
            }
        });
    }

    async handlePayment(blueprintId, price) {
        const submitButton = document.getElementById('submit-payment');
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoading = submitButton.querySelector('.btn-loading');

        // Show loading state
        submitButton.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            // Create payment method
            const {error, paymentMethod} = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.elements.getElement('card'),
                billing_details: {
                    email: document.getElementById('customer-email').value,
                    name: document.getElementById('customer-name').value,
                    address: {
                        line1: document.getElementById('address-line1').value,
                        city: document.getElementById('city').value,
                        state: document.getElementById('state').value,
                        postal_code: document.getElementById('zip').value,
                        country: 'US',
                    },
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            // Create payment intent (you'll need a backend endpoint for this)
            const response = await fetch('/api/stripe-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: blueprintId,
                    quantity: 1,
                    amount: Math.round(price * 100), // Convert to cents
                    customer_info: {
                        email: document.getElementById('customer-email').value,
                        name: document.getElementById('customer-name').value,
                        address: {
                            line1: document.getElementById('address-line1').value,
                            city: document.getElementById('city').value,
                            state: document.getElementById('state').value,
                            zip: document.getElementById('zip').value,
                        }
                    }
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create payment intent');
            }

            const client_secret = result.client_secret;

            // Confirm payment
            const {error: confirmError} = await this.stripe.confirmCardPayment(client_secret, {
                payment_method: paymentMethod.id,
            });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            // Payment successful - create Printify order
            await this.createPrintifyOrder(blueprintId, paymentMethod.id);

        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
        } finally {
            // Reset button state
            submitButton.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    async createPrintifyOrder(blueprintId, paymentMethodId) {
        try {
            const orderData = {
                blueprint_id: blueprintId,
                quantity: 1,
                address: {
                    first_name: document.getElementById('customer-name').value.split(' ')[0],
                    last_name: document.getElementById('customer-name').value.split(' ').slice(1).join(' '),
                    address1: document.getElementById('address-line1').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    zip: document.getElementById('zip').value,
                    country: 'US',
                    email: document.getElementById('customer-email').value,
                },
                payment_method_id: paymentMethodId,
            };

            const response = await fetch('/api/create-printify-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (result.success) {
                // Success - redirect to confirmation
                window.location.href = 'success.html?order_id=' + result.order_id;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Printify order error:', error);
            alert('Order creation failed: ' + error.message);
        }
    }

    showPaymentModal(blueprintId, price) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'payment-modal-overlay';
        modal.innerHTML = `
            <div class="payment-modal">
                <div class="payment-header">
                    <h3>Complete Purchase</h3>
                    <button class="close-btn" onclick="this.closest('.payment-modal-overlay').remove()">×</button>
                </div>
                <div class="payment-content">
                    <div class="product-info">
                        <h4 id="modal-product-name">Product</h4>
                        <p class="price" id="modal-product-price">$0.00</p>
                    </div>
                    ${this.createPaymentForm()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize Stripe elements
        setTimeout(() => {
            // Set product info
            const product = printifyShop.products.find(p => p.id === blueprintId);
            if (product) {
                document.getElementById('modal-product-name').textContent = product.name;
                document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;
            }
            
            this.initializeStripeElements();
            
            // Set up payment handler
            document.getElementById('submit-payment').onclick = () => {
                this.handlePayment(blueprintId, price);
            };
        }, 100);
    }
}

// Initialize Stripe processor
const stripeProcessor = new StripePaymentProcessor();

// Update buy buttons to use Stripe
document.addEventListener('DOMContentLoaded', () => {
    // Override existing buy buttons
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const productId = parseInt(button.dataset.productId);
            const product = printifyShop.products.find(p => p.id === productId);
            if (product) {
                stripeProcessor.showPaymentModal(product.id, product.price, product.name);
            }
        };
    });
});

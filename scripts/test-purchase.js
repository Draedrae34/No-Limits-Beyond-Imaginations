#!/usr/bin/env node
const { fetch } = globalThis;

if (!fetch) {
    throw new Error('Global fetch is required (Node 18+).');
}

const args = process.argv.slice(2);
const urlFlagIndex = args.findIndex((arg) => arg === '--url');
const siteUrl =
    (urlFlagIndex >= 0 && args[urlFlagIndex + 1]) ||
    process.env.SITE_URL ||
    'http://localhost:3000';

const payload = {
    items: [
        {
            name: 'No Limits Test Tee',
            price: 29.99,
            quantity: 1,
            metadata: {
                printfulVariantId: 4011,
                productId: 'test-tee',
            },
        },
    ],
    customerEmail: process.env.TEST_CUSTOMER_EMAIL || 'test@nolimits.com',
    metadata: {
        note: 'Automated test order',
        testRun: 'true',
    },
};

async function run() {
    const endpoint = new URL('/api/checkout', siteUrl).toString();
    console.log('Creating checkout session via', endpoint);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Checkout creation failed:', errorText);
        process.exit(1);
    }

    const data = await response.json();
    console.log('Checkout session created!');
    console.log('Session ID:', data.sessionId || data?.id);
    console.log('Checkout URL:', data.url);
    console.log(
        'Use Stripe CLI to trigger the webhook or complete the session from the URL to finish the test purchase.',
    );
}

run().catch((err) => {
    console.error('Test purchase script failed:', err);
    process.exit(1);
});

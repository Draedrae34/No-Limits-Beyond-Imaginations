/**
 * Printful API Integration - Vercel Serverless Function
 * Handles product sync, order submission, and fulfillment tracking
 */

const https = require('https');

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';
const PRINTFUL_API_BASE = 'api.printful.com';
const STORE_ID = process.env.PRINTFUL_STORE_ID || '';

function printfulRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    if (!PRINTFUL_API_KEY) {
      return reject(new Error('Printful API key not configured'));
    }

    const options = {
      hostname: PRINTFUL_API_BASE,
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Basic ${Buffer.from(PRINTFUL_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || 'Printful API error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'products':
        const products = await printfulRequest('/store/products');
        return res.status(200).json({ success: true, data: products });

      case 'product':
        const { id } = req.query;
        const product = await printfulRequest(`/store/products/${id}`);
        return res.status(200).json({ success: true, data: product });

      case 'create-order':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const order = await printfulRequest('/orders', 'POST', req.body);
        return res.status(200).json({ success: true, data: order });

      case 'orders':
        const orders = await printfulRequest('/orders');
        return res.status(200).json({ success: true, data: orders });

      case 'shipping-rates':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const rates = await printfulRequest('/shipping/rates', 'POST', req.body);
        return res.status(200).json({ success: true, data: rates });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('[Printful API] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

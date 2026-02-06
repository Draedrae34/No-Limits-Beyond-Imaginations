const store = require('../lib/owner-samples-store');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const samples = await store.readSamples();
            return res.status(200).json({ success: true, data: samples });
        }

        if (req.method === 'POST') {
            const { product, quantity, shippingUrgency, desiredDate, notes } = req.body;

            if (!product || !quantity) {
                return res.status(400).json({ error: 'Product and quantity are required' });
            }

            const newSample = {
                id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                product: product.trim(),
                quantity: Number(quantity),
                shippingUrgency: shippingUrgency || 'Standard',
                desiredDate: desiredDate || null,
                notes: notes || '',
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const saved = await store.addSample(newSample);
            return res.status(201).json({ success: true, data: saved });
        }

        if (req.method === 'PATCH') {
            const { id, status, trackingUrl } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Sample id is required' });
            }

            const updates = {};
            if (status) updates.status = status;
            if (trackingUrl) updates.trackingUrl = trackingUrl;

            const updated = await store.updateSample(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Sample not found' });
            }

            return res.status(200).json({ success: true, data: updated });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[Owner Samples API]', error);
        return res.status(500).json({ error: error.message });
    }
}

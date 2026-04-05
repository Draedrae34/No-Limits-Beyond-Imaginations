#!/usr/bin/env node
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

function loadEnvFile() {
    const env = {};
    try {
        const content = fsSync.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...rest] = trimmed.split('=');
            if (!key) return;
            env[key.trim()] = rest.join('=').trim();
        });
    } catch (error) {
        // ignore missing .env
    }
    return env;
}
const https = require('https');

const ENV_FILE = path.join(__dirname, '../.env');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const BLUEPRINT_CONFIG_FILE = path.join(__dirname, '../data/printify-blueprints.json');
const MAPPING_FILE = path.join(__dirname, '../data/printify-products.json');
const ENV_VARS = loadEnvFile();
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID || ENV_VARS.PRINTIFY_SHOP_ID || '';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN || process.env.PRINTIFY_TOKEN || ENV_VARS.PRINTIFY_API_TOKEN || '';
const API_HOST = 'api.printify.com';

if (!PRINTIFY_SHOP_ID || !PRINTIFY_TOKEN) {
    console.error('\n⚠️  PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID must be set.');
    process.exit(1);
}

async function printifyRequest(endpoint, method = 'GET', body = null) {
    const payload = body ? JSON.stringify(body) : null;

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: API_HOST,
                path: endpoint,
                method,
                headers: {
                    Authorization: `Bearer ${PRINTIFY_TOKEN}`,
                    'Content-Type': 'application/json;charset=utf-8',
                    ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
                }
            },
            (res) => {
                let collected = '';
                res.on('data', chunk => (collected += chunk));
                res.on('end', () => {
                    if (!collected) {
                        return res.statusCode && res.statusCode >= 400
                            ? reject(new Error(`Printify error ${res.statusCode}`))
                            : resolve({});
                    }

                    try {
                        const parsed = JSON.parse(collected);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            const message = parsed?.message || parsed?.error || `Printify error ${res.statusCode}`;
                            reject(new Error(message));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

async function uploadImage(sourcePath) {
    const contents = await fs.readFile(sourcePath);
    const payload = {
        file_name: path.basename(sourcePath),
        contents: contents.toString('base64')
    };
    const response = await printifyRequest('/v1/uploads/images.json', 'POST', payload);
    return response;
}

async function loadBlueprint(blueprintId) {
    const response = await printifyRequest(`/v1/catalog/blueprints/${blueprintId}.json`);
    return response;
}

async function main() {
    const [productsJson, blueprintConfigJson, existingMapping] = await Promise.all([
        fs.readFile(PRODUCTS_FILE, 'utf-8'),
        fs.readFile(BLUEPRINT_CONFIG_FILE, 'utf-8'),
        fs.readFile(MAPPING_FILE, 'utf-8').catch(() => null)
    ]);

    const products = JSON.parse(productsJson)?.items || [];
    const blueprintConfig = JSON.parse(blueprintConfigJson);
    const mapping = existingMapping ? JSON.parse(existingMapping) : {};

    const blueprintCache = new Map();

    async function getBlueprint(id) {
        if (!id) return null;
        if (blueprintCache.has(id)) return blueprintCache.get(id);
        const blueprint = await loadBlueprint(id);
        blueprintCache.set(id, blueprint);
        return blueprint;
    }

    for (const product of products) {
        const sourceKey = `${product.folder}/${product.filename}`;
        if (mapping[sourceKey]?.printifyProductId) {
            console.log(`✅ ${sourceKey} already linked to Printify product ${mapping[sourceKey].printifyProductId}`);
            continue;
        }

        const categoryConfig = blueprintConfig.categories?.[product.category] || blueprintConfig.default;
        if (!categoryConfig || !categoryConfig.blueprint_id || !categoryConfig.print_provider_id) {
            console.log(`⚠️  Skipping ${sourceKey} (missing blueprint or provider configuration)`);
            continue;
        }

        const blueprint = await getBlueprint(categoryConfig.blueprint_id);
        if (!blueprint) {
            console.log(`⚠️  Blueprint ${categoryConfig.blueprint_id} not found for ${sourceKey}`);
            continue;
        }

        const variantIds = categoryConfig.variant_ids && categoryConfig.variant_ids.length
            ? categoryConfig.variant_ids
            : (blueprint.variants || []).map(v => v.id).filter(Boolean);

        if (!variantIds.length) {
            console.log(`⚠️  No variants returned for blueprint ${categoryConfig.blueprint_id}.`);
            continue;
        }

        const placeholderPositions = new Set();
        (blueprint.variants || []).forEach((variant) => {
            (variant.placeholders || []).forEach(p => placeholderPositions.add(p.position));
        });

        if (!placeholderPositions.size) {
            console.log(`⚠️  Blueprint ${categoryConfig.blueprint_id} does not expose placeholders, skipping ${sourceKey}`);
            continue;
        }

        const sourceImage = path.join(__dirname, '../', product.image);
        let uploadResponse;
        try {
            uploadResponse = await uploadImage(sourceImage);
        } catch (error) {
            console.error(`❌ Failed to upload ${sourceImage}:`, error.message);
            continue;
        }

        const placeholders = Array.from(placeholderPositions).map(position => ({
            position,
            images: [{
                id: uploadResponse.id,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0
            }]
        }));

        const priceMultiplier = categoryConfig.price_multiplier || 1;
        const priceCents = Math.round((product.price || categoryConfig.default_price || 49.99) * priceMultiplier * 100);
        const tags = [...new Set([product.category, ...(categoryConfig.tags || [])].map(t => t?.toString()?.toLowerCase()))];

        const productPayload = {
            blueprint_id: categoryConfig.blueprint_id,
            print_provider_id: categoryConfig.print_provider_id,
            title: product.name,
            description: categoryConfig.description || product.desc || 'Part of the No Limits Beyond Limitations collection.',
            tags,
            variants: variantIds.map(id => ({
                id,
                price: priceCents
            })),
            print_areas: [
                {
                    variant_ids: variantIds,
                    placeholders
                }
            ]
        };

        if (categoryConfig.visibility === false) {
            productPayload.visible = false;
        }

        try {
            const created = await printifyRequest(`/v1/shops/${PRINTIFY_SHOP_ID}/products.json`, 'POST', productPayload);
            mapping[sourceKey] = {
                sourceProductId: product.id,
                printifyProductId: created.id,
                blueprintId: created.blueprint_id,
                variants: (created.variants || []).map(v => v.id),
                imageId: uploadResponse.id,
                createdAt: created.created_at || new Date().toISOString()
            };
            await fs.writeFile(MAPPING_FILE, JSON.stringify(mapping, null, 2));
            console.log(`🎉 Uploaded ${sourceKey} → Printify product ${created.id}`);
        } catch (error) {
            console.error(`❌ Failed to create Printify product for ${sourceKey}:`, error.message);
        }
    }
}

main().catch(error => {
    console.error('❌ Publish to Printify failed:', error.stack || error.message);
    process.exit(1);
});

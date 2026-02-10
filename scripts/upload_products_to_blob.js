const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');

function contentTypeFor(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

async function listFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listFiles(abs)));
        } else if (entry.isFile()) {
            files.push(abs);
        }
    }
    return files;
}

async function uploadFile({ absPath, key }) {
    const body = await fs.readFile(absPath);
    const result = await put(key, body, {
        access: 'public',
        contentType: contentTypeFor(absPath),
        addRandomSuffix: false,
    });
    return result.url;
}

function titleFromPath(relativePath) {
    const base = path.basename(relativePath, path.extname(relativePath));
    return base
        .replace(/[\-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function inferProductType(text) {
    const t = String(text || '').toLowerCase();
    if (/(hoodie|hooded)/.test(t)) return 'hoodie';
    if (/(sweatshirt|crewneck|pullover)/.test(t)) return 'sweatshirt';
    if (/(t\s*shirt|tee)/.test(t)) return 'tshirt';
    if (/(tank)/.test(t)) return 'tank';
    if (/(jogger|pants|sweatpants)/.test(t)) return 'pants';
    if (/(shorts)/.test(t)) return 'shorts';
    if (/(hat|cap|snapback)/.test(t)) return 'hat';
    if (/(beanie)/.test(t)) return 'beanie';
    if (/(tote|bag)/.test(t)) return 'bag';
    return 'custom';
}

function pricingRules(type) {
    // Option C defaults (edit these numbers if you want different pricing)
    switch (type) {
        case 'hoodie':
            return { category: 'hoodies', price: 69.99 };
        case 'sweatshirt':
            return { category: 'hoodies', price: 59.99 };
        case 'tshirt':
            return { category: 't-shirts', price: 34.99 };
        case 'tank':
            return { category: 't-shirts', price: 32.99 };
        case 'pants':
            return { category: 'bottoms', price: 64.99 };
        case 'shorts':
            return { category: 'bottoms', price: 49.99 };
        case 'hat':
            return { category: 'accessories', price: 29.99 };
        case 'beanie':
            return { category: 'accessories', price: 29.99 };
        case 'bag':
            return { category: 'accessories', price: 24.99 };
        case 'socks':
            return { category: 'accessories', price: 19.99 };
        case 'shoes':
            return { category: 'footwear', price: 89.99 };
        case 'boots':
            return { category: 'footwear', price: 129.99 };
        case 'lingerie':
            return { category: 'intimates', price: 49.99 };
        case 'bra':
            return { category: 'intimates', price: 44.99 };
        case 'baby':
            return { category: 'baby', price: 29.99 };
        case 'backpack':
            return { category: 'accessories', price: 54.99 };
        default:
            return { category: 'custom', price: 0 };
    }
}

async function readJsonIfExists(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function run() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('Missing BLOB_READ_WRITE_TOKEN. Export it in your terminal before running.');
        process.exit(1);
    }

    const root = process.cwd();
    const productsDir = path.join(root, 'Clothing_Product');
    const outOwner = path.join(root, 'data', 'products_owner.json');
    const outPublic = path.join(root, 'data', 'products.json');

    const existingOwner = await readJsonIfExists(outOwner);
    const existingItems = Array.isArray(existingOwner?.items) ? existingOwner.items : [];
    const existingByLocalPath = new Map(
        existingItems
            .filter((i) => i?.source?.localPath)
            .map((i) => [i.source.localPath, i]),
    );

    const files = (await listFiles(productsDir)).filter((abs) => {
        const ext = path.extname(abs).toLowerCase();
        return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });

    files.sort((a, b) => {
        const ra = path.relative(productsDir, a);
        const rb = path.relative(productsDir, b);
        return ra.localeCompare(rb);
    });

    console.log(`Uploading ${files.length} product images to Vercel Blob...`);

    const items = [];
    let id = 1;

    for (const abs of files) {
        const rel = path.relative(productsDir, abs).split(path.sep).join('/');
        const folder = rel.split('/')[0] || 'products';
        const fileName = path.basename(rel);

        const key = `products/${folder}/${fileName}`;
        const url = await uploadFile({ absPath: abs, key });

        const localPath = `Clothing_Product/${rel}`;
        const existing = existingByLocalPath.get(localPath);
        const inferredType = inferProductType(`${folder} ${fileName}`);
        const finalType = (existing?.type && String(existing.type).trim()) || inferredType;
        const rule = pricingRules(finalType);

        const merged = {
            id,
            sku: existing?.sku || `custom-${String(id).padStart(4, '0')}`,
            type: finalType,
            name: existing?.name || titleFromPath(rel),
            desc: typeof existing?.desc === 'string' ? existing.desc : '',
            category: existing?.category || rule.category,
            price:
                typeof existing?.price === 'number' && existing.price > 0
                    ? existing.price
                    : rule.price,
            currency: existing?.currency || 'USD',
            imageUrl: url,
            printfulVariantId:
                typeof existing?.printfulVariantId === 'number'
                    ? existing.printfulVariantId
                    : null,
            status: existing?.status || 'draft',
            source: {
                folder,
                file: fileName,
                localPath,
            },
        };

        items.push(merged);

        id += 1;
        process.stdout.write('.');
    }

    process.stdout.write('\n');

    await fs.mkdir(path.dirname(outOwner), { recursive: true });
    await fs.writeFile(outOwner, JSON.stringify({ items }, null, 2));

    const publicItems = items
        .filter((p) => p.status === 'active' && typeof p.price === 'number' && p.price > 0)
        .map(({ status, source, ...rest }) => rest);

    await fs.writeFile(outPublic, JSON.stringify({ items: publicItems }, null, 2));

    console.log(`→ wrote ${path.relative(root, outOwner)} with ${items.length} items (owner catalog)`);
    console.log(`→ wrote ${path.relative(root, outPublic)} with ${publicItems.length} items (customer catalog)`);
    console.log('Next: edit data/products_owner.json (set name/desc/price/printfulVariantId/status), then re-run this script to regenerate public catalog.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

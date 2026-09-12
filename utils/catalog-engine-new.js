// utils/catalog-engine.js
// Pulls the full Printify blueprint catalog, composites your logos onto galaxy
// textures with sharp, uploads the artwork, and creates products in your shop.
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  getBlueprints,
  getPrintProviders,
  getVariants,
  createPrintifyProduct,
  uploadImage,
  publishProduct,
} from './printify.js';
import { loadLogos } from './logo-loader.js';

const ASSET_DIR = path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space');

// ---------------------------------------------------------------------------
// Blueprint selection
// ---------------------------------------------------------------------------
const APPAREL_INCLUDE = /t-shirt|tee|hoodie|sweatshirt|tank|leggings|dress|jogger|polo|long sleeve|sweater|hawaiian shirt/i;
const APPAREL_EXCLUDE = /sticker|mug|tumbler|bottle|flask|blanket|plush|bear|toy|poster|canvas|case|embroidery|pet|stuffed|bib|sock|cap\b|hat\b/i;
const AOP_MATCH = /\(AOP\)/i;

const DEFAULT_OPTIONS = {
  aopBlueprints: 40,      // all-over-print garments — your specialty
  regularBlueprints: 20,  // standard DTG tees/hoodies
  logosLimit: null,       // null = every logo in the manifest
  maxProducts: null,      // hard cap on created products (null = unlimited)
  publish: false,         // publish each created product
  dryRun: false,          // don't create anything, just report the plan
  aopPriceCents: 5999,    // retail price for AOP garments (cents)
  regularPriceCents: 3499,// retail price for standard garments (cents)
};

export async function selectBlueprints(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const res = await getBlueprints();
  // blueprints.json returns EITHER { data: [...] } OR an object keyed by index
  const raw = res.data || res || {};
  const all = Array.isArray(raw) ? raw : Object.values(raw);
  const aop = all.filter(b => AOP_MATCH.test(b.title) && !APPAREL_EXCLUDE.test(b.title));
  const regular = all.filter(b => !AOP_MATCH.test(b.title) && APPAREL_INCLUDE.test(b.title) && !APPAREL_EXCLUDE.test(b.title));
  return {
    aop: aop.slice(0, opts.aopBlueprints),
    regular: regular.slice(0, opts.regularBlueprints),
    totalAvailable: { aop: aop.length, regular: regular.length, all: all.length },
  };
}

// ---------------------------------------------------------------------------
// Image compositing — galaxy fill + logo, sized per print type
// ---------------------------------------------------------------------------
const AOP_CANVAS = { w: 4500, h: 5400 };        // typical AOP full-print area
const STANDARD_CANVAS = { w: 3000, h: 4000 };   // typical DTG front print area

function findGalaxyTextures() {
  return fs.readdirSync(ASSET_DIR)
    .filter(f => /\.(png|jpe?g)$/i.test(f))
    .filter(f => !/logo|no.?limits|memorial|greetings|editor|illustration|texture_for/i.test(f))
    .map(f => path.join(ASSET_DIR, f));
}

function pickGalaxyTexture(seedStr, textures) {
  const hash = crypto.createHash('md5').update(seedStr).digest();
  return textures[hash[0] % textures.length];
}

// Compose artwork: galaxy texture as full canvas background, logo layered on top.
// For AOP front: big centered logo; for AOP back: texture only (pure galaxy fill).
async function composeArtwork({ logoPath, texturePath, canvas, logoScale = 0.45, textureOnly = false }) {
  const base = sharp(texturePath).resize(canvas.w, canvas.h, { fit: 'cover' });
  if (textureOnly || !logoPath) return base.png({ quality: 90 }).toBuffer();

  const logoMeta = await sharp(logoPath).metadata();
  const targetW = Math.round(canvas.w * logoScale);
  const targetH = Math.round((logoMeta.height / logoMeta.width) * targetW);
  const logoBuf = await sharp(logoPath)
    .resize(targetW, targetH, { fit: 'inside' })
    .png()
    .toBuffer();

  return base.composite([{
    input: logoBuf,
    left: Math.round((canvas.w - targetW) / 2),
    top: Math.round((canvas.h - targetH) / 2),
  }]).png({ quality: 90 }).toBuffer();
}

// ---------------------------------------------------------------------------
// Upload cache — avoid re-uploading the same artwork for every variant
// ---------------------------------------------------------------------------
const uploadCache = new Map();

async function uploadArtwork(key, buffer, fileName) {
  if (uploadCache.has(key)) return uploadCache.get(key);
  const uploaded = await uploadImage(buffer.toString('base64'), fileName, fileName.replace(/\.[^.]+$/, ''));
  uploadCache.set(key, uploaded);
  return uploaded;
}
// ---------------------------------------------------------------------------
// Product payload builder
// ---------------------------------------------------------------------------
function classifyProduct(blueprint) {
  const title = (blueprint.title || '').toLowerCase();
  if (AOP_MATCH.test(title)) return { type: 'aop', basePrice: 5200 };
  if (title.includes('hoodie')) return { type: 'hoodie', basePrice: 5200 };
  if (title.includes('sweatshirt') || title.includes('crewneck')) return { type: 'sweatshirt', basePrice: 4500 };
  if (title.includes('leggings')) return { type: 'leggings', basePrice: 4400 };
  if (title.includes('dress')) return { type: 'dress', basePrice: 4800 };
  if (title.includes('jogger')) return { type: 'joggers', basePrice: 4600 };
  if (title.includes('tank')) return { type: 'tank', basePrice: 3200 };
  if (title.includes('polo')) return { type: 'polo', basePrice: 3800 };
  return { type: 'tee', basePrice: 3400 };
}

function buildPrintifyPayload({ blueprint, provider, variants, logo, frontArt, backArt, isAOP, retailPriceCents }) {
  const { type } = classifyProduct(blueprint);
  const title = `${logo} ${isAOP ? 'All-Over Print' : 'Graphic'} ${blueprint.title}`;
  const description = `No Limits. Beyond Limitations. ${logo} galaxy artwork on ${blueprint.title}. Silent Spirits Legacy collection.`;
  const tags = ['No Limits', 'Galaxy', 'Silent Spirits Legacy', 'Cosmic', type];

  const enabledVariants = variants.filter(v => v.is_enabled !== false && v.is_available !== false && Array.isArray(v.placeholders) && v.placeholders.length);
  const variantIds = enabledVariants.map(v => v.id);
  if (!variantIds.length) throw new Error('No printable variants available');

  // Discover placeholder positions actually offered by this blueprint/provider.
  const positions = [...new Set(enabledVariants.flatMap(v => v.placeholders.map(p => p.position)))];
  // AOP garments (left_side/right_side etc.): fill every panel with galaxy.
  const isPanelPrint = positions.some(p => !/^(front|back)$/i.test(p));

  const printAreas = [];
  for (const position of positions) {
    // Front-facing panel gets logo over galaxy; every other panel gets pure galaxy fill.
    const isPrimary = /^front$/i.test(position) || (isPanelPrint && position === positions[0]);
    const art = isPrimary ? frontArt : (isAOP || isPanelPrint ? backArt : null);
    if (!art) continue;
    printAreas.push({
      variant_ids: variantIds,
      placeholders: [{ position, images: [{ id: art.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
    });
  }
  if (!printAreas.length) throw new Error('No print areas could be built');

  return {
    title,
    description,
    blueprint_id: blueprint.id,
    print_provider_id: provider.id,
    variants: enabledVariants.map(v => ({ id: v.id, price: retailPriceCents, is_enabled: true })),
    print_areas: printAreas,
    tags,
    visible: true,
    is_locked: false,
  };
}// ---------------------------------------------------------------------------
// Main generator: iterate blueprints × logos, compose, upload, create
// ---------------------------------------------------------------------------
export async function generateFullCatalog(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const logos = loadLogos();
  const selectedLogos = opts.logosLimit ? logos.slice(0, opts.logosLimit) : logos;
  const textures = findGalaxyTextures();

  if (!logos.length) throw new Error('No logos loaded — check the logo manifest');
  if (!textures.length) throw new Error('No galaxy textures found in Logo_N_Galaxy_Fill_Space');

  const { aop, regular } = await selectBlueprints(opts);
  const allBlueprints = [...aop, ...regular];

  const summary = {
    logos: selectedLogos.length,
    textures: textures.length,
    aopBlueprints: aop.length,
    regularBlueprints: regular.length,
    plannedProducts: 0,
    created: [],
    skipped: [],
    dryRun: opts.dryRun,
  };

  let createdCount = 0;

  for (const blueprint of allBlueprints) {
    if (opts.maxProducts && createdCount >= opts.maxProducts) break;
    const isAOP = AOP_MATCH.test(blueprint.title);
    const canvas = isAOP ? AOP_CANVAS : STANDARD_CANVAS;

    let providers;
    try {
      const provRes = await getPrintProviders(blueprint.id);
      providers = provRes.data || provRes || [];
    } catch (e) {
      summary.skipped.push({ blueprint: blueprint.title, reason: `providers: ${e.message}` });
      continue;
    }
    if (!providers.length) continue;
    const provider = providers[0]; // prefer the first (usually largest/cheapest)
    for (const logo of selectedLogos) {
      if (opts.maxProducts && createdCount >= opts.maxProducts) break;
      const variantsRes = await getVariants(blueprint.id, provider.id);
      const variantList = variantsRes.variants || variantsRes.data || variantsRes || [];
      if (!variantList.length) continue;

      summary.plannedProducts++;

      const texturePath = pickGalaxyTexture(`${blueprint.id}:${logo.name}`, textures);

      if (opts.dryRun) {
        summary.created.push({ title: `${logo.name} ${isAOP ? 'AOP' : ''} ${blueprint.title}`, blueprint: blueprint.title, type: classifyProduct(blueprint).type });
        continue;
      }

      try {
        // Front = logo over galaxy; Back = galaxy only (AOP)
        const frontBuf = await composeArtwork({ logoPath: logo.file, texturePath, canvas, logoScale: isAOP ? 0.6 : 0.5 });
        const front = await uploadArtwork(`${logo.name}:${texturePath}:front`, frontBuf, `front-${logo.name}.png`);

        let back = null;
        if (isAOP) {
          const backBuf = await composeArtwork({ logoPath: null, texturePath, canvas, textureOnly: true });
          back = await uploadArtwork(`${texturePath}:back`, backBuf, `back-${path.basename(texturePath)}`);
        }

        const payload = buildPrintifyPayload({
          blueprint, provider, variants: variantList, logo: logo.name,
          frontArt: front, backArt: back, isAOP,
          retailPriceCents: isAOP ? opts.aopPriceCents : opts.regularPriceCents,
        });
        const created = await createPrintifyProduct(payload);
        createdCount++;

        if (opts.publish) {
          try { await publishProduct(created.id); } catch (e) { console.warn('publish failed for', created.id, e.message); }
        }

        summary.created.push({ id: created.id, title: payload.title, blueprint: blueprint.title, type: classifyProduct(blueprint).type });
      } catch (e) {
        summary.skipped.push({ blueprint: blueprint.title, reason: e.message });
      }
    }
  }

  summary.createdCount = createdCount;
  return summary;
}
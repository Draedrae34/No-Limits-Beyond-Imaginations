// utils/catalog-engine.js
import {
  getBlueprints,
  getPrintProviders,
  getVariants,
  createPrintifyProduct,
} from './printify.js';
import { loadLogos } from './logo-loader.js';

const MAX_BLUEPRINTS = 10; // keep this sane at first

function classifyProduct(blueprint) {
  const title = (blueprint.title || '').toLowerCase();

  if (title.includes('hoodie')) return { type: 'hoodie', basePrice: 6500 };
  if (title.includes('sweatshirt')) return { type: 'sweatshirt', basePrice: 5500 };
  if (title.includes('t-shirt') || title.includes('tee')) return { type: 'tee', basePrice: 3000 };
  if (title.includes('jogger') || title.includes('pants')) return { type: 'joggers', basePrice: 4800 };
  if (title.includes('hat') || title.includes('cap')) return { type: 'hat', basePrice: 2800 };
  if (title.includes('poster') || title.includes('canvas')) return { type: 'poster', basePrice: 2500 };
  if (title.includes('sticker')) return { type: 'sticker', basePrice: 1800 };
  if (title.includes('tumbler') || title.includes('mug')) return { type: 'tumbler', basePrice: 3000 };
  if (title.includes('backpack')) return { type: 'backpack', basePrice: 5500 };
  if (title.includes('phone case')) return { type: 'phone_case', basePrice: 3000 };

  return { type: 'other', basePrice: 3500 };
}

function buildPrintifyProductPayload({ blueprint, provider, variants, logo }) {
  const { type, basePrice } = classifyProduct(blueprint);

  const title = `${logo.name} – ${blueprint.title}`;
  const description = [
    'No Limits Beyond Limitations',
    'Silent Spirits Legacy Collection',
    blueprint.title,
    logo.name,
  ].join(' • ');

  const tags = [
    'No Limits',
    'Galaxy',
    'Memorial',
    'Silent Spirits Legacy',
    type,
  ];

  return {
    title,
    description,
    blueprint_id: blueprint.id,
    print_provider_id: provider.id,
    variants: variants.map(v => ({
      id: v.id,
      price: v.price || basePrice,
      is_enabled: true,
    })),
    print_areas: [
      {
        variant_ids: variants.map(v => v.id),
        placeholders: [
          {
            position: 'front',
            images: [
              {
                src: logo.publicUrl,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
    tags,
    visible: true,
    is_locked: false,
  };
}

export async function generateFullCatalogWithLogos() {
  const logos = loadLogos();
  const blueprints = await getBlueprints();

  const selectedBlueprints = blueprints.slice(0, MAX_BLUEPRINTS);

  const createdProducts = [];

  for (const blueprint of selectedBlueprints) {
    const providers = await getPrintProviders(blueprint.id);

    for (const provider of providers) {
      const variants = await getVariants(blueprint.id, provider.id);

      for (const logo of logos) {
        const payload = buildPrintifyProductPayload({
          blueprint,
          provider,
          variants,
          logo,
        });

        const created = await createPrintifyProduct(payload);
        createdProducts.push({
          printifyId: created.id,
          blueprintId: blueprint.id,
          providerId: provider.id,
          logoName: logo.name,
          title: payload.title,
          type: classifyProduct(blueprint).type,
        });
      }
    }
  }

  return createdProducts;
}

/* eslint-disable no-console */
const { createStrapi } = require('@strapi/strapi');
require('dotenv').config({ path: '/Users/ilalunin/Documents/Paritet-Cosmetics/apps/backend/.env' });

async function main() {
  const apply = process.argv.includes('--apply');
  const target = 41;

  const strapi = await createStrapi({ distDir: './dist' }).load();
  try {
    const products = await strapi.entityService.findMany('api::product.product', {
      fields: ['name', 'createdAt'],
      sort: { createdAt: 'asc' },
      publicationState: 'preview',
      limit: 5000,
    });

    const total = products.length;
    const keep = products.slice(0, target);
    const remove = products.slice(target);

    console.log(`Total products: ${total}`);
    console.log(`Keep: ${keep.length}`);
    console.log(`Remove: ${remove.length}`);

    if (remove.length) {
      console.log('\nProducts to remove:');
      for (const p of remove) {
        console.log(`${p.id}\t${p.createdAt}\t${p.name}`);
      }
    }

    if (!apply) {
      console.log('\nDry-run only. Re-run with --apply to delete.');
      return;
    }

    let deleted = 0;
    for (const p of remove) {
      await strapi.entityService.delete('api::product.product', p.id);
      deleted++;
    }

    const after = await strapi.entityService.findMany('api::product.product', {
      fields: ['name'],
      publicationState: 'preview',
      limit: 5000,
    });

    console.log(`\nDeleted: ${deleted}`);
    console.log(`Final count: ${after.length}`);
  } finally {
    await strapi.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { compileStrapi, createStrapi } = require("@strapi/strapi");
const sharp = require("sharp");

const DEFAULT_SOURCE_DIR = "/Users/ilalunin/Downloads/cart-20260316-1133";
const TARGET_COLLECTION_NAME = "Lifestyle";
const WORK_DIR = path.join(os.tmpdir(), "paritet-lifestyle-amenities-webp");
const EXT_RE = /\.(png|jpe?g|webp)$/i;

const cliArgs = new Set(process.argv.slice(2));
const DRY_RUN = !(cliArgs.has("--apply") || process.env.LIFESTYLE_IMPORT_DRY_RUN === "false");
const VERBOSE = cliArgs.has("--verbose");
const SOURCE_DIR = process.env.LIFESTYLE_SOURCE_DIR || DEFAULT_SOURCE_DIR;

const BRAND_MAP = {
  PHE: { name: "Pure Herbs" },
  TAR: { name: "Think, Act & Live Responsible" },
};

const PRODUCT_MAP = {
  BOL: { nameRu: "Молочко для тела" },
  BPS: { nameRu: "Пилинг для тела" },
  CON: { nameRu: "Кондиционер" },
  HBL: { nameRu: "Лосьон для рук и тела" },
  LQS: { nameRu: "Жидкое мыло" },
  MAO: { nameRu: "Массажное масло" },
  SHA: { nameRu: "Шампунь" },
  SHB: { nameRu: "Шампунь для волос и тела" },
  SHG: { nameRu: "Гель для душа" },
  SWC: { nameRu: "Шампунь и кондиционер в одном" },
};

const PACKAGE_MAP = {
  CT: { label: "Флакон", isDispenserSystem: false, sortOrder: 10 },
  CN: { label: "Флакон с помпой", isDispenserSystem: false, sortOrder: 20 },
  PW: { label: "Диспенсерная система", isDispenserSystem: true, sortOrder: 30 },
  SM: { label: "Туба", isDispenserSystem: false, sortOrder: 40 },
  SP: { label: "Флакон flip-top", isDispenserSystem: false, sortOrder: 50 },
};

function normalizeSpaces(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return normalizeSpaces(value).toLowerCase();
}

function toLatin(char) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const low = char.toLowerCase();
  const out = map[low];
  if (!out) return char;
  return char === low ? out : out.toUpperCase();
}

function slugify(value) {
  return normalizeSpaces(value)
    .split("")
    .map((char) => toLatin(char))
    .join("")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function unwrapEntity(entity) {
  if (!entity || typeof entity !== "object") return {};
  if (entity.attributes && typeof entity.attributes === "object") {
    return { id: entity.id, ...entity.attributes };
  }
  return entity;
}

function buildLookup(rows, keyFn) {
  const out = new Map();
  for (const row of rows) {
    const entity = unwrapEntity(row);
    const key = keyFn(entity);
    if (!key) continue;
    out.set(key, entity);
  }
  return out;
}

function relationRef(entity) {
  const row = unwrapEntity(entity);
  return row?.documentId || row?.id || null;
}

function hasExplicitSizeSuffix(name) {
  return /\b\d+(?:[.,]\d+)?\s*(мл|ml|г|гр|g|л|l)\s*$/i.test(normalizeSpaces(name));
}

function stripTrailingSize(name) {
  return normalizeSpaces(name).replace(/\s+\d+(?:[.,]\d+)?\s*(мл|ml|г|гр|g|л|l)\s*$/i, "").trim();
}

function stripBrandPrefix(name, brandName) {
  const full = normalizeSpaces(name);
  const brand = normalizeSpaces(brandName);
  if (!brand) return full;
  const fullKey = normalizeKey(full);
  const brandKey = normalizeKey(brand);
  if (!fullKey.startsWith(brandKey)) return full;
  return normalizeSpaces(full.slice(brand.length));
}

function parseFileName(fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  const parts = base.split("-").map(normalizeSpaces).filter(Boolean);
  if (parts.length < 6) return null;

  const brandCode = parts[1];
  const sku = parts[2];
  const shotToken = parts.find((part) => /^F\d+$/i.test(part)) || "F1";
  const extras = [];
  for (let index = 3; index < parts.length; index += 1) {
    const token = parts[index];
    if (/^F\d+$/i.test(token)) break;
    extras.push(token);
  }

  const brand = BRAND_MAP[brandCode];
  if (!brand) return null;

  const skuMatch = sku.match(/^(\d{3})([A-Z]{2})([A-Z]{3})$/);
  if (!skuMatch) return null;
  const [, volumeRaw, packageCode, productCode] = skuMatch;

  const product = PRODUCT_MAP[productCode];
  const packaging = PACKAGE_MAP[packageCode];
  if (!product || !packaging) return null;

  const volume = Number(volumeRaw);
  if (!Number.isFinite(volume) || volume <= 0) return null;

  return {
    fileName,
    sourcePath: path.join(SOURCE_DIR, fileName),
    brandCode,
    brandName: brand.name,
    productCode,
    productNameRu: product.nameRu,
    packageCode,
    packageLabel: packaging.label,
    isDispenserSystem: packaging.isDispenserSystem,
    packageSortOrder: packaging.sortOrder,
    volume,
    unit: "ml",
    shotToken: shotToken.toUpperCase(),
    extras,
  };
}

function imageScore(row) {
  let score = 0;
  if (row.shotToken === "F1") score += 5;
  if (row.shotToken === "F2") score += 3;
  if (row.shotToken === "F3") score += 2;
  if (row.extras.includes("RF")) score -= 5;
  if (/prodphoto/i.test(row.fileName)) score += 2;
  return score;
}

async function walkFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && EXT_RE.test(entry.name) && entry.name !== ".DS_Store")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function groupRows(rows) {
  const productMap = new Map();

  for (const row of rows) {
    const productKey = `${normalizeKey(row.brandName)}|${normalizeKey(row.productNameRu)}`;
    if (!productMap.has(productKey)) {
      productMap.set(productKey, {
        productKey,
        brandName: row.brandName,
        productNameRu: row.productNameRu,
        slug: slugify(`${row.brandName}-${row.productNameRu}`),
        variantsByKey: new Map(),
      });
    }

    const product = productMap.get(productKey);
    const variantKey = `${row.volume}|${row.unit}|${row.packageCode}`;
    if (!product.variantsByKey.has(variantKey)) {
      product.variantsByKey.set(variantKey, {
        volume: row.volume,
        unit: row.unit,
        packageCode: row.packageCode,
        packageLabel: row.packageLabel,
        isDispenserSystem: row.isDispenserSystem,
        packageSortOrder: row.packageSortOrder,
        candidates: [],
      });
    }
    product.variantsByKey.get(variantKey).candidates.push(row);
  }

  const products = [];
  for (const product of productMap.values()) {
    const variants = [];
    for (const variant of product.variantsByKey.values()) {
      const chosen = [...variant.candidates].sort((left, right) => imageScore(right) - imageScore(left))[0];
      variants.push({
        value: variant.volume,
        unit: variant.unit,
        packageLabel: variant.packageLabel,
        isDispenserSystem: variant.isDispenserSystem,
        packageCode: variant.packageCode,
        packageSortOrder: variant.packageSortOrder,
        sourcePath: chosen.sourcePath,
        sourceFileName: chosen.fileName,
      });
    }

    variants.sort((left, right) => {
      if (left.value !== right.value) return left.value - right.value;
      return left.packageSortOrder - right.packageSortOrder;
    });

    products.push({
      ...product,
      variants,
    });
  }

  products.sort((left, right) => left.brandName.localeCompare(right.brandName, "ru") || left.productNameRu.localeCompare(right.productNameRu, "ru"));
  return products;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function convertToWebp(inputPath) {
  const rel = path.relative(SOURCE_DIR, inputPath);
  const outRel = `${rel.replace(EXT_RE, "")}.webp`;
  const outPath = path.join(WORK_DIR, outRel);
  await ensureDir(path.dirname(outPath));
  await sharp(inputPath)
    .rotate()
    .webp({ quality: 82 })
    .toFile(outPath);
  return outPath;
}

function makeDescription(brandName, productNameRu) {
  return [
    {
      type: "paragraph",
      children: [{ type: "text", text: `${brandName} · ${productNameRu} · Lifestyle` }],
    },
  ];
}

function getRelationName(entityOrWrapper) {
  const entity = unwrapEntity(entityOrWrapper);
  return normalizeSpaces(entity?.name);
}

function getFileId(media) {
  if (!media) return null;
  if (Array.isArray(media)) return getFileId(media[0]);
  if (media.id) return Number(media.id) || null;
  if (media.data) return getFileId(media.data);
  if (media.attributes) return getFileId({ id: media.id, ...media.attributes });
  return null;
}

function getFileIds(media) {
  if (!media) return [];
  if (Array.isArray(media)) return media.map((item) => getFileId(item)).filter(Boolean);
  if (Array.isArray(media.data)) return media.data.map((item) => getFileId(item)).filter(Boolean);
  const single = getFileId(media);
  return single ? [single] : [];
}

function normalizeExistingVariant(variant) {
  const entity = unwrapEntity(variant);
  const value = Number(entity.value);
  const unit = normalizeSpaces(entity.unit || "");
  if (!Number.isFinite(value) || !unit) return null;
  return {
    value,
    unit,
    packageLabel: normalizeSpaces(entity.package_label || ""),
    isDispenserSystem: Boolean(entity.is_dispenser_system),
    productShotId: getFileId(entity.product_shots),
  };
}

function variantExactKey(variant) {
  return `${variant.value}|${normalizeSpaces(variant.unit)}|${normalizeKey(variant.packageLabel || "")}`;
}

function variantVolumeKey(variant) {
  return `${variant.value}|${normalizeSpaces(variant.unit)}`;
}

function isGenericExistingProduct(product, brandName) {
  const entity = unwrapEntity(product);
  const visibleName = stripBrandPrefix(entity.name || "", brandName);
  const variants = Array.isArray(entity.variants) ? entity.variants : [];
  if (variants.length > 0) return true;
  return !hasExplicitSizeSuffix(visibleName);
}

function productLookupKey(brandName, collectionName, productNameRu) {
  return `${normalizeKey(brandName)}|${normalizeKey(collectionName)}|${normalizeKey(productNameRu)}`;
}

async function createLocalStrapi() {
  const appContext = await compileStrapi();
  return createStrapi(appContext).load();
}

async function uploadWebp(strapi, filePath) {
  const stat = await fs.stat(filePath);
  const uploaded = await strapi.plugin("upload").service("upload").upload({
    data: {},
    files: {
      filepath: filePath,
      originalFilename: path.basename(filePath),
      mimetype: "image/webp",
      size: stat.size,
    },
  });

  if (!Array.isArray(uploaded) || !uploaded.length || !uploaded[0]?.id) {
    throw new Error(`Upload failed for ${filePath}`);
  }
  return uploaded[0];
}

async function main() {
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Mode: ${DRY_RUN ? "dry-run" : "apply"}`);
  await ensureDir(WORK_DIR);

  const fileNames = await walkFiles(SOURCE_DIR);
  const parsed = fileNames.map(parseFileName);
  const invalid = parsed.filter((row) => !row);
  const valid = parsed.filter(Boolean);
  const grouped = groupRows(valid);

  const variantsCount = grouped.reduce((sum, product) => sum + product.variants.length, 0);
  console.log(`Assets found: ${fileNames.length}`);
  console.log(`Assets parsed: ${valid.length}`);
  console.log(`Assets skipped: ${invalid.length}`);
  console.log(`Products grouped: ${grouped.length}`);
  console.log(`Variants grouped: ${variantsCount}`);

  if (VERBOSE) {
    for (const product of grouped) {
      console.log(`- ${product.brandName} / ${product.productNameRu}: ${product.variants.length} variants`);
      for (const variant of product.variants) {
        console.log(
          `  • ${variant.value}${variant.unit} / ${variant.packageLabel} / ${path.basename(variant.sourcePath)}`
        );
      }
    }
  }

  if (DRY_RUN) {
    console.log("Dry-run complete. Use --apply to write data into Strapi.");
    return;
  }

  const strapi = await createLocalStrapi();
  try {
    const [collections, brands, categories, products] = await Promise.all([
      strapi.entityService.findMany("api::collection.collection", { publicationState: "preview" }),
      strapi.entityService.findMany("api::brand.brand", { publicationState: "preview" }),
      strapi.entityService.findMany("api::category.category", { publicationState: "preview" }),
      strapi.entityService.findMany("api::product.product", {
        publicationState: "preview",
        populate: {
          brand: true,
          collection: true,
          categories: true,
          gallery: true,
          variants: { populate: ["product_shots"] },
        },
      }),
    ]);

    const collectionByName = buildLookup(collections, (item) => normalizeKey(item.name));
    const brandByName = buildLookup(brands, (item) => normalizeKey(item.name));
    const categoryByName = buildLookup(categories, (item) => normalizeKey(item.name));

    let lifestyleCollection = collectionByName.get(normalizeKey(TARGET_COLLECTION_NAME));
    if (!lifestyleCollection) {
      const created = await strapi.entityService.create("api::collection.collection", {
        data: { name: TARGET_COLLECTION_NAME },
      });
      lifestyleCollection = unwrapEntity(created);
      collectionByName.set(normalizeKey(lifestyleCollection.name), lifestyleCollection);
    }

    const existingProductByKey = new Map();
    for (const product of products.map(unwrapEntity)) {
      let brandName = getRelationName(product.brand);
      if (!brandName) {
        brandName = Object.values(BRAND_MAP)
          .map((item) => item.name)
          .find((candidate) => normalizeKey(product.name || "").startsWith(normalizeKey(candidate))) || "";
      }
      const collectionName = getRelationName(product.collection);
      if (!brandName || normalizeKey(collectionName) !== normalizeKey(TARGET_COLLECTION_NAME)) continue;
      if (!isGenericExistingProduct(product, brandName)) continue;

      const visibleName = stripBrandPrefix(product.name || "", brandName);
      const canonicalName = stripTrailingSize(visibleName);
      const key = productLookupKey(brandName, collectionName, canonicalName);
      const current = existingProductByKey.get(key);
      if (!current || (Array.isArray(product.variants) && product.variants.length > (current.variants || []).length)) {
        existingProductByKey.set(key, product);
      }
    }

    let createdBrands = 0;
    let createdCategories = 0;
    let createdProducts = 0;
    let updatedProducts = 0;
    let uploadedMedia = 0;

    for (const product of grouped) {
      let brand = brandByName.get(normalizeKey(product.brandName));
      if (!brand) {
        const created = await strapi.entityService.create("api::brand.brand", {
          data: {
            name: product.brandName,
            slug: slugify(product.brandName),
          },
        });
        brand = unwrapEntity(created);
        brandByName.set(normalizeKey(brand.name), brand);
        createdBrands += 1;
      }

      let category = categoryByName.get(normalizeKey(product.productNameRu));
      if (!category) {
        const created = await strapi.entityService.create("api::category.category", {
          data: {
            name: product.productNameRu,
            slug: slugify(product.productNameRu),
          },
        });
        category = unwrapEntity(created);
        categoryByName.set(normalizeKey(category.name), category);
        createdCategories += 1;
      }

      const lookupKey = productLookupKey(product.brandName, TARGET_COLLECTION_NAME, product.productNameRu);
      const existing = existingProductByKey.get(lookupKey) || null;
      const existingVariants = Array.isArray(existing?.variants)
        ? existing.variants.map(normalizeExistingVariant).filter(Boolean)
        : [];
      const importedExactKeys = new Set(product.variants.map((variant) => variantExactKey(variant)));
      const importedVolumeKeys = new Set(product.variants.map((variant) => variantVolumeKey(variant)));
      const importedVolumeCounts = new Map();
      for (const variant of product.variants) {
        const key = variantVolumeKey(variant);
        importedVolumeCounts.set(key, (importedVolumeCounts.get(key) || 0) + 1);
      }

      const preservedVariants = existingVariants.filter((variant) => {
        const exactKey = variantExactKey(variant);
        const volumeKey = variantVolumeKey(variant);
        if (importedExactKeys.has(exactKey)) return false;
        if (importedVolumeKeys.has(volumeKey) && !variant.packageLabel) return false;
        return true;
      });

      const exactExistingByKey = new Map(existingVariants.map((variant) => [variantExactKey(variant), variant]));
      const genericExistingByVolumeKey = new Map(
        existingVariants
          .filter((variant) => !variant.packageLabel && variant.productShotId)
          .map((variant) => [variantVolumeKey(variant), variant])
      );

      const importedPayloadVariants = [];
      for (const variant of product.variants) {
        const exactMatch = exactExistingByKey.get(variantExactKey(variant));
        const genericMatch = genericExistingByVolumeKey.get(variantVolumeKey(variant));

        let productShotId = exactMatch?.productShotId || null;
        if (!productShotId && genericMatch?.productShotId && importedVolumeCounts.get(variantVolumeKey(variant)) === 1) {
          productShotId = genericMatch.productShotId;
        }

        if (!productShotId) {
          const webpPath = await convertToWebp(variant.sourcePath);
          const uploaded = await uploadWebp(strapi, webpPath);
          productShotId = uploaded.id;
          uploadedMedia += 1;
        }

        importedPayloadVariants.push({
          value: variant.value,
          unit: variant.unit,
          package_label: variant.packageLabel,
          is_dispenser_system: variant.isDispenserSystem,
          product_shots: productShotId,
        });
      }

      const preservedPayloadVariants = preservedVariants.map((variant) => ({
        value: variant.value,
        unit: variant.unit,
        package_label: variant.packageLabel || null,
        is_dispenser_system: variant.isDispenserSystem,
        ...(variant.productShotId ? { product_shots: variant.productShotId } : {}),
      }));

      const galleryIds = Array.from(
        new Set([
          ...getFileIds(existing?.gallery),
          ...preservedVariants.map((variant) => variant.productShotId).filter(Boolean),
          ...importedPayloadVariants.map((variant) => variant.product_shots).filter(Boolean),
        ])
      );

      const payload = {
        name: existing?.name || `${product.brandName} ${product.productNameRu}`,
        slug: existing?.slug || product.slug,
        description: Array.isArray(existing?.description) && existing.description.length
          ? existing.description
          : makeDescription(product.brandName, product.productNameRu),
        is_active: true,
        brand: relationRef(brand),
        collection: relationRef(lifestyleCollection),
        categories: Array.from(
          new Set([
            ...(existing?.categories || []).map((item) => relationRef(item)).filter(Boolean),
            relationRef(category),
          ])
        ),
        variants: [...preservedPayloadVariants, ...importedPayloadVariants],
        gallery: galleryIds,
      };

      let productId;
      if (!existing) {
        const created = await strapi.entityService.create("api::product.product", {
          data: payload,
        });
        const createdProduct = unwrapEntity(created);
        productId = createdProduct.id;
        existingProductByKey.set(lookupKey, createdProduct);
        createdProducts += 1;
      } else {
        await strapi.entityService.update("api::product.product", existing.id, {
          data: payload,
        });
        productId = existing.id;
        updatedProducts += 1;
      }

      if (productId) {
        await strapi.entityService.update("api::product.product", productId, {
          data: {
            brand: relationRef(brand),
          },
        });
      }
    }

    console.log("Import completed:");
    console.log(`- brands created: ${createdBrands}`);
    console.log(`- categories created: ${createdCategories}`);
    console.log(`- products created: ${createdProducts}`);
    console.log(`- products updated: ${updatedProducts}`);
    console.log(`- uploaded images (webp): ${uploadedMedia}`);
  } finally {
    try {
      await strapi.destroy();
    } catch (error) {
      console.warn("Strapi shutdown warning:", error?.message || error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

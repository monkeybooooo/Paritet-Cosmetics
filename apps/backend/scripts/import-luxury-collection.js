const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { compileStrapi, createStrapi } = require("@strapi/strapi");
const sharp = require("sharp");

const DEFAULT_SOURCE_DIR = "/Users/ilalunin/Documents/Luxury Collection ";
const DEFAULT_SKIP_BRANDS = ["the-white-company-noir"];

const SOURCE_DIR = process.env.LUXURY_SOURCE_DIR || DEFAULT_SOURCE_DIR;
const SKIP_BRANDS = new Set(
    (process.env.LUXURY_SKIP_BRANDS || DEFAULT_SKIP_BRANDS.join(","))
        .split(",")
        .map((s) => normalizeKey(s))
        .filter(Boolean)
);

const cliArgs = new Set(process.argv.slice(2));
const DRY_RUN = !(cliArgs.has("--apply") || process.env.LUXURY_DRY_RUN === "false");
const VERBOSE = cliArgs.has("--verbose");
const WORK_DIR = path.join(os.tmpdir(), "paritet-luxury-webp");
const GLOBAL_COLLECTION_NAME = "Luxury";

const ITEM_NAME_FIXUPS = new Map([
    ["Гель для душ", "Гель для душа"],
    ["Шампунь и кондиционер в одно", "Шампунь и кондиционер в одном"],
    ["Шампунь и Кондиционер в одном", "Шампунь и кондиционер в одном"],
    ["Шампунь и кондиционер 2 в 1", "Шампунь и кондиционер в одном"],
    ["Молочко", "Молочко для тела"],
]);

const EXT_RE = /\.(png|jpe?g|webp)$/i;

function normalizeSpaces(v) {
    return String(v ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(v) {
    return normalizeSpaces(v).toLowerCase();
}

function normalizeBrandName(brandName) {
    return normalizeSpaces(brandName);
}

function normalizeBrandCollectionName(name) {
    const fixed = normalizeSpaces(name)
        .replace(/^коллеакция/i, "Коллекция")
        .replace(/^коллекция/i, "Коллекция");
    return fixed;
}

function normalizeItemName(name) {
    const clean = normalizeSpaces(name).replace(/[–—-]+$/g, "").trim();
    return ITEM_NAME_FIXUPS.get(clean) || clean;
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
        .map((ch) => toLatin(ch))
        .join("")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function inferDefaultUnit(itemName) {
    const key = normalizeKey(itemName);
    if (key.includes("мыло") || key.includes("soap") || key.includes("соль")) return "g";
    return "ml";
}

function normalizeUnit(rawUnit, itemName) {
    const unit = normalizeKey(rawUnit);
    if (unit === "ml" || unit === "мл") return "ml";
    if (unit === "l" || unit === "л" || unit.startsWith("литр")) return "l";
    if (unit === "g" || unit === "г" || unit === "гр" || unit === "грамм") return "g";
    return inferDefaultUnit(itemName);
}

function parseFromName(folderName) {
    const name = normalizeSpaces(folderName);

    const standard = name.match(/^(.*?)(?:\s| )*(\d+(?:[.,]\d+)?)\s*(мл|ml|л|l|г|гр|грамм|литр(?:а|ов)?|литра|литров)(?=\s|$)/i);
    if (standard) {
        const itemName = normalizeItemName(standard[1]);
        const volume = Number(standard[2].replace(",", "."));
        const unit = normalizeUnit(standard[3], itemName);
        return Number.isFinite(volume) && itemName ? { itemName, volume, unit } : null;
    }

    const noSpace = name.match(/^(.*?)(\d+(?:[.,]\d+)?)(мл|ml|л|l|г|гр|грамм|литр(?:а|ов)?|литра|литров)(?=\s|$)/i);
    if (noSpace) {
        const itemName = normalizeItemName(noSpace[1]);
        const volume = Number(noSpace[2].replace(",", "."));
        const unit = normalizeUnit(noSpace[3], itemName);
        return Number.isFinite(volume) && itemName ? { itemName, volume, unit } : null;
    }

    // "Гель для душа 300" -> assume ml
    const trailingNumber = name.match(/^(.*?)(?:\s| )+(\d+(?:[.,]\d+)?)$/);
    if (trailingNumber) {
        const itemName = normalizeItemName(trailingNumber[1]);
        const volume = Number(trailingNumber[2].replace(",", "."));
        const unit = inferDefaultUnit(itemName);
        return Number.isFinite(volume) && itemName ? { itemName, volume, unit } : null;
    }

    return null;
}

function parseVolumeFromFilename(fileName, itemName) {
    const base = path.basename(fileName, path.extname(fileName));
    const named = base.match(/(\d+(?:[.,]\d+)?)[-_ ]?(ml|мл|l|л|g|г|гр)\b/i);
    if (named) {
        const volume = Number(named[1].replace(",", "."));
        if (Number.isFinite(volume)) return { volume, unit: normalizeUnit(named[2], itemName) };
    }

    const coded = base.match(/-(\d{3})(?=[A-Z]{2,})/);
    if (coded) {
        const volume = Number(coded[1]);
        if (Number.isFinite(volume) && volume > 0) return { volume, unit: inferDefaultUnit(itemName) };
    }

    return null;
}

function imageScore(filePath) {
    const key = normalizeKey(path.basename(filePath));
    let score = 0;
    if (key.includes("prodphoto")) score += 4;
    if (key.includes("-f1-")) score += 2;
    if (key.includes("prodartwork")) score -= 3;
    if (key.includes("thumbnail") || key.includes("small_") || key.includes("medium_")) score -= 2;
    return score;
}

async function walkFiles(root) {
    const out = [];
    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
                continue;
            }
            if (!EXT_RE.test(entry.name)) continue;
            if (entry.name === ".DS_Store") continue;
            out.push(full);
        }
    }
    await walk(root);
    return out;
}

function classifyAsset(sourcePath) {
    const rel = path.relative(SOURCE_DIR, sourcePath);
    const parts = rel.split(path.sep).map(normalizeSpaces).filter(Boolean);
    if (parts.length < 3) return null;

    const brandName = normalizeBrandName(parts[0]);
    if (!brandName) return null;
    if (SKIP_BRANDS.has(normalizeKey(brandName))) return null;

    let brandCollectionName = null;
    let itemFolder = null;
    if (/^(коллек|коллеак)/i.test(parts[1])) {
        brandCollectionName = normalizeBrandCollectionName(parts[1]);
        itemFolder = normalizeSpaces(parts[2]);
    } else {
        itemFolder = normalizeSpaces(parts[1]);
    }

    const parsed = parseFromName(itemFolder);
    let itemName = parsed?.itemName || normalizeItemName(itemFolder);
    let volume = parsed?.volume ?? null;
    let unit = parsed?.unit ?? null;

    if (!Number.isFinite(volume) || !unit) {
        const fromFile = parseVolumeFromFilename(path.basename(sourcePath), itemName);
        if (fromFile) {
            volume = fromFile.volume;
            unit = fromFile.unit;
        }
    }

    if (!Number.isFinite(volume) || !unit) {
        return {
            ok: false,
            reason: "missing_volume",
            sourcePath,
            brandName,
            brandCollectionName,
            itemFolder,
        };
    }

    return {
        ok: true,
        sourcePath,
        brandName,
        brandCollectionName,
        itemName,
        volume,
        unit,
    };
}

function groupAssets(rows) {
    const products = new Map();

    for (const row of rows) {
        const productKey = [
            normalizeKey(row.brandName),
            normalizeKey(row.brandCollectionName || ""),
            normalizeKey(row.itemName),
        ].join("|");

        if (!products.has(productKey)) {
            const rawSlug = `${row.brandName}-${row.brandCollectionName || ""}-${row.itemName}`.replace(/--+/g, "-");
            products.set(productKey, {
                productKey,
                brandName: row.brandName,
                brandCollectionName: row.brandCollectionName,
                itemName: row.itemName,
                slug: slugify(rawSlug),
                variantsByKey: new Map(),
            });
        }

        const product = products.get(productKey);
        const variantKey = `${row.volume}-${row.unit}`;
        if (!product.variantsByKey.has(variantKey)) {
            product.variantsByKey.set(variantKey, {
                volume: row.volume,
                unit: row.unit,
                candidateImages: [],
            });
        }
        product.variantsByKey.get(variantKey).candidateImages.push(row.sourcePath);
    }

    const out = [];
    for (const product of products.values()) {
        const variants = [];
        for (const variant of product.variantsByKey.values()) {
            const sorted = [...variant.candidateImages].sort((a, b) => imageScore(b) - imageScore(a));
            variants.push({
                value: variant.volume,
                unit: variant.unit,
                sourceImagePath: sorted[0],
            });
        }

        variants.sort((a, b) => {
            const left = a.unit === "l" ? a.value * 1000 : a.value;
            const right = b.unit === "l" ? b.value * 1000 : b.value;
            return left - right;
        });

        out.push({
            ...product,
            variants,
        });
    }

    out.sort((a, b) => a.brandName.localeCompare(b.brandName, "ru") || a.itemName.localeCompare(b.itemName, "ru"));
    return out;
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

function unwrapEntity(entity) {
    if (!entity || typeof entity !== "object") return {};
    if (entity.attributes && typeof entity.attributes === "object") {
        return { id: entity.id, ...entity.attributes };
    }
    return entity;
}

function buildLookup(rows, keyFn) {
    const map = new Map();
    for (const row of rows) {
        const e = unwrapEntity(row);
        const key = keyFn(e);
        if (!key) continue;
        map.set(key, e);
    }
    return map;
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

function makeDescription(itemName) {
    return [
        {
            type: "paragraph",
            children: [{ type: "text", text: `${itemName} · Luxury Collection` }],
        },
    ];
}

async function main() {
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Mode: ${DRY_RUN ? "dry-run" : "apply"}`);
    console.log(`Skip brands: ${Array.from(SKIP_BRANDS).join(", ") || "none"}`);

    await ensureDir(WORK_DIR);

    const files = await walkFiles(SOURCE_DIR);
    const parsed = files.map(classifyAsset).filter(Boolean);
    const invalidRows = parsed.filter((r) => !r.ok);
    const validRows = parsed.filter((r) => r.ok).map((r) => r);
    const grouped = groupAssets(validRows);

    const variantsCount = grouped.reduce((acc, p) => acc + p.variants.length, 0);
    const brandNames = new Set(grouped.map((p) => p.brandName));

    console.log(`Assets found: ${files.length}`);
    console.log(`Assets imported: ${validRows.length}`);
    console.log(`Assets skipped: ${invalidRows.length}`);
    console.log(`Brands: ${brandNames.size}`);
    console.log(`Products grouped: ${grouped.length}`);
    console.log(`Variants grouped: ${variantsCount}`);

    if (invalidRows.length && VERBOSE) {
        console.log("Skipped assets (missing volume/unit):");
        for (const row of invalidRows.slice(0, 40)) {
            console.log(`- ${row.sourcePath}`);
        }
    }

    if (DRY_RUN) {
        console.log("Dry-run complete. Use --apply to write data into Strapi.");
        return;
    }

    const strapi = await createLocalStrapi();

    try {
        const [brands, collections, categories, brandCollections, products] = await Promise.all([
            strapi.entityService.findMany("api::brand.brand", { publicationState: "preview" }),
            strapi.entityService.findMany("api::collection.collection", { publicationState: "preview" }),
            strapi.entityService.findMany("api::category.category", { publicationState: "preview" }),
            strapi.entityService.findMany("api::brand-collection.brand-collection", {
                publicationState: "preview",
                populate: { brand: true },
            }),
            strapi.entityService.findMany("api::product.product", { publicationState: "preview" }),
        ]);

        const brandByName = buildLookup(brands, (b) => normalizeKey(b.name));
        const collectionByName = buildLookup(collections, (c) => normalizeKey(c.name));
        const categoryByName = buildLookup(categories, (c) => normalizeKey(c.name));
        const brandCollectionsList = brandCollections.map(unwrapEntity);
        const brandCollectionByComposite = buildLookup(
            brandCollectionsList,
            (bc) => `${normalizeKey(bc.name)}|${bc.brand?.id || bc.brand?.data?.id || ""}`
        );
        const productBySlug = buildLookup(products, (p) => normalizeKey(p.slug));

        let globalCollection = collectionByName.get(normalizeKey(GLOBAL_COLLECTION_NAME));
        if (!globalCollection) {
            const created = await strapi.entityService.create("api::collection.collection", {
                data: { name: GLOBAL_COLLECTION_NAME },
            });
            globalCollection = unwrapEntity(created);
            collectionByName.set(normalizeKey(globalCollection.name), globalCollection);
            console.log(`Created collection: ${GLOBAL_COLLECTION_NAME}`);
        }

        let createdBrands = 0;
        let createdBrandCollections = 0;
        let createdCategories = 0;
        let createdProducts = 0;
        let updatedProducts = 0;
        let uploadedMedia = 0;
        let fixedBrandCollectionOwners = 0;
        let fixedBrandCollectionLinks = 0;

        for (const row of grouped) {
            let brand = brandByName.get(normalizeKey(row.brandName));
            if (!brand) {
                const created = await strapi.entityService.create("api::brand.brand", {
                    data: {
                        name: row.brandName,
                        slug: slugify(row.brandName),
                    },
                });
                brand = unwrapEntity(created);
                brandByName.set(normalizeKey(brand.name), brand);
                createdBrands += 1;
            }

            let brandCollection = null;
            if (row.brandCollectionName) {
                const bcKey = `${normalizeKey(row.brandCollectionName)}|${brand.id}`;
                brandCollection = brandCollectionByComposite.get(bcKey);

                if (!brandCollection) {
                    const looseByName = brandCollectionsList.find(
                        (bc) =>
                            normalizeKey(bc.name) === normalizeKey(row.brandCollectionName) &&
                            !(bc.brand?.id || bc.brand?.data?.id)
                    );

                    if (looseByName) {
                        const updatedLoose = await strapi.entityService.update("api::brand-collection.brand-collection", looseByName.id, {
                            data: { brand: brand.id },
                        });
                        brandCollection = unwrapEntity(updatedLoose);
                        fixedBrandCollectionOwners += 1;
                    }
                }

                if (!brandCollection) {
                    const created = await strapi.entityService.create("api::brand-collection.brand-collection", {
                        data: {
                            name: row.brandCollectionName,
                            brand: brand.id,
                        },
                    });
                    brandCollection = unwrapEntity(created);
                    createdBrandCollections += 1;
                }

                brandCollectionByComposite.set(bcKey, brandCollection);
                if (!brandCollectionsList.some((bc) => bc.id === brandCollection.id)) {
                    brandCollectionsList.push(brandCollection);
                }
            }

            let category = categoryByName.get(normalizeKey(row.itemName));
            if (!category) {
                const created = await strapi.entityService.create("api::category.category", {
                    data: {
                        name: row.itemName,
                        slug: slugify(row.itemName),
                    },
                });
                category = unwrapEntity(created);
                categoryByName.set(normalizeKey(category.name), category);
                createdCategories += 1;
            }

            const variantsPayload = [];
            for (const variant of row.variants) {
                const webpPath = await convertToWebp(variant.sourceImagePath);
                const uploaded = await uploadWebp(strapi, webpPath);
                uploadedMedia += 1;
                variantsPayload.push({
                    value: variant.value,
                    unit: variant.unit,
                    product_shots: uploaded.id,
                });
            }

            const existing = productBySlug.get(normalizeKey(row.slug));
            const payload = {
                name: row.itemName,
                slug: row.slug,
                description: makeDescription(row.itemName),
                is_active: true,
                brand: brand.id,
                collection: globalCollection.id,
                brandCollection: brandCollection?.id || null,
                categories: [category.id],
                variants: variantsPayload,
            };

            let productId;
            if (!existing) {
                const created = await strapi.entityService.create("api::product.product", {
                    data: payload,
                });
                const createdProduct = unwrapEntity(created);
                productBySlug.set(normalizeKey(createdProduct.slug), createdProduct);
                productId = createdProduct.id;
                createdProducts += 1;
            } else {
                await strapi.entityService.update("api::product.product", existing.id, {
                    data: payload,
                });
                productId = existing.id;
                updatedProducts += 1;
            }

            if (brandCollection?.id && productId) {
                await strapi.entityService.update("api::product.product", productId, {
                    data: { brandCollection: brandCollection.id },
                });
                fixedBrandCollectionLinks += 1;
            }
        }

        console.log("Import completed:");
        console.log(`- brands created: ${createdBrands}`);
        console.log(`- brand collections created: ${createdBrandCollections}`);
        console.log(`- categories created: ${createdCategories}`);
        console.log(`- products created: ${createdProducts}`);
        console.log(`- products updated: ${updatedProducts}`);
        console.log(`- uploaded images (webp): ${uploadedMedia}`);
        console.log(`- fixed brand-collection owners: ${fixedBrandCollectionOwners}`);
        console.log(`- fixed product brand-collection links: ${fixedBrandCollectionLinks}`);
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

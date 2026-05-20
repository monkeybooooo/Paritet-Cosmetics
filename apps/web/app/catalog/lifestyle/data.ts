interface StrapiMediaFormat {
  url?: string | null;
}

interface StrapiMedia {
  url?: string | null;
  formats?: {
    large?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    thumbnail?: StrapiMediaFormat;
  } | null;
  attributes?: {
    url?: string | null;
    formats?: {
      large?: StrapiMediaFormat;
      medium?: StrapiMediaFormat;
      small?: StrapiMediaFormat;
      thumbnail?: StrapiMediaFormat;
    } | null;
  } | null;
}

interface ProductVariant {
  value?: number | null;
  unit?: string | null;
  package_label?: string | null;
  product_shots?: StrapiMedia | StrapiMedia[] | { data?: StrapiMedia | StrapiMedia[] | null } | null;
}

interface ProductEntity {
  id: number;
  name?: string | null;
  slug?: string | null;
  description?: unknown;
  brand?: {
    id: number;
    name?: string | null;
    description_ru?: unknown;
    description_en?: unknown;
  } | null;
  collection?: {
    id: number;
    name?: string | null;
  } | null;
  brandCollection?: {
    id: number;
    name?: string | null;
    brand?: {
      id: number;
      name?: string | null;
      description_ru?: unknown;
      description_en?: unknown;
    } | null;
  } | null;
  gallery?:
    | StrapiMedia[]
    | { data?: StrapiMedia[] | StrapiMedia | null }
    | null;
  variants?: ProductVariant[] | null;
}

export interface LifestyleProduct {
  id: number;
  sourceProductId: number;
  sourceProductSlug: string;
  name: string;
  slug: string;
  variantIndex: number;
  brandId: number;
  brandName: string;
  brandSlug: string;
  volumeLabel: string;
  description: string;
  packageLabel: string;
  imageUrl: string | null;
}

export interface LifestyleBrand {
  id: number;
  name: string;
  slug: string;
}

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function slugifyBrand(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function toAbsoluteMediaUrl(url: string | null | undefined, strapiUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, strapiUrl).toString();
  } catch {
    return null;
  }
}

function extractMediaArray(value: unknown): StrapiMedia[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as StrapiMedia[];
  if (typeof value === "object" && "data" in (value as any)) {
    const data = (value as any).data;
    if (!data) return [];
    return Array.isArray(data) ? (data as StrapiMedia[]) : [data as StrapiMedia];
  }
  return [value as StrapiMedia];
}

function pickBestUrlFromMediaItem(media: StrapiMedia | undefined, strapiUrl: string): string | null {
  if (!media) return null;
  const src = media.attributes ?? media;
  return (
    toAbsoluteMediaUrl(src.formats?.large?.url, strapiUrl) ||
    toAbsoluteMediaUrl(src.formats?.medium?.url, strapiUrl) ||
    toAbsoluteMediaUrl(src.formats?.small?.url, strapiUrl) ||
    toAbsoluteMediaUrl(src.url, strapiUrl)
  );
}

function isLifestyleProduct(product: ProductEntity): boolean {
  const collectionName = normalize(product.collection?.name);
  const brandCollectionName = normalize(product.brandCollection?.name);
  return (
    collectionName.includes("lifestyle") ||
    collectionName.includes("лайф") ||
    brandCollectionName.includes("lifestyle") ||
    brandCollectionName.includes("лайф")
  );
}

type RichTextNode = {
  text?: string;
  children?: unknown;
};

function collectTextFragments(node: unknown): string[] {
  if (!node) return [];
  if (typeof node === "string") return [node.trim()].filter(Boolean);
  if (Array.isArray(node)) return node.flatMap((item) => collectTextFragments(item));
  if (typeof node !== "object") return [];

  const typedNode = node as RichTextNode;
  const ownText = typeof typedNode.text === "string" ? typedNode.text.trim() : "";
  const nestedChildren = collectTextFragments(typedNode.children);
  return [ownText, ...nestedChildren].filter(Boolean);
}

function extractDescriptionText(descriptionBlocks: unknown): string {
  if (!descriptionBlocks) return "";

  if (typeof descriptionBlocks === "string") {
    return descriptionBlocks.trim();
  }

  if (!Array.isArray(descriptionBlocks)) {
    return collectTextFragments(descriptionBlocks).join(" ").replace(/\s+/g, " ").trim();
  }

  const lines = descriptionBlocks
    .map((block) => collectTextFragments(block).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.join("\n");
}

function buildVolumeLabel(product: ProductEntity): string {
  const variant = product.variants?.find((item) => item?.value && item?.unit);
  if (!variant?.value || !variant?.unit) return "Объём уточняется";
  return `${variant.value} ${String(variant.unit).trim()}`;
}

function buildVariantVolumeLabel(variant: ProductVariant): string {
  if (!variant?.value || !variant?.unit) return "Объём уточняется";
  return `${variant.value} ${String(variant.unit).trim()}`;
}

function isRrrSignature(brandName: string, productName: string, sourceProductSlug: string): boolean {
  const signature = `${brandName} ${productName} ${sourceProductSlug}`.toLowerCase();
  return (
    signature.includes("relax refresh revive") || signature.includes("relax-refresh-revive") || signature.includes("rrr")
  );
}

function normalizeRrrVolumeLabel(
  volumeLabel: string,
  brandName: string,
  productName: string,
  sourceProductSlug: string
): string {
  if (!isRrrSignature(brandName, productName, sourceProductSlug)) return volumeLabel;
  const normalized = volumeLabel.toLowerCase().replace(/\s+/g, "");
  if (normalized === "30ml" || normalized === "30мл") return "35 ml";
  return volumeLabel;
}

function isPlaceholderVolume(volumeLabel: string): boolean {
  const normalized = volumeLabel.toLowerCase().replace(/\s+/g, "");
  return normalized === "3л" || normalized === "3l" || normalized === "5л" || normalized === "5l";
}

function getVariantVolumeValue(variant: ProductVariant): number {
  const raw = variant?.value;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function buildProductImageUrl(product: ProductEntity, strapiUrl: string, variant?: ProductVariant): string | null {
  const variantMediaList = extractMediaArray(variant?.product_shots);
  const variantShot = pickBestUrlFromMediaItem(variantMediaList[0], strapiUrl);
  if (variantShot) return variantShot;

  const firstVariantWithPhoto = product.variants?.find((item) => item?.product_shots);
  const firstVariantMediaList = extractMediaArray(firstVariantWithPhoto?.product_shots);
  const firstVariantShot = pickBestUrlFromMediaItem(firstVariantMediaList[0], strapiUrl);
  if (firstVariantShot) return firstVariantShot;

  const galleryMediaList = extractMediaArray(product.gallery);
  const galleryShot = pickBestUrlFromMediaItem(galleryMediaList[0], strapiUrl);
  if (galleryShot) return galleryShot;

  return null;
}

function resolveBrandName(product: ProductEntity): string | null {
  const name = product.brand?.name?.trim() || product.brandCollection?.brand?.name?.trim() || "";
  return name || null;
}

function resolveBrandDescription(product: ProductEntity): string {
  const brandDescription =
    extractDescriptionText(product.brand?.description_ru) ||
    extractDescriptionText(product.brandCollection?.brand?.description_ru);
  return brandDescription;
}

function resolveBrandIdentity(product: ProductEntity): { id: number; name: string } | null {
  const id = product.brand?.id || product.brandCollection?.brand?.id;
  const name = resolveBrandName(product);
  if (!id || !name) return null;
  return { id, name };
}

function buildBrandRouteSlug(brandId: number, brandName: string): string {
  const nameSlug = slugifyBrand(brandName);
  return nameSlug ? `${brandId}-${nameSlug}` : String(brandId);
}

function parseBrandIdFromRouteSlug(brandSlug: string): number | null {
  const match = brandSlug.match(/^(\d+)(?:-|$)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchLifestyleProducts(): Promise<LifestyleProduct[]> {
  const publicStrapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const internalStrapiUrl = process.env.STRAPI_INTERNAL_URL;
  const candidateDataUrls = Array.from(new Set([internalStrapiUrl, publicStrapiUrl].filter(Boolean) as string[]));
  if (!candidateDataUrls.length) return [];

  const pageSize = 200;
  let rows: ProductEntity[] = [];
  let activeDataUrl = candidateDataUrls[0];

  for (const baseUrl of candidateDataUrls) {
    const nextRows: ProductEntity[] = [];
    let page = 1;
    let keepLoading = true;

    try {
      while (keepLoading) {
        const res = await fetch(`${baseUrl}/api/products-public?pageSize=${pageSize}&page=${page}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = await res.json();
        const chunk: ProductEntity[] = Array.isArray(payload?.data) ? payload.data : [];
        nextRows.push(...chunk);

        if (chunk.length < pageSize) {
          keepLoading = false;
        } else {
          page += 1;
        }
      }

      rows = nextRows;
      activeDataUrl = baseUrl;
      break;
    } catch {
      rows = [];
    }
  }
  if (!rows.length) return [];
  const strapiMediaUrl = publicStrapiUrl || activeDataUrl;

  return rows
    .filter(isLifestyleProduct)
    .flatMap((product) => {
      const brand = resolveBrandIdentity(product);
      if (!brand) return [];
      const name = product.name?.trim() || "Товар без названия";

      const variants = Array.isArray(product.variants) ? [...product.variants] : [];
      variants.sort((a, b) => getVariantVolumeValue(a) - getVariantVolumeValue(b));
      const baseDescription = resolveBrandDescription(product);

      if (!variants.length) {
        const sourceProductSlug = product.slug?.trim() || String(product.id);
        const volumeLabel = normalizeRrrVolumeLabel(buildVolumeLabel(product), brand.name, name, sourceProductSlug);
        const imageUrl = isPlaceholderVolume(volumeLabel)
          ? "/photo4.webp"
          : buildProductImageUrl(product, strapiMediaUrl);
        if (!imageUrl) return [];
        return [
          {
            id: product.id,
            sourceProductId: product.id,
            sourceProductSlug,
            name,
            slug: sourceProductSlug,
            variantIndex: 0,
            brandId: brand.id,
            brandName: brand.name,
            brandSlug: buildBrandRouteSlug(brand.id, brand.name),
            volumeLabel,
            description: baseDescription,
            packageLabel: "",
            imageUrl,
          },
        ];
      }

      return variants.reduce<LifestyleProduct[]>((acc, variant, index) => {
        const sourceProductSlug = product.slug?.trim() || String(product.id);
        const volumeLabel = normalizeRrrVolumeLabel(
          buildVariantVolumeLabel(variant),
          brand.name,
          name,
          sourceProductSlug
        );
        const imageUrl = isPlaceholderVolume(volumeLabel)
          ? "/photo4.webp"
          : buildProductImageUrl(product, strapiMediaUrl, variant);
        if (!imageUrl) return acc;

        acc.push({
          id: product.id * 1000 + (index + 1),
          sourceProductId: product.id,
          sourceProductSlug,
          name,
          slug: `${sourceProductSlug}-${index + 1}`,
          variantIndex: index + 1,
          brandId: brand.id,
          brandName: brand.name,
          brandSlug: buildBrandRouteSlug(brand.id, brand.name),
          volumeLabel,
          description: baseDescription,
          packageLabel: variant.package_label?.trim() || "",
          imageUrl,
        });

        return acc;
      }, []);
    });
}

export async function fetchLifestyleBrands(): Promise<LifestyleBrand[]> {
  const products = await fetchLifestyleProducts();

  return Array.from(
    new Map(products.map((p) => [p.brandId, { id: p.brandId, name: p.brandName, slug: p.brandSlug }])).values()
  );
}

export async function fetchLifestyleBrandProducts(brandSlug: string): Promise<LifestyleProduct[]> {
  const products = await fetchLifestyleProducts();
  const routeBrandId = parseBrandIdFromRouteSlug(brandSlug);
  if (routeBrandId) return products.filter((product) => product.brandId === routeBrandId);
  return products.filter((product) => product.brandSlug === brandSlug);
}

export async function fetchLifestyleProductBySlug(
  brandSlug: string,
  productSlug: string
): Promise<LifestyleProduct | null> {
  const products = await fetchLifestyleBrandProducts(brandSlug);
  return products.find((product) => product.slug === productSlug) ?? null;
}

export async function fetchLifestyleRelatedProducts(
  brandSlug: string,
  sourceProductSlug: string
): Promise<LifestyleProduct[]> {
  const products = await fetchLifestyleBrandProducts(brandSlug);
  return products.filter((product) => product.sourceProductSlug === sourceProductSlug);
}

export async function fetchLifestyleHeroImage(): Promise<string> {
  return "/photo2.webp";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeLatinPrefixBlock(value: string): string {
  const latinPrefixMatch = value.match(/^([A-Za-z0-9&'".-]+\s+){1,6}/);
  if (!latinPrefixMatch) return value.trim();
  return value.slice(latinPrefixMatch[0].length).replace(/^[-–—:|,/\\\s]+/, "").trim();
}

export function getLifestyleDisplayProductTitle(
  product: Pick<LifestyleProduct, "brandName" | "name" | "sourceProductSlug">
): string {
  const rawTitle = product.name.trim();
  const brandTitle = product.brandName.trim();
  const normalizedBrand = product.brandName.trim().toLowerCase();
  const isRrrProduct =
    `${product.brandName} ${product.name} ${product.sourceProductSlug}`.toLowerCase().includes("relax refresh revive") ||
    `${product.brandName} ${product.name} ${product.sourceProductSlug}`.toLowerCase().includes("relax-refresh-revive") ||
    `${product.brandName} ${product.name} ${product.sourceProductSlug}`.toLowerCase().includes("rrr");

  if (isRrrProduct) return `${brandTitle} Шампунь для волос и тела`;

  let title =
    rawTitle.replace(new RegExp(`^${escapeRegExp(normalizedBrand)}\\s*[-–—:]?\\s*`, "i"), "").trim() || rawTitle;

  const brandLooksRussian = /[а-яё]/i.test(brandTitle);

  // If a title starts with Latin brand words but then switches to Cyrillic text,
  // keep only the Cyrillic product part (e.g. "Aqua Senes Гель для душа" -> "Гель для душа").
  if (/[а-яё]/i.test(title)) {
    const firstCyrillicIdx = title.search(/[а-яё]/i);
    if (firstCyrillicIdx > 0) {
      const prefix = title.slice(0, firstCyrillicIdx).trim();
      if (/^[A-Za-z0-9\s&'".,/-]+$/.test(prefix)) {
        const stripped = title.slice(firstCyrillicIdx).trim();
        if (stripped) title = stripped;
      }
    }
  }

  // For Russian brands, force title normalization around the Cyrillic part
  // and remove repeated brand mentions from the beginning.
  if (brandLooksRussian) {
    const firstCyrillicIdx = rawTitle.search(/[а-яё]/i);
    if (firstCyrillicIdx >= 0) {
      title = rawTitle.slice(firstCyrillicIdx).trim();
    } else {
      title = removeLatinPrefixBlock(title);
    }

    const repeatedBrandAtStart = new RegExp(`^(?:${escapeRegExp(brandTitle)}\\s*)+`, "i");
    title = title.replace(repeatedBrandAtStart, "").replace(/^[-–—:|,/\\\s]+/, "").trim();
    title = removeLatinPrefixBlock(title);
  }

  const coreTitle = title || rawTitle;
  const repeatedBrandPrefix = new RegExp(`^(?:${escapeRegExp(brandTitle)}\\s*){2,}`, "i");
  const singleBrandPrefix = new RegExp(`^${escapeRegExp(brandTitle)}\\s*`, "i");
  const coreWithoutDupBrand = coreTitle
    .replace(repeatedBrandPrefix, `${brandTitle} `)
    .replace(/\s{2,}/g, " ")
    .trim();
  const normalizedCoreTitle = coreWithoutDupBrand.toLowerCase();
  const normalizedBrandTitle = brandTitle.toLowerCase();
  if (normalizedCoreTitle.startsWith(normalizedBrandTitle)) {
    return coreWithoutDupBrand.replace(singleBrandPrefix, `${brandTitle} `).replace(/\s{2,}/g, " ").trim();
  }
  return `${brandTitle} ${coreWithoutDupBrand}`.replace(/\s{2,}/g, " ").trim();
}

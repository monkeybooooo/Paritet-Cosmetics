const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_TOKEN;
if (!TOKEN) throw new Error("Set STRAPI_TOKEN");

async function req(path, { method = "GET", body } = {}) {
    const res = await fetch(`${STRAPI_URL}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}\n${text}`);
    return json;
}

async function getAll(entity) {
    const pageSize = 100;
    let page = 1;
    let out = [];
    while (true) {
        const r = await req(`/api/${entity}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
        out.push(...(r.data ?? []));
        const pageCount = r?.meta?.pagination?.pageCount ?? 1;
        if (page >= pageCount) break;
        page++;
    }
    return out;
}

function pickByRules(name, rules) {
    const n = (name ?? "").toLowerCase();
    for (const r of rules) {
        if (r.match(n)) return r.value;
    }
    return null;
}

async function main() {
    // 1) Подтяни бренды/категории из Strapi (уже созданные тобой)
    const brands = await getAll("brands");
    const categories = await getAll("categories");

    const brandByName = new Map(brands.map(b => [b.attributes?.name?.toLowerCase(), b.id]));
    const categoryByName = new Map(categories.map(c => [c.attributes?.name?.toLowerCase(), c.id]));

    // 2) ПРАВИЛА: как по названию товара определить бренд/категорию
    //    Ты сюда добавишь 2–10 строк — и всё.
    const brandRules = [
        // пример: если в названии есть "kerastase" → бренд Kérastase
        { match: (s) => s.includes("kerastase"), value: "kerastase" },
        // { match: (s) => s.includes("davines"), value: "davines" },
    ];

    const categoryRules = [
        // пример: если в названии есть "candle" → Lifestyle
        { match: (s) => s.includes("candle") || s.includes("diffuser"), value: "lifestyle" },
        // { match: (s) => s.includes("shampoo") || s.includes("mask"), value: "professional" },
    ];

    // 3) Сканим продукты и обновляем только те, где пусто
    const products = await getAll("products");
    console.log(`Products: ${products.length}, Brands: ${brands.length}, Categories: ${categories.length}`);

    let updated = 0;
    for (const p of products) {
        const attrs = p.attributes ?? {};
        const name = attrs.name ?? attrs.title ?? "";
        const currentBrand = attrs.brand?.data?.id ?? null;
        const currentCategory = attrs.category?.data?.id ?? null;

        if (currentBrand && currentCategory) continue; // уже всё стоит

        const brandKey = pickByRules(name, brandRules);
        const catKey = pickByRules(name, categoryRules);

        const brandId = brandKey ? brandByName.get(brandKey) : null;
        const categoryId = catKey ? categoryByName.get(catKey) : null;

        // если не нашли — пропускаем (чтобы не поставить мусор)
        if (!brandId && !categoryId) continue;

        const data = {};
        if (!currentBrand && brandId) data.brand = brandId;
        if (!currentCategory && categoryId) data.category = categoryId;

        await req(`/api/products/${p.id}`, { method: "PUT", body: { data } });
        updated++;
        if (updated % 20 === 0) console.log(`Updated: ${updated}`);
    }

    console.log(`Done. Updated: ${updated}`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
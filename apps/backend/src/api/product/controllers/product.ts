/**
 * product controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::product.product", ({ strapi }) => ({
    async productsPublic(ctx) {
        const pageSize = Number(ctx.query?.pageSize ?? 200) || 200;
        const page = Number(ctx.query?.page ?? 1) || 1;

        const data = await strapi.entityService.findMany("api::product.product", {
            publicationState: "preview",
            pagination: { page, pageSize },
            populate: {
                brand: true,
                collection: true,
                brandCollection: {
                    populate: {
                        brand: true,
                    },
                },
                categories: true,
                gallery: true,
                variants: {
                    populate: {
                        product_shots: true,
                    },
                },
            },
        });

        ctx.body = { data };
    },

    async productBySlugPublic(ctx) {
        const slug = String(ctx.params?.slug ?? "").trim();
        if (!slug) {
            ctx.status = 400;
            ctx.body = { error: "Missing slug" };
            return;
        }

        const rows = await strapi.entityService.findMany("api::product.product", {
            publicationState: "preview",
            filters: { slug: { $eq: slug } },
            pagination: { page: 1, pageSize: 1 },
            populate: {
                brand: true,
                collection: true,
                brandCollection: {
                    populate: {
                        brand: true,
                    },
                },
                categories: true,
                gallery: true,
                variants: {
                    populate: {
                        product_shots: true,
                    },
                },
            },
        });

        const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        ctx.body = { data: first };
    },
}));

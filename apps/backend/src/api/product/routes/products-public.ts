export default {
    routes: [
        {
            method: "GET",
            path: "/products-public",
            handler: "product.productsPublic",
            config: { auth: false },
        },
        {
            method: "GET",
            path: "/products-public/:slug",
            handler: "product.productBySlugPublic",
            config: { auth: false },
        },
    ],
};
import type { NextConfig } from "next";

function buildStrapiRemotePatterns() {
    const raw = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

    try {
        const u = new URL(raw);
        return [
            {
                protocol: u.protocol.replace(":", "") as "http" | "https",
                hostname: u.hostname,
                port: u.port || "",
                pathname: "/uploads/**",
            },
        ];
    } catch {
        // fallback (dev)
        return [
            { protocol: "http" as const, hostname: "localhost", port: "1337", pathname: "/uploads/**" },
            { protocol: "http" as const, hostname: "127.0.0.1", port: "1337", pathname: "/uploads/**" },
        ];
    }
}

function buildStrapiOrigins(): string[] {
    const raw = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const fallback = ["http://localhost:1337", "http://127.0.0.1:1337"];

    try {
        const u = new URL(raw);
        const origin = `${u.protocol}//${u.host}`;
        return Array.from(new Set([origin, ...fallback]));
    } catch {
        return fallback;
    }
}

function buildCsp() {
    const origins = buildStrapiOrigins();
    const originsPart = origins.join(" ");

    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${originsPart}`,
        "font-src 'self' data:",
        `connect-src 'self' ${originsPart}`,
        "frame-ancestors 'none'",
    ].join("; ");
}

const nextConfig: NextConfig = {
    images: {
        remotePatterns: buildStrapiRemotePatterns(),
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: buildCsp(),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;

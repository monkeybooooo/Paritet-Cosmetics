import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchLuxuryProductBySlug, fetchLuxuryRelatedProducts } from "../../data";
import CatalogDropdown from "../../../../components/CatalogDropdown";
import { getDetailBottleImageClassWithBrand } from "../../../imageFit";

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="whitespace-nowrap text-[clamp(1.05rem,1.875vw,2.25rem)] leading-none tracking-[0.03em] text-[#141210]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </span>
  );
}

export default async function LuxuryProductPage({
  params,
}: {
  params: Promise<{ brandSlug: string; productSlug: string }>;
}) {
  const { brandSlug, productSlug } = await params;
  const product = await fetchLuxuryProductBySlug(brandSlug, productSlug);

  if (!product) notFound();

  const relatedVariants = (await fetchLuxuryRelatedProducts(brandSlug, product.sourceProductSlug)).filter(
    (item) => item.slug !== product.slug
  );
  const getVolumeNumber = (label: string): number => {
    const parsed = Number(String(label).replace(",", ".").match(/\d+(\.\d+)?/)?.[0] ?? "");
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  };
  const volumeOptionsRaw = [product, ...relatedVariants].sort(
    (a, b) => getVolumeNumber(a.volumeLabel) - getVolumeNumber(b.volumeLabel)
  );
  const volumeOptions = volumeOptionsRaw.reduce<typeof volumeOptionsRaw>((acc, item) => {
    const key = item.volumeLabel.trim().toLowerCase();
    const existingIndex = acc.findIndex((entry) => entry.volumeLabel.trim().toLowerCase() === key);
    if (existingIndex === -1) {
      acc.push(item);
      return acc;
    }

    // Keep the currently opened product when duplicate volume labels exist.
    if (item.slug === product.slug) {
      acc[existingIndex] = item;
    }
    return acc;
  }, []);

  const normalizedBrand = product.brandName.toLowerCase();
  const displayProductTitle = product.name.replace(new RegExp(`^${normalizedBrand}\\s*[-–—]?\\s*`, "i"), "").trim() || product.name;
  const displayProductTitleWithoutBrand = displayProductTitle
    .replace(new RegExp(`^${product.brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .trim();

  const descriptionLines = String(product.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const bottleContainerClass = "h-[clamp(24rem,64vh,46rem)] w-[clamp(18rem,42vw,34rem)]";
  const bottleImageClass = getDetailBottleImageClassWithBrand(product.volumeLabel, product.brandName);

  return (
    <main className="h-[100svh] overflow-hidden bg-[var(--page-bg)] p-[clamp(0.5rem,1vw,1rem)]">
      <div className="mx-auto flex h-full max-w-[1680px] flex-col border border-black/70 bg-white p-[clamp(1rem,1.4vw,1.5rem)]">
        <header>
          <div className="flex items-center justify-between gap-4">
            <nav className="flex flex-nowrap items-baseline gap-[clamp(1.4rem,7.3vw,8.75rem)] overflow-visible">
              <Link href="/">
                <NavLabel>Главная</NavLabel>
              </Link>
              <CatalogDropdown />
              <NavLabel>О нас</NavLabel>
            </nav>

            <div className="flex items-center">
              <NavLabel>Контакты</NavLabel>
            </div>
          </div>
          <div className="mt-[clamp(0.85rem,1.2vw,1.3rem)] h-px bg-black/30" />
        </header>

        <section className="min-h-0 flex-1 overflow-hidden pt-[clamp(0.7rem,1.1vw,1.2rem)]">
          <div className="relative z-20 flex flex-wrap items-baseline justify-between gap-3">
            <h1
              className="text-[clamp(2.1rem,3vw,3.6rem)] leading-[0.95] tracking-[0.025em] text-[#141210]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.brandName}
            </h1>

            <nav
              className="flex flex-wrap items-center gap-2 text-[clamp(0.86rem,0.95vw,0.95rem)] leading-none tracking-[0.055em] text-[#3a3632]"
              style={{ fontFamily: "var(--font-display)" }}
              aria-label="Хлебные крошки"
            >
              <Link href="/" className="hover:opacity-70">Косметика</Link>
              <span>&gt;</span>
              <Link href="/catalog/luxury" className="hover:opacity-70">Премиальная коллекция</Link>
              <span>&gt;</span>
              <Link href={`/catalog/luxury/${brandSlug}`} className="hover:opacity-70">{product.brandName}</Link>
            </nav>
          </div>

          <div className="mt-[clamp(0.7rem,1vw,0.95rem)] grid h-full grid-cols-1 gap-[clamp(1.2rem,2.4vw,2.2rem)] lg:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
            <div className="relative z-20 flex flex-col justify-start">
              <h2
                className="text-[clamp(1.7rem,2.3vw,2.7rem)] leading-[0.95] tracking-[0.02em] text-[#141210]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {displayProductTitleWithoutBrand || displayProductTitle}
              </h2>

              {volumeOptions.length > 1 ? (
                <div className="mt-[clamp(0.9rem,1.3vw,1.15rem)] mb-[clamp(1.5rem,3.4vw,3.2rem)] flex flex-wrap items-center gap-[clamp(0.55rem,0.8vw,0.8rem)]">
                  <p
                    className="mr-[clamp(0.15rem,0.4vw,0.35rem)] text-[clamp(0.9rem,1vw,1.02rem)] tracking-[0.04em] text-[#1a1816]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                  >
                    Объём:
                  </p>
                  {volumeOptions.map((item) => {
                    const isActive = item.slug === product.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={`/catalog/luxury/${brandSlug}/${item.slug}`}
                        className={`rounded-[999px] px-[clamp(0.7rem,0.95vw,1rem)] py-[clamp(0.38rem,0.55vw,0.52rem)] text-[clamp(0.95rem,1.04vw,1.08rem)] leading-none transition-colors ${
                          isActive
                            ? "border border-black bg-black text-white"
                            : "border border-black/35 text-[#141210] hover:bg-black/[0.05]"
                        }`}
                        style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                      >
                        {item.volumeLabel}
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {descriptionLines.length > 0 ? (
                <div className="mt-[clamp(0.75rem,1vw,1rem)] max-w-[52ch]">
                  <ul className="space-y-[clamp(0.42rem,0.7vw,0.7rem)]">
                    {descriptionLines.map((line) => (
                      <li key={line} className="flex items-center gap-[clamp(0.65rem,0.9vw,0.9rem)]">
                        <span className="text-[clamp(1.5rem,2vw,1.9rem)] leading-none text-[#141210]" style={{ fontFamily: "var(--font-display)" }}>›</span>
                        <span className="text-[clamp(1.15rem,1.3vw,1.35rem)] leading-[1.28] tracking-[0.02em] text-[#141210]" style={{ fontFamily: "var(--font-display)" }}>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className={`relative z-10 mx-auto flex ${bottleContainerClass} items-center justify-center overflow-hidden bg-white`}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={bottleImageClass}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[0.9rem] text-black/55">Нет фото</div>
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}

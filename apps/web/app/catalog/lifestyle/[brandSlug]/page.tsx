import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchLifestyleBrandProducts, fetchLifestyleBrands, getLifestyleDisplayProductTitle } from "../data";
import CatalogDropdown from "../../../components/CatalogDropdown";

export const dynamic = "force-dynamic";

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

export default async function LifestyleBrandPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;
  const [products, brands] = await Promise.all([
    fetchLifestyleBrandProducts(brandSlug),
    fetchLifestyleBrands(),
  ]);

  if (!products.length) {
    notFound();
  }

  const currentBrand = brands.find((brand) => brand.slug === brandSlug);
  const title = currentBrand?.name || products[0].brandName;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] p-[clamp(0.5rem,1vw,1rem)]">
      <div className="mx-auto max-w-[1680px] border border-black/70 bg-white p-[clamp(1rem,1.4vw,1.5rem)]">
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

        <section className="pb-[clamp(1.2rem,2vw,2rem)] pt-[clamp(1rem,1.5vw,1.6rem)]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/20 pb-[clamp(0.75rem,1vw,1rem)]">
            <h1
              className="text-[clamp(2rem,2.9vw,3.1rem)] leading-[0.95] tracking-[0.03em] text-[#141210]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>

            <nav
              className="flex flex-wrap items-center gap-2 text-[clamp(0.9rem,1vw,1rem)] leading-none tracking-[0.05em] text-[#3a3632]"
              style={{ fontFamily: "var(--font-display)" }}
              aria-label="Хлебные крошки"
            >
              <Link href="/" className="hover:opacity-70">Косметика</Link>
              <span>&gt;</span>
              <Link href="/catalog/lifestyle" className="hover:opacity-70">Лайфстайл коллекция</Link>
              <span>&gt;</span>
              <span>{title}</span>
            </nav>
          </div>

          <div className="mt-[clamp(2rem,3.5vw,3.2rem)] grid grid-cols-1 gap-y-[clamp(2.8rem,6vw,6rem)] md:grid-cols-2 md:gap-x-[clamp(4rem,9vw,8rem)] md:gap-y-[clamp(3.5rem,7vw,7rem)] xl:grid-cols-3 xl:gap-x-[clamp(6rem,12vw,12rem)] xl:gap-y-[clamp(4rem,8vw,8.5rem)]">
            {products.map((product) => {
              const displayTitle = getLifestyleDisplayProductTitle(product);
              return (
              <Link
                key={product.id}
                href={`/catalog/lifestyle/${brandSlug}/${product.slug}`}
                className="mx-auto block w-full max-w-[16.5rem] bg-white transition-opacity hover:opacity-70"
              >
                <article>
                  <div className="relative mx-auto h-[clamp(13rem,22vw,18rem)] w-[clamp(8.4rem,14vw,10.8rem)] overflow-hidden bg-white">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain object-center"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[0.8rem] text-black/55">Нет фото</div>
                    )}
                  </div>

                  <div className="pt-[clamp(0.75rem,1.1vw,1rem)] text-center">
                    <h2
                      className="text-[clamp(1.45rem,1.75vw,1.95rem)] leading-[0.95] tracking-[0.02em] text-[#141210]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {displayTitle}
                    </h2>

                    <p
                      className="mt-[clamp(0.38rem,0.7vw,0.55rem)] text-[clamp(1rem,1.08vw,1.12rem)] leading-none tracking-[0.03em] text-[#141210]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {product.volumeLabel}
                    </p>
                  </div>
                </article>
              </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

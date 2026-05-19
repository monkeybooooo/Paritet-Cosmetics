import Image from "next/image";
import Link from "next/link";
import { fetchLuxuryBrands, fetchLuxuryHeroImage } from "./data";
import CatalogDropdown from "../../components/CatalogDropdown";

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

export default async function LuxuryCatalogPage() {
  const [brands, heroImageUrl] = await Promise.all([fetchLuxuryBrands(), fetchLuxuryHeroImage()]);

  return (
    <main className="h-[100svh] overflow-hidden bg-[var(--page-bg)] p-[clamp(0.5rem,1vw,1rem)]">
      <div className="mx-auto flex h-full max-w-[1680px] flex-col border border-black/70 bg-[var(--surface)] p-[clamp(1rem,1.4vw,1.5rem)]">
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

        <section className="mt-[clamp(0.9rem,1.3vw,1.4rem)] grid min-h-0 flex-1 grid-cols-1 gap-[clamp(1rem,1.2vw,1.35rem)] overflow-hidden lg:grid-cols-[minmax(20rem,1fr)_auto_minmax(20rem,34rem)]">
          <div className="flex min-h-0 flex-col justify-between">
            <div className="max-w-[24rem]">
              <p
                className="text-[clamp(1.05rem,1.3vw,1.35rem)] leading-none tracking-[0.03em] text-[#141210]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Бренды:
              </p>

              <div className="mt-[clamp(0.95rem,1.35vw,1.25rem)] flex flex-col gap-[clamp(0.5rem,0.78vw,0.7rem)]">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/catalog/luxury/${brand.slug}`}
                    className="inline-block w-fit text-[clamp(1.35rem,1.6vw,1.85rem)] leading-none tracking-[0.045em] text-[#141210] transition-opacity hover:opacity-65"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {brand.name.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-[clamp(1.2rem,1.8vw,1.8rem)]">
              <h1
                className="max-w-[14ch] text-[clamp(3.2rem,4.8vw,5.4rem)] leading-[0.9] tracking-[0.03em] text-[#141210]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ПРЕМИАЛЬНАЯ
                <br />
                КОЛЛЕКЦИЯ
              </h1>

              <p
                className="mt-[clamp(0.75rem,1.15vw,1.1rem)] text-[clamp(1.15rem,1.45vw,1.5rem)] leading-none tracking-[0.04em] text-[#141210]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                МИР КУТЮР | ИСТОРИЯ ПАРФЮМА | ЭСТЕТИКА ЛЮКСА
              </p>
            </div>
          </div>

          <div className="hidden min-h-0 items-center justify-center lg:flex">
            <p
              className="max-h-[min(72svh,46rem)] text-[clamp(0.86rem,0.98vw,1.02rem)] leading-[1.28] tracking-[0.04em] text-[#141210]"
              style={{
                fontFamily: "var(--font-display)",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              Уникальный союз высокой моды, королевского влияния и профессионального подхода к созданию гостиничной
              косметики.
            </p>
          </div>

          <div className="relative ml-auto min-h-0 h-full w-full max-w-[clamp(20rem,34vw,34rem)]">
            <Image
              src={heroImageUrl}
              alt="Премиальная коллекция"
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover object-center"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

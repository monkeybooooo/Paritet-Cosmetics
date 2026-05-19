"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function NavigationItem({ label }: { label: string }) {
  return (
    <span
      className="whitespace-nowrap text-[clamp(1.05rem,1.875vw,2.25rem)] leading-none tracking-[0.03em] text-[#141210]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {label}
    </span>
  );
}

function CatalogDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="m-0 whitespace-nowrap border-0 bg-transparent p-0 align-baseline text-[clamp(1.05rem,1.875vw,2.25rem)] leading-none tracking-[0.03em] text-[#141210] cursor-pointer"
        style={{ fontFamily: "var(--font-display)" }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        Каталог
      </button>

      {isOpen && (
        <div className="catalog-dropdown absolute left-0 top-full z-30 mt-3 min-w-[260px] rounded-[6px] border border-black/20 bg-[#f6f3ee]/95 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <Link
            href="/catalog/lifestyle"
            className="block whitespace-nowrap rounded-[4px] px-2 py-2 text-[clamp(1rem,1.3vw,1.25rem)] leading-none tracking-[0.03em] text-[#141210] transition-colors hover:bg-black/[0.04]"
            style={{ fontFamily: "var(--font-display)" }}
            onClick={() => setIsOpen(false)}
          >
            Лайфстайл коллекция
          </Link>
          <Link
            href="/catalog/luxury"
            className="mt-1 block whitespace-nowrap rounded-[4px] px-2 py-2 text-[clamp(1rem,1.3vw,1.25rem)] leading-none tracking-[0.03em] text-[#141210] transition-colors hover:bg-black/[0.04]"
            style={{ fontFamily: "var(--font-display)" }}
            onClick={() => setIsOpen(false)}
          >
            Премиальная коллекция
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="h-[100svh] overflow-hidden bg-[var(--page-bg)] p-[clamp(0.5rem,1vw,1rem)]">
      <div className="mx-auto flex h-full max-w-[1920px] flex-col border border-black/70 bg-[var(--surface)]">
        <header className="pt-[clamp(0.4rem,0.85vw,0.6rem)]">
          <div className="flex items-center justify-between gap-4 px-[clamp(1.35rem,3.9vw,4.6875rem)]">
            <nav className="flex flex-nowrap items-baseline gap-[clamp(1.4rem,7.3vw,8.75rem)] overflow-visible">
              <NavigationItem label="Главная" />
              <CatalogDropdown />
              <NavigationItem label="О нас" />
            </nav>

            <div className="flex items-center">
              <NavigationItem label="Контакты" />
            </div>
          </div>

          <div className="mx-[clamp(0.5rem,0.8vw,0.9375rem)] mt-[clamp(0.85rem,1.4vw,1.25rem)] h-px bg-black/35" />
        </header>

        <section className="relative mx-[clamp(0.5rem,0.8vw,0.9375rem)] mb-[clamp(0.5rem,1.4vh,0.95rem)] mt-[clamp(1rem,4.15vh,2.8125rem)] flex-1 overflow-hidden">
          <Image
            src="/photo1.webp"
            alt="Паритет Косметик"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1900px"
            className="object-cover"
            style={{ objectPosition: "center center" }}
          />

          <div className="absolute left-[clamp(1.3rem,3.2vw,3.75rem)] top-[28.5%] z-10 max-w-[min(72vw,32rem)]">
            <h1
              className="text-[clamp(4.15rem,6.66vw,8rem)] leading-[0.92] tracking-[0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Паритет
              <br />
              Косметик
            </h1>

            <p
              className="mt-[clamp(0.9rem,2vw,2rem)] max-w-[min(80vw,39rem)] text-[clamp(1rem,1.67vw,2rem)] leading-none tracking-[0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Индивидуальный подход к каждой детали
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

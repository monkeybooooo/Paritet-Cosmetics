"use client";

import Link from "next/link";
import { useState } from "react";

export default function CatalogDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="m-0 cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 align-baseline text-[clamp(1.05rem,1.875vw,2.25rem)] leading-none tracking-[0.03em] text-[#141210]"
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

import Image from "next/image";

type CollectionType = "lifestyle" | "luxury";
type BadgeType = "certified" | "vegan" | "nordic";

const BADGE_META: Record<BadgeType, { src: string; alt: string; width: number; height: number }> = {
  certified: { src: "/certified.svg", alt: "Certified", width: 58, height: 58 },
  vegan: { src: "/vegancosmetic.svg", alt: "Vegan cosmetic", width: 78, height: 64 },
  nordic: { src: "/nordic.svg", alt: "Nordic Swan", width: 68, height: 68 },
};

function normalizeBrandName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().trim().replace(/^\d+-/, "");
}

function normalizeBrandForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9а-я]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyToken(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

function getLifestyleBadges(brandName: string, brandSlug?: string): BadgeType[] {
  const normalized = normalizeBrandName(brandName);
  const normalizedMatch = normalizeBrandForMatch(brandName);
  const normalizedSlug = normalizeSlug(brandSlug ?? "");

  if (
    hasAnyToken(normalizedSlug, ["naturals-remedies", "naturals-remedy", "natyrals-remedies"]) ||
    normalized.includes("naturals remedies") ||
    normalized.includes("naturals remedy") ||
    normalized.includes("натуралс ремедис")
  ) {
    return ["certified", "vegan"];
  }

  if (hasAnyToken(normalizedSlug, ["naturals"]) || normalized.includes("naturals") || normalized.includes("натуралс")) {
    return ["certified", "vegan"];
  }

  if (
    hasAnyToken(normalizedSlug, ["think-act-and-live-responsible", "think-act-live-responsible"]) ||
    normalized.includes("think act and live responsible") ||
    normalized.includes("think act & live responsible") ||
    normalized.includes("финк акт энд лив респонсибл") ||
    normalized.includes("финк, экт & лайв респонсибл") ||
    normalizedMatch.includes("финк экт лайв респонсибл") ||
    normalizedMatch.includes("think act and live responsible")
  ) {
    return ["certified", "nordic"];
  }

  if (
    hasAnyToken(normalizedSlug, [
      "aqua-senes",
      "aqua-sens",
      "be-different",
      "rrr",
      "relax-refresh-revive",
      "hydro-touch",
      "pure-herbs",
    ]) ||
    normalized.includes("aqua senes") ||
    normalized.includes("aqua sens") ||
    normalized.includes("аква сенс") ||
    normalized.includes("be different") ||
    normalized.includes("би дифферент") ||
    normalized.includes("hydro touch") ||
    normalized.includes("гидро тач") ||
    normalized.includes("pure herbs") ||
    normalized.includes("пьюр хербс") ||
    normalized.includes("rrr") ||
    normalized.includes("relax refresh revive") ||
    normalizedMatch.includes("аква сенс") ||
    normalizedMatch.includes("би дифферент") ||
    normalizedMatch.includes("гидро тач") ||
    normalizedMatch.includes("пьюр хербс") ||
    normalizedMatch.includes("relax refresh revive")
  ) {
    return ["certified"];
  }

  return [];
}

function getProductBadges(brandName: string, collection: CollectionType, brandSlug?: string): BadgeType[] {
  if (collection === "luxury") {
    return ["certified"];
  }

  return getLifestyleBadges(brandName, brandSlug);
}

export default function ProductBadges({
  brandName,
  collection,
  brandSlug,
  size = "normal",
}: {
  brandName: string;
  collection: CollectionType;
  brandSlug?: string;
  size?: "normal" | "large";
}) {
  const badges = getProductBadges(brandName, collection, brandSlug);
  if (badges.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      {badges.map((badge) => {
        const meta = BADGE_META[badge];
        return (
          <Image
            key={badge}
            src={meta.src}
            alt={meta.alt}
            width={meta.width}
            height={meta.height}
            className={
              size === "large"
                ? "h-auto w-[clamp(4.5rem,6.2vw,7.5rem)]"
                : "h-auto w-[clamp(2.25rem,3.1vw,3.75rem)]"
            }
          />
        );
      })}
    </div>
  );
}

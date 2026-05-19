function parseVolumeMl(volumeLabel: string): number {
  const parsed = Number(String(volumeLabel).replace(",", ".").match(/\d+(\.\d+)?/)?.[0] ?? "");
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function getCardBottleImageClass(volumeLabel: string): string {
  const volume = parseVolumeMl(volumeLabel);
  const base = "h-full w-full object-contain object-center";

  if (!Number.isFinite(volume)) return base;
  if (volume <= 50) return `${base} scale-[1.9] -translate-y-[18%]`;
  if (volume <= 100) return `${base} scale-[1.35] -translate-y-[8%]`;
  if (volume <= 300) return `${base} scale-[1.15] -translate-y-[4%]`;
  return `${base} scale-[1.02]`;
}

export function getDetailBottleImageClass(volumeLabel: string): string {
  const volume = parseVolumeMl(volumeLabel);
  const base = "h-full w-full object-contain object-center";

  if (!Number.isFinite(volume)) return base;
  if (volume <= 50) return `${base} scale-[2.2] -translate-y-[54%]`;
  if (volume <= 100) return `${base} scale-[1.65] -translate-y-[24%]`;
  if (volume <= 300) return `${base} scale-[1.3] -translate-y-[10%]`;
  return `${base} scale-[1.05]`;
}

export function getDetailBottleImageClassWithBrand(volumeLabel: string, brandName: string): string {
  const volume = parseVolumeMl(volumeLabel);
  const base = "h-full w-full object-contain object-center";
  const brand = brandName.trim().toLowerCase();
  const isPureHerbs = brand.includes("пьюр хербс") || brand.includes("pure herbs");

  if (!Number.isFinite(volume)) return base;

  // Pure Herbs packshots already occupy most of the frame; aggressive shifts clip the bottle.
  if (isPureHerbs) {
    if (volume <= 50) return `${base} scale-[1.45]`;
    if (volume <= 100) return `${base} scale-[1.25]`;
    if (volume <= 300) return `${base} scale-[1.1]`;
    return base;
  }

  return getDetailBottleImageClass(volumeLabel);
}

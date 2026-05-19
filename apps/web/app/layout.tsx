import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Oswald } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Paritet Cosmetic",
  description: "Сайт-визитка поставщика косметической продукции",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={oswald.variable}>{children}</body>
    </html>
  );
}

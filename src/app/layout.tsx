import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "DigiForge — фриланс-биржа с крипто-эскроу",
    template: "%s · DigiForge",
  },
  description:
    "Найдите фрилансера за минуты. Эскроу-сделки и оплата в USDT.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${syne.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-bg font-sans text-text antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
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

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://digiforge.io").replace(/\/$/, "");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
    { media: "(prefers-color-scheme: light)", color: "#14100d" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DigiForge — фриланс-биржа с крипто-эскроу",
    template: "%s · DigiForge",
  },
  description: "Найдите фрилансера за минуты. Эскроу-сделки и оплата в USDT.",
  applicationName: "DigiForge",
  keywords: [
    "фриланс",
    "эскроу",
    "USDT",
    "DigiForge",
    "удалённая работа",
    "биржа фриланса",
  ],
  authors: [{ name: "DigiForge" }],
  creator: "DigiForge",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-48.png"],
  },
  appleWebApp: {
    capable: true,
    title: "DigiForge",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "DigiForge",
    title: "DigiForge — фриланс с эскроу в USDT",
    description: "Найдите фрилансера за минуты. Безопасные сделки через сейф и оплата в USDT.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "DigiForge — freelance escrow in USDT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiForge — фриланс с эскроу в USDT",
    description: "Найдите фрилансера за минуты. Безопасные сделки через сейф и оплата в USDT.",
    images: ["/og.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${syne.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-bg font-sans text-text antialiased">{children}</body>
    </html>
  );
}

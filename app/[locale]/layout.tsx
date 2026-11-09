import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, isLocale, dir, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "fa");
  const siteName = isLocale(locale) && locale === "en" ? "Neshat Learning Center" : "دانش‌سرای نشاط";
  return {
    title: { template: `%s — ${siteName}`, default: dict.meta.title },
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typed = locale as Locale;

  return (
    <html
      lang={typed}
      dir={dir[typed]}
      className="h-full antialiased"
    >
      {/* the two fonts every page needs, fetched early (self-hosted, same origin) */}
      <head>
        <link rel="preload" href="/fonts/vazirmatn-arabic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-canvas text-ink-soft">{children}</body>
    </html>
  );
}

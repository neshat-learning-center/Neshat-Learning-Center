import Link from "next/link";
import { fontFa, fontEn } from "@/lib/fonts";
import "./globals.css";

/**
 * True root 404 — the only not-found.tsx Next.js actually uses for a URL
 * that never matched any route at all (typos, dead links). It sits outside
 * app/[locale], so there's no reliable way to know which locale the visitor
 * wanted; it defaults to Persian (the site's default everywhere else) and
 * offers a way into the English site too, self-contained with its own
 * <html>/<body> since no root layout wraps this file.
 */
export default function RootNotFound() {
  return (
    <html lang="fa" dir="rtl" className={`${fontFa.variable} ${fontEn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-canvas px-6 text-center">
        <p className="numeral text-[clamp(4rem,14vw,9rem)] font-extrabold leading-none text-ink/10">404</p>
        <h1 className="mt-4 text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[1.2] text-ink">
          اینجا چیزی پیدا نکردیم.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
          صفحه‌ای که دنبالش بودی جابه‌جا شده یا اصلاً وجود نداشته.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/fa"
            className="rounded-full bg-accent px-6 py-3 text-[0.95rem] font-medium text-slate transition-colors hover:bg-accent-deep"
          >
            بازگشت به صفحهٔ اصلی
          </Link>
          <Link
            href="/en"
            dir="ltr"
            className="text-[0.95rem] font-medium text-ink hover:text-accent-deep"
            style={{ fontFamily: "var(--font-en)" }}
          >
            View in English →
          </Link>
        </div>
      </body>
    </html>
  );
}

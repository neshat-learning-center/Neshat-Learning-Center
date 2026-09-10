"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

/** Swaps the locale segment of the current path, preserving the rest. */
export function LangToggle({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  const pathname = usePathname() ?? `/${locale}`;
  const other: Locale = locale === "fa" ? "en" : "fa";

  const segments = pathname.split("/");
  if (locales.includes(segments[1] as Locale)) {
    segments[1] = other;
  } else {
    segments.splice(1, 0, other);
  }
  const target = segments.join("/") || `/${other}`;

  return (
    <Link
      href={target}
      hrefLang={other}
      aria-label={other === "en" ? "Switch to English" : "تغییر به فارسی"}
      className={`inline-flex items-center text-[0.8rem] font-semibold tracking-wide text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      <span className={locale === "en" ? "text-accent-deep" : ""}>EN</span>
      <span className="mx-1.5 text-line-strong">/</span>
      <span
        className={locale === "fa" ? "text-accent-deep" : ""}
        style={{ fontFamily: "var(--font-fa)" }}
      >
        فا
      </span>
    </Link>
  );
}

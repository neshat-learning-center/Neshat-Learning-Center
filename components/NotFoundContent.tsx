"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * `not-found.tsx` boundaries aren't reliably given the [locale] route param
 * by Next.js, so the locale is read from the current URL instead — this
 * component is a client component specifically to have access to that.
 */
export function NotFoundContent() {
  const pathname = usePathname() ?? "/";
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dict = getDictionary(locale);
  const n = dict.notFound;

  return (
    <section className="section-x flex min-h-[60vh] items-center py-20">
      <div className="container-editorial text-center">
        <p className="numeral text-[clamp(4rem,14vw,9rem)] font-extrabold leading-none text-ink/10">
          {n.eyebrow}
        </p>
        <h1 className="mt-4 text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[1.2] text-ink">
          {n.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{n.lead}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href={href(locale)} variant="accent" arrow>
            {n.cta}
          </Button>
          <Button href={href(locale, "/courses")} variant="link" arrow>
            {n.ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  );
}

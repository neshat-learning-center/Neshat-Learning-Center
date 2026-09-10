import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { site } from "@/content/site";

/** Neshat brand mark — real logo artwork, used as-is across both locales. */
export function Logo({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  const name = pick(site.name, locale);
  return (
    <Image
      src="/brand/neshat-logo.png"
      alt={name}
      width={2028}
      height={851}
      priority
      className={`h-9 w-auto md:h-10 ${className}`}
    />
  );
}

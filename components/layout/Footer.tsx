import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { site } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { LangToggle } from "@/components/ui/LangToggle";
import { Button } from "@/components/ui/Button";

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links = [
    { label: dict.nav.courses, path: "/courses" },
    { label: dict.nav.teachers, path: "/teachers" },
    { label: dict.nav.books, path: "/books" },
    { label: dict.nav.classes, path: "/classes" },
    { label: dict.nav.journal, path: "/journal" },
    { label: dict.nav.about, path: "/about" },
  ];

  const socials = [
    site.instagram && { label: "Instagram", url: site.instagram },
    site.telegram && { label: "Telegram", url: site.telegram },
  ].filter(Boolean) as { label: string; url: string }[];

  const year = 1404; // Persian calendar year placeholder for the rights line; edit in CMS

  return (
    <footer className="relative overflow-hidden border-t-2 border-accent bg-sand">
      {/* soft decorative glow, echoes the hero's accent-tint blob */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 start-1/2 -z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-tint/50 blur-3xl"
      />

      {/* the whole footer is capped and centered — extra viewport width becomes
          calm framing margin instead of stretching the content apart */}
      <div className="container-editorial section-x relative">
        <div className="mx-auto max-w-4xl py-14 md:py-16">
          {/* statement */}
          <div>
            <Logo locale={locale} />
            <p className="mt-6 max-w-md text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-[1.3] text-ink">
              {dict.footer.tagline}
            </p>
          </div>

          <div className="hair my-10 md:my-12" />

          {/* meta grid — bounded by the same max-w-4xl, so columns stay close */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-x-12">
            {/* nav */}
            <div>
              <h3 className="eyebrow">{dict.footer.nav}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {links.map((l) => (
                  <li key={l.path}>
                    <Link
                      href={href(locale, l.path)}
                      className="text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* contact */}
            <div>
              <h3 className="eyebrow">{dict.footer.contact}</h3>
              <ul className="mt-6 flex flex-col divide-y divide-line-strong border-t border-line-strong">
                {site.email && (
                  <li className="flex flex-col gap-1.5 py-4">
                    <span className="text-xs text-muted">{dict.pages.form.email}</span>
                    <Button href={`mailto:${site.email}`} variant="link" dir="ltr" className="w-fit">
                      {site.email}
                    </Button>
                  </li>
                )}
                {site.phones && site.phones.length > 0 && (
                  <li className="flex flex-col gap-1.5 py-4">
                    <span className="text-xs text-muted">{dict.pages.form.phone}</span>
                    <div className="flex flex-col gap-1.5">
                      {site.phones.map((phone) => (
                        <Button key={phone} href={`tel:${phone}`} variant="link" dir="ltr" className="w-fit">
                          {phone}
                        </Button>
                      ))}
                    </div>
                  </li>
                )}
                <li className="flex flex-col gap-1.5 py-4">
                  <span className="text-xs text-muted">{dict.footer.addressLabel}</span>
                  {site.mapUrl ? (
                    <a
                      href={site.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit text-[0.95rem] font-medium text-ink transition-colors hover:text-accent-deep"
                    >
                      {site.address ? pick(site.address, locale) : pick(site.city, locale)}
                    </a>
                  ) : (
                    <span className="text-[0.95rem] font-medium text-ink">
                      {site.address ? pick(site.address, locale) : pick(site.city, locale)}
                    </span>
                  )}
                </li>
              </ul>
            </div>

            {/* social */}
            {socials.length > 0 && (
              <div>
                <h3 className="eyebrow">{dict.footer.social}</h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <Button
                        href={s.url}
                        variant="link"
                        arrow
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {s.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* bottom bar */}
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line-strong pt-6 text-sm text-muted sm:flex-row sm:items-center">
            <p>
              © {year} · {dict.footer.rights}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs">{dict.footer.langLabel}:</span>
              <LangToggle locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

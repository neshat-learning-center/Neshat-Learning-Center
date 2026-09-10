import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { site } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { LangToggle } from "@/components/ui/LangToggle";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/** A small hand-drawn flourish echoing the hero's yellow line — a quiet
 *  signature mark next to the closing statement, not a repeat of the hero. */
function FooterMark() {
  return (
    <svg
      viewBox="0 0 84 28"
      fill="none"
      aria-hidden="true"
      className="h-5 w-auto text-accent rtl:-scale-x-100"
    >
      <path
        d="M2 22c8-14 16-14 22-4 5 7 11 7 15-1 4-8 12-10 20-4 5 3.5 12 3.5 23-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links = [
    { label: dict.nav.courses, path: "/courses" },
    { label: dict.nav.classes, path: "/classes" },
    { label: dict.nav.books, path: "/books" },
    { label: dict.nav.teachers, path: "/teachers" },
    { label: dict.nav.journal, path: "/journal" },
    { label: dict.nav.about, path: "/about" },
  ];

  const socials = [
    site.instagram && { label: "Instagram", url: site.instagram },
    site.telegram && { label: "Telegram", url: site.telegram },
  ].filter(Boolean) as { label: string; url: string }[];

  const year = 1404; // Persian calendar year placeholder for the rights line; edit in CMS

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-editorial section-x">
        <div className="mx-auto max-w-5xl">
          {/* closing statement — the website's last word, echoing the hero */}
          <div className="py-14 md:py-20">
            <Reveal>
              <Logo locale={locale} />
              <p className="eyebrow mt-7">{dict.hero.kicker}</p>
              <h2 className="mt-3 max-w-2xl text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[1.15] text-ink">
                {dict.footer.tagline}
              </h2>
              <FooterMark />
            </Reveal>
          </div>

          <div className="hair" />

          {/* nav (start) + contact/social (end) — a loose editorial pair,
              not a rigid multi-column grid */}
          <div className="flex flex-col gap-10 py-10 md:flex-row md:items-start md:justify-between md:gap-16 md:py-14">
            <Reveal delay={80}>
              <nav className="flex flex-wrap gap-x-7 gap-y-3 md:max-w-xs">
                {links.map((l) => (
                  <Link
                    key={l.path}
                    href={href(locale, l.path)}
                    className="group relative text-ink-soft transition-colors hover:text-ink"
                  >
                    {l.label}
                    <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-x-100" />
                  </Link>
                ))}
              </nav>
            </Reveal>

            <Reveal delay={160} className="flex flex-col gap-7 md:items-end md:text-end">
              <div className="flex flex-wrap gap-x-10 gap-y-5 md:justify-end">
                {site.email && (
                  <div>
                    <p className="text-xs text-muted">{dict.pages.form.email}</p>
                    <Button href={`mailto:${site.email}`} variant="link" dir="ltr" className="mt-1">
                      {site.email}
                    </Button>
                  </div>
                )}
                {site.phones && site.phones.length > 0 && (
                  <div>
                    <p className="text-xs text-muted">{dict.pages.form.phone}</p>
                    <div dir="ltr" className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {site.phones.map((phone) => (
                        <Button key={phone} href={`tel:${phone}`} variant="link">
                          {phone}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted">{dict.footer.addressLabel}</p>
                  {site.mapUrl ? (
                    <a
                      href={site.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block font-medium text-ink transition-colors hover:text-accent-deep"
                    >
                      {site.address ? pick(site.address, locale) : pick(site.city, locale)}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium text-ink">
                      {site.address ? pick(site.address, locale) : pick(site.city, locale)}
                    </p>
                  )}
                </div>
              </div>

              {socials.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">{dict.footer.followUs}</span>
                  {socials.map((s) => (
                    <Button key={s.label} href={s.url} variant="link" arrow target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </Button>
                  ))}
                </div>
              )}
            </Reveal>
          </div>

          <div className="hair" />

          {/* bottom bar — one quiet closing line */}
          <div className="flex flex-col items-start justify-between gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center">
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { LangToggle } from "@/components/ui/LangToggle";
import { Button } from "@/components/ui/Button";

export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = [
    { label: dict.nav.courses, path: "/courses" },
    { label: dict.nav.teachers, path: "/teachers" },
    { label: dict.nav.books, path: "/books" },
    { label: dict.nav.classes, path: "/classes" },
    { label: dict.nav.journal, path: "/journal" },
    { label: dict.nav.about, path: "/about" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-[var(--ease-out-soft)] ${
        scrolled
          ? "border-b border-line bg-canvas/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`container-editorial section-x flex items-center justify-between transition-all duration-500 ease-[var(--ease-out-soft)] ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <Link href={href(locale)} aria-label={dict.nav.home} className="shrink-0">
          <Logo locale={locale} />
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.path}
              href={href(locale, item.path)}
              className="group relative py-1 text-[0.95rem] text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LangToggle locale={locale} className="hidden sm:inline-flex" />
          <Button
            href={href(locale, "/login")}
            variant="accent"
            className="hidden px-5 py-2.5 text-[0.9rem] sm:inline-flex"
          >
            {dict.nav.account}
          </Button>

          {/* mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={dict.nav.menu}
            className="flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <span className="relative block h-3 w-6">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-ink" />
              <span className="absolute inset-x-0 top-[5px] h-0.5 w-4 bg-accent" />
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />
            </span>
          </button>
        </div>
      </div>

      {/* mobile overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate/30 transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col bg-canvas px-7 pb-10 pt-6 shadow-2xl transition-transform duration-500 ease-[var(--ease-out-soft)] ${
            open ? "translate-x-0" : "rtl:-translate-x-full ltr:translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo locale={locale} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.nav.close}
              className="flex h-10 w-10 items-center justify-center text-ink"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M5 5l12 12M17 5L5 17"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav className="mt-12 flex flex-col">
            {nav.map((item, i) => (
              <Link
                key={item.path}
                href={href(locale, item.path)}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 border-b border-line py-4 text-2xl font-bold text-ink"
              >
                <span className="numeral text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex items-center justify-between pt-8">
            <LangToggle locale={locale} />
            <Button
              href={href(locale, "/login")}
              variant="accent"
              onClick={() => setOpen(false)}
              arrow
            >
              {dict.nav.account}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

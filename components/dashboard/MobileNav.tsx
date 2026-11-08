"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface NavGroup {
  heading?: string;
  items: { label: string; href: string; exact?: boolean }[];
}

/** Phone/tablet admin menu: a button that opens a full-height drawer with every section, grouped. */
export function MobileNav({
  groups, labels, siteHref, siteLabel, signOutAction, signOutLabel,
}: {
  groups: NavGroup[];
  labels: { open: string; close: string };
  siteHref: string;
  siteLabel: string;
  signOutAction: (formData: FormData) => void | Promise<void>;
  signOutLabel: string;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const active = (h: string, exact?: boolean) => (exact ? pathname === h : pathname === h || pathname.startsWith(h + "/"));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button type="button" aria-label={labels.close} onClick={() => setOpen(false)} className="absolute inset-0 bg-slate/50" />
          <div className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-canvas shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-sm font-bold text-ink">{labels.open}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {groups.map((g, i) => (
                <div key={i} className={i > 0 ? "mt-4 border-t border-line pt-3" : ""}>
                  {g.heading && <p className="px-3 pb-1 text-xs font-medium text-muted">{g.heading}</p>}
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-3 text-[0.95rem] transition-colors ${
                        active(it.href, it.exact) ? "bg-accent-wash font-bold text-ink" : "text-ink-soft hover:bg-sand hover:text-ink"
                      }`}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="flex flex-col gap-1 border-t border-line p-3">
              <Link href={siteHref} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-ink-soft hover:bg-sand hover:text-ink">
                {siteLabel}
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="w-full rounded-lg px-3 py-3 text-start text-sm text-ink-soft hover:bg-sand hover:text-ink">
                  {signOutLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

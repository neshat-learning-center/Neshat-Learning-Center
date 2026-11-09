"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n/config";
import { dir } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";

export interface LightboxItem {
  url: string;
  caption?: string | null;
}

/** Full-screen photo viewer: keyboard (←/→/Esc, direction-aware), thumbnails, locks page scroll. */
function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={flip ? "-scale-x-100" : ""}><path d="M13.5 5L7.5 11l6 6" /></svg>
  );
}

export function Lightbox({
  items, index, onIndex, onClose, locale, title, meta, summary, href, linkLabel,
}: {
  items: LightboxItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; locale: Locale;
  title?: string; meta?: string; summary?: string; href?: string; linkLabel?: string;
}) {
  const t = makeET(locale);
  const rtl = dir[locale] === "rtl";
  const closeRef = useRef<HTMLButtonElement>(null);
  const n = items.length;
  const go = useCallback((d: number) => onIndex(((index + d) % n + n) % n), [index, n, onIndex]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // in RTL the "next" photo is to the left
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose, rtl]);

  const cur = items[index];
  const nf = (x: number) => x.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
  return createPortal(
    <div className="ev-fade fixed inset-0 z-[70] flex flex-col bg-slate/95 text-canvas" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-start justify-between gap-4 px-5 py-4 md:px-8">
        <div className="min-w-0">
          {title && <p className="ev-display truncate text-lg md:text-2xl">{title}</p>}
          {meta && <p className="mt-0.5 text-sm text-canvas/60">{meta}</p>}
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={t("close")} className="flex h-11 w-11 shrink-0 items-center justify-center border border-canvas/30 text-canvas transition-colors hover:bg-canvas hover:text-slate">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 md:px-20" onClick={onClose}>
        {n > 1 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className="absolute start-2 z-10 flex h-12 w-12 items-center justify-center border border-canvas/30 bg-slate/60 transition-colors hover:bg-canvas hover:text-slate md:start-6">
            <Arrow flip={rtl} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={cur.url} src={cur.url} alt={cur.caption ?? title ?? ""} onClick={(e) => e.stopPropagation()} className="ev-pop max-h-full max-w-full object-contain" />
        {n > 1 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className="absolute end-2 z-10 flex h-12 w-12 items-center justify-center border border-canvas/30 bg-slate/60 transition-colors hover:bg-canvas hover:text-slate md:end-6">
            <Arrow flip={!rtl} />
          </button>
        )}
      </div>

      <div className="px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-canvas/75">{cur.caption || summary}</p>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-canvas/60" dir="ltr">{nf(index + 1)} / {nf(n)}</span>
            {href && linkLabel && <a href={href} className="border-b border-accent pb-0.5 text-accent hover:text-canvas">{linkLabel} →</a>}
          </div>
        </div>
        {n > 1 && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" dir="ltr">
            {items.map((it, i) => (
              <button key={it.url + i} type="button" onClick={() => onIndex(i)} aria-label={`${i + 1}`} className={`h-14 w-20 shrink-0 overflow-hidden border-2 transition-opacity ${i === index ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

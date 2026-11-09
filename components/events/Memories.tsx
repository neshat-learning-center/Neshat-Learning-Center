"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { makeET } from "@/lib/events/labels";
import { Reveal } from "@/components/ui/Reveal";
import { Lightbox, type LightboxItem } from "./Lightbox";
import { ArtCover, ArrowIcon } from "./shared";

export interface Memory {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  summary: string;
  images: LightboxItem[]; // cover first, then gallery
}

const ASPECTS = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]", "aspect-[4/5]", "aspect-[3/4]", "aspect-square"];

/** "Moments We've Shared": a ragged-edge photo collage of past events, opening into a full-screen viewer. */
export function Memories({ memories, locale }: { memories: Memory[]; locale: Locale }) {
  const t = makeET(locale);
  const [open, setOpen] = useState<{ m: Memory; i: number } | null>(null);
  const nf = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
  const photos = memories.reduce((a, m) => a + m.images.length, 0);

  return (
    <section id="memories" className="section-x scroll-mt-32 pb-24 pt-20 md:pb-32 md:pt-28">
      <div className="container-editorial">
        <Reveal>
          <p className="eyebrow flex items-center gap-3"><span className="inline-block h-px w-8 bg-accent" />{t("navMemories")}</p>
          <h2 className="ev-display mt-4 max-w-3xl text-[clamp(2.2rem,5.4vw,5rem)] leading-[1.02] text-ink">{t("secMemories")}</h2>
          <p className="mt-3 text-lg text-ink-soft">{t("secMemoriesLead")}</p>
        </Reveal>

        <div className="mt-14 columns-2 gap-x-4 md:columns-3 md:gap-x-7">
          {/* the opening tile: a number, not a photo */}
          <Reveal className="mb-4 break-inside-avoid md:mb-7">
            <div className="relative flex aspect-[4/5] flex-col justify-between overflow-hidden bg-accent p-5 text-slate md:p-8">
              <span aria-hidden className="absolute -bottom-16 -end-16 h-48 w-48 rounded-full border border-slate/25" />
              <p className="eyebrow !text-slate/70">{t("navMemories")}</p>
              <div>
                <p className="ev-display text-[clamp(4rem,10vw,8rem)] leading-[0.85]">{nf(memories.length)}</p>
                <p className="mt-3 text-sm font-semibold">{t("events")} · {nf(photos)} {t("photos")}</p>
              </div>
            </div>
          </Reveal>

          {memories.map((m, idx) => {
            const first = m.images[0];
            const many = m.images.length > 0;
            const body = (
              <>
                <div className={`ev-img relative w-full ${ASPECTS[idx % ASPECTS.length]}`}>
                  {first ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.url} alt={m.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <ArtCover seed={m.slug} />
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-slate/95 px-4 py-3 text-sm font-bold text-canvas transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
                    {t("viewMemories")}<ArrowIcon />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h3 className="ev-display text-lg leading-tight text-ink md:text-xl">{m.title}</h3>
                  <span className="shrink-0 text-xs font-semibold text-muted">{m.dateLabel}</span>
                </div>
                {m.summary && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{m.summary}</p>}
                {many && m.images.length > 1 && <p className="mt-2 text-xs font-bold text-accent-deep">{nf(m.images.length)} {t("photos")}</p>}
              </>
            );
            return (
              <Reveal key={m.id} delay={(idx % 3) * 90} className="mb-9 break-inside-avoid md:mb-12">
                {many ? (
                  <button type="button" onClick={() => setOpen({ m, i: 0 })} aria-label={`${t("viewMemories")}: ${m.title}`} className="group block w-full text-start">{body}</button>
                ) : (
                  <Link href={href(locale, `/events/${m.slug}`)} className="group block">{body}</Link>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>

      {open && (
        <Lightbox
          items={open.m.images} index={open.i} onIndex={(i) => setOpen({ m: open.m, i })} onClose={() => setOpen(null)} locale={locale}
          title={open.m.title} meta={open.m.dateLabel} summary={open.m.summary} href={href(locale, `/events/${open.m.slug}`)} linkLabel={t("viewDetails")}
        />
      )}
    </section>
  );
}

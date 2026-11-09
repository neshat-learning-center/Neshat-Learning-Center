"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";
import { Lightbox, type LightboxItem } from "./Lightbox";

const ASPECTS = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]", "aspect-[4/5]"];

/** A mosaic of mixed crops that opens into the full-screen viewer. */
export function EventGallery({ images, title, meta, locale }: { images: LightboxItem[]; title: string; meta: string; locale: Locale }) {
  const t = makeET(locale);
  const [i, setI] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 md:gap-4">
        {images.map((img, n) => (
          <button key={img.url + n} type="button" onClick={() => setI(n)} aria-label={`${t("gallery")} ${n + 1}`}
            className={`ev-img group relative mb-3 block w-full break-inside-avoid md:mb-4 ${ASPECTS[n % ASPECTS.length]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-slate/0 transition-colors duration-500 group-hover:bg-slate/15" />
          </button>
        ))}
      </div>
      {i !== null && <Lightbox items={images} index={i} onIndex={setI} onClose={() => setI(null)} locale={locale} title={title} meta={meta} />}
    </>
  );
}

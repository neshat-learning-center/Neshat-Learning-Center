"use client";

import { useEffect, useState } from "react";
import { dir, type Locale } from "@/lib/i18n/config";
import { countdown } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";

/**
 * Counts down to a REAL instant. The first paint uses the server's clock (so
 * server and client markup match); from then on it ticks from the visitor's
 * own clock every second. Digits animate only when they change.
 */
export function Countdown({
  target, nowIso, locale, tone = "ink", size = "lg", doneLabel,
}: { target: string; nowIso: string; locale: Locale; tone?: "ink" | "canvas"; size?: "sm" | "md" | "lg"; doneLabel?: string }) {
  const t = makeET(locale);
  const [now, setNow] = useState(() => Date.parse(nowIso));
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const kick = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      clearInterval(id);
      clearTimeout(kick);
    };
  }, []);

  const c = countdown(target, now);
  const nf = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { minimumIntegerDigits: 2, useGrouping: false });
  const units = [
    { k: "days", v: c.days }, { k: "hours", v: c.hours }, { k: "minutes", v: c.minutes }, { k: "seconds", v: c.seconds },
  ] as const;
  const num = size === "lg" ? "text-[clamp(2.6rem,9vw,7.5rem)]" : size === "md" ? "text-4xl md:text-5xl" : "text-xl";
  const label = size === "sm" ? "text-[0.65rem]" : "text-xs md:text-sm";
  const text = tone === "canvas" ? "text-canvas" : "text-ink";
  const sub = tone === "canvas" ? "text-canvas/60" : "text-muted";

  if (c.done) return <p className={`ev-display text-2xl ${text}`}>{doneLabel ?? t("live")}</p>;

  return (
    <div className="flex items-end gap-3 md:gap-6" dir={dir[locale]} role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.k} className="flex items-end gap-3 md:gap-6">
          <div className="min-w-0 text-center">
            <div className="overflow-hidden">
              <div key={u.v} className={`ev-display ev-tick tabular-nums leading-[0.9] ${num} ${i === 3 ? "text-accent" : text}`}>{nf(u.v)}</div>
            </div>
            <div className={`mt-2 font-medium tracking-wider ${locale === "en" ? "uppercase" : ""} ${label} ${sub}`}>{t(u.k)}</div>
          </div>
          {i < 3 && <span className={`pb-[1.1em] ${size === "sm" ? "text-lg" : "text-3xl md:text-5xl"} font-light ${sub}`} aria-hidden>:</span>}
        </div>
      ))}
    </div>
  );
}

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { EventItem } from "@/lib/events/types";
import { availability, seatsLeft, isLimited, type Availability } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";

export const pickL = (v: { fa: string; en: string } | null | undefined, l: Locale) => (v ? v[l] || v[l === "fa" ? "en" : "fa"] : "");
/** "18:30" → "۱۸:۳۰" for Persian, unchanged for English */
export const localDigits = (s: string, l: Locale) => (l === "fa" ? s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : s);
export const eventTitle = (e: Pick<EventItem, "title">, l: Locale) => pickL(e.title, l);

/** deterministic 0..n-1 from a string, so an event always gets the same artwork */
export function hashIndex(seed: string, n: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % n;
}

/**
 * Art-directed stand-in for an event without a photo: bold geometric
 * compositions in the Neshat palette (never a grey box). 6 variants.
 */
export function ArtCover({ seed, className = "" }: { seed: string; className?: string }) {
  const v = hashIndex(seed, 6);
  const common = { viewBox: "0 0 400 500", preserveAspectRatio: "xMidYMid slice", className: `h-full w-full ${className}`, "aria-hidden": true } as const;
  const Y = "var(--color-accent)", YT = "var(--color-accent-tint)", INK = "var(--color-slate)", SAND = "var(--color-sand)", SD = "var(--color-sand-deep)", CAN = "var(--color-canvas)";
  switch (v) {
    case 0:
      return (
        <svg {...common}><rect width="400" height="500" fill={SAND} /><path d="M60 500V230a140 140 0 0 1 280 0v270z" fill={Y} /><circle cx="300" cy="120" r="52" fill={INK} /><path d="M0 430h400" stroke={INK} strokeWidth="2" /><path d="M0 446h400" stroke={INK} strokeWidth="1" opacity=".4" /></svg>
      );
    case 1:
      return (
        <svg {...common}><rect width="400" height="500" fill={Y} />{Array.from({ length: 6 }).map((_, i) => <circle key={i} cx={70 + (i % 3) * 130} cy={110 + Math.floor(i / 3) * 190} r="56" fill={i % 2 ? CAN : INK} />)}<rect y="440" width="400" height="60" fill={INK} /></svg>
      );
    case 2:
      return (
        <svg {...common}><rect width="400" height="500" fill={INK} />{[210, 160, 110, 60].map((r, i) => <circle key={r} cx="200" cy="250" r={r} fill="none" stroke={Y} strokeWidth={i === 3 ? 0 : 2} />)}<circle cx="200" cy="250" r="60" fill={Y} /><path d="M0 500l400-120v120z" fill={CAN} opacity=".12" /></svg>
      );
    case 3:
      return (
        <svg {...common}><rect width="400" height="500" fill={CAN} />{Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 46} y="0" width="22" height="500" fill={i % 2 ? SD : "transparent"} />)}<circle cx="130" cy="330" r="150" fill={Y} /><rect x="210" y="60" width="130" height="130" fill={INK} /></svg>
      );
    case 4:
      return (
        <svg {...common}><rect width="400" height="500" fill={YT} /><path d="M0 0h400v260C300 330 100 330 0 260z" fill={Y} /><circle cx="200" cy="330" r="86" fill={INK} /><circle cx="200" cy="330" r="42" fill={CAN} /></svg>
      );
    default:
      return (
        <svg {...common}><rect width="400" height="500" fill={SD} /><rect x="40" y="60" width="200" height="380" rx="100" fill={INK} /><rect x="160" y="110" width="200" height="330" rx="100" fill={Y} /><circle cx="300" cy="90" r="22" fill={INK} /></svg>
      );
  }
}

/** photo when there is one, designed artwork when there isn't */
export function EventImage({ ev, className = "", alt, priority = false }: { ev: Pick<EventItem, "cover" | "slug" | "title">; className?: string; alt?: string; priority?: boolean }) {
  return (
    <div className={`ev-img relative bg-sand ${className}`}>
      {ev.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.cover} alt={alt ?? ""} loading={priority ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ArtCover seed={ev.slug} />
      )}
    </div>
  );
}

const STATE_TONE: Record<Availability, string> = {
  open: "bg-accent text-slate",
  waitlist: "border border-ink text-ink",
  full: "bg-ink text-canvas",
  closed: "border border-line-strong text-muted",
  cancelled: "bg-red-600 text-white",
  past: "border border-line-strong text-muted",
};

export function AvailabilityBadge({ ev, l, now, className = "" }: { ev: EventItem; l: Locale; now: number; className?: string }) {
  const t = makeET(l);
  const a = availability(ev, now);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-semibold ${STATE_TONE[a]} ${className}`}>
      {a === "open" && <span className="h-1.5 w-1.5 rounded-full bg-slate" />}
      {t(`av_${a}` as "av_open")}
    </span>
  );
}

/** a row of dots: filled = taken. Falls back to a bar for large capacities. */
export function SeatMeter({ ev, l, tone = "light" }: { ev: Pick<EventItem, "capacity" | "taken">; l: Locale; tone?: "light" | "dark" }) {
  const t = makeET(l);
  const nf = (n: number) => n.toLocaleString(l === "fa" ? "fa-IR" : "en-US");
  const left = seatsLeft(ev);
  const dark = tone === "dark";
  if (ev.capacity == null || left == null) return <span className={`text-sm ${dark ? "text-canvas/70" : "text-ink-soft"}`}>{t("unlimited")}</span>;
  const pct = Math.min(100, Math.round((ev.taken / ev.capacity) * 100));
  const limited = isLimited(ev);
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={dark ? "text-canvas" : "text-ink"}>
          {left === 0 ? t("av_full") : limited ? <><b className="text-accent-deep">{t("seatsLeftOnly")} {nf(left)}</b> {t("seatsLeft")}</> : <><b>{nf(left)}</b> {t("seatsLeft")}</>}
        </span>
        <span className={`text-xs ${dark ? "text-canvas/60" : "text-muted"}`}>{nf(ev.taken)}/{nf(ev.capacity)}</span>
      </div>
      <div className={`mt-2 h-1.5 w-full overflow-hidden ${dark ? "bg-canvas/15" : "bg-sand-deep"}`} dir="ltr">
        <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** oversized day numeral + month — the date as a graphic element */
export function DateBlock({ day, month, weekday, tone = "ink", size = "lg" }: { day: string; month: string; weekday?: string; tone?: "ink" | "canvas"; size?: "md" | "lg" | "xl" }) {
  const sz = size === "xl" ? "text-[clamp(5rem,12vw,10rem)]" : size === "lg" ? "text-[clamp(3.5rem,8vw,6rem)]" : "text-5xl";
  return (
    <div className={`leading-none ${tone === "canvas" ? "text-canvas" : "text-ink"}`}>
      <div className={`ev-display ${sz} leading-[0.85] tracking-tighter`}>{day}</div>
      <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <span className="h-px w-6 bg-accent" />
        {month}
        {weekday && <span className={tone === "canvas" ? "text-canvas/60" : "text-muted"}>· {weekday}</span>}
      </div>
    </div>
  );
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span className="inline-block h-px w-8 bg-accent" />
      {children}
    </p>
  );
}

export const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`rtl:-scale-x-100 ${className}`} aria-hidden>
    <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

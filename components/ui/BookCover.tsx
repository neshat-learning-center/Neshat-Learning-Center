import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { Book } from "@/content/types";

function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/** Designed placeholder book cover; uses a real cover image when provided. */
export function BookCover({ book, locale }: { book: Book; locale: Locale }) {
  const light = isLight(book.spine[0]);
  const ink = light ? "text-slate" : "text-canvas";
  const sub = light ? "text-slate/60" : "text-canvas/55";
  return (
    <div
      className="relative aspect-[2/3] w-full overflow-hidden rounded-[3px] shadow-[0_10px_30px_-12px_rgba(38,37,40,0.35)] transition-all duration-500 ease-[var(--ease-out-soft)] group-hover:shadow-[0_26px_50px_-16px_rgba(38,37,40,0.5)]"
      style={{ backgroundImage: `linear-gradient(150deg, ${book.spine[0]}, ${book.spine[1]})` }}
    >
      {book.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.cover} alt={pick(book.title, locale)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col justify-between p-4">
          <span className="absolute inset-y-0 start-2 w-px bg-white/15" />
          <span className={`text-[0.62rem] uppercase tracking-widest ${sub}`}>{pick(book.kind, locale)}</span>
          <div>
            <h3 className={`text-lg font-extrabold leading-tight ${ink}`}>{pick(book.title, locale)}</h3>
            <span className={`mt-2 inline-block text-xs ${sub}`}>{pick(book.level, locale)}</span>
          </div>
          <span className="h-1 w-8 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

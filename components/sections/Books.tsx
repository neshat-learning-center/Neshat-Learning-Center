import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Book } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/ui/BookCover";

export function Books({
  dict,
  locale,
  books,
}: {
  dict: Dictionary;
  locale: Locale;
  books: Book[];
}) {
  return (
    <section id="books" className="bg-sand py-20 md:py-28">
      <div className="container-editorial section-x">
        <SectionIntro
          label={dict.books.label}
          title={dict.books.title}
          lead={dict.books.lead}
          action={
            <Button href={href(locale, "/books")} variant="ghost" arrow>
              {dict.books.viewAll}
            </Button>
          }
        />

        {/* overlapping shelf — desktop */}
        <Reveal className="mt-16 hidden md:block">
          <div className="flex items-end justify-center ps-6">
            {books.map((book, i) => (
              <Link
                key={book.slug}
                href={href(locale, `/books/${book.slug}`)}
                className="group relative -ms-6 block w-[15%] min-w-[9rem] transition-transform duration-500 ease-[var(--ease-out-soft)] first:ms-0 hover:z-10 hover:-translate-y-4"
                style={{ transform: `rotate(${(i - (books.length - 1) / 2) * 1.5}deg)`, zIndex: i }}
              >
                <BookCover book={book} locale={locale} />
                <div className="absolute inset-x-0 -bottom-8 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-sm font-medium text-ink">{pick(book.title, locale)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* horizontal rail — mobile */}
        <Reveal className="mt-10 md:hidden">
          <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
            {books.map((book) => (
              <Link key={book.slug} href={href(locale, `/books/${book.slug}`)} className="group w-40 shrink-0">
                <BookCover book={book} locale={locale} />
                <p className="mt-3 text-sm font-medium text-ink">{pick(book.title, locale)}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

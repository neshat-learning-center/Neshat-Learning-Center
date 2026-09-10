import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBooks, languageLabel } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { BookCover } from "@/components/ui/BookCover";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.booksTitle, description: dict.pages.booksLead };
}

export default async function BooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const books = await getBooks();

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.booksTitle }}
        label={dict.books.label}
        title={dict.pages.booksTitle}
        lead={dict.pages.booksLead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-10">
          {books.map((book, i) => (
            <Reveal key={book.slug} delay={(i % 4) * 70}>
              <Link href={href(l, `/books/${book.slug}`)} className="group block">
                <div className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-2">
                  <BookCover book={book} locale={l} />
                </div>
                <h3 className="mt-4 font-bold text-ink">{pick(book.title, l)}</h3>
                <p className="mt-1 text-sm text-muted">
                  {languageLabel(book.language, l)} · {pick(book.level, l)}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

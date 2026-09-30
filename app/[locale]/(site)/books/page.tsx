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
        <div className="container-editorial grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {books.map((book, i) => (
            <Reveal key={book.slug} delay={(i % 4) * 70}>
              <Link href={href(l, `/books/${book.slug}`)} className="group block">
                <div className="rounded-sm bg-sand/50 p-4 transition-colors duration-300 group-hover:bg-sand">
                  <div className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-2">
                    <BookCover book={book} locale={l} />
                  </div>
                </div>
                <h3 className="mt-4 font-bold text-ink transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {pick(book.title, l)}
                </h3>
                <span className="mt-2 inline-block w-fit rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                  {languageLabel(book.language, l)} · {pick(book.level, l)}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

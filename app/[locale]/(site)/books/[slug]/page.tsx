import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { books as seedBooks } from "@/content/books";
import { getBookBySlug, languageLabel } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/ui/BookCover";

export function generateStaticParams() {
  return locales.flatMap((locale) => seedBooks.map((b) => ({ locale, slug: b.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const book = await getBookBySlug(slug);
  if (!book) return {};
  return {
    title: pick(book.title, locale),
    description: book.description ? pick(book.description, locale) : pick(book.kind, locale),
  };
}

export default async function BookDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const info = [
    { label: dict.courses.language, value: languageLabel(book.language, l) },
    { label: dict.books.level, value: pick(book.level, l) },
    { label: dict.pages.aboutBook, value: pick(book.kind, l) },
  ];

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.booksTitle, href: href(l, "/books") }}
        label={pick(book.kind, l)}
        title={pick(book.title, l)}
      />

      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="mx-auto w-full max-w-xs lg:mx-0">
            <BookCover book={book} locale={l} />
          </Reveal>

          <Reveal delay={120}>
            <h2 className="text-2xl font-extrabold text-ink">{dict.pages.aboutBook}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-loose text-ink-soft">
              {book.description ? pick(book.description, l) : pick(book.kind, l)}
            </p>

            <dl className="mt-10 flex max-w-md flex-col divide-y divide-line border-y border-line">
              {info.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            {book.fileUrl && (
              <div className="mt-8">
                <Button href={book.fileUrl} variant="accent" arrow>
                  {dict.pages.download}
                </Button>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBookById } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
import { BookForm } from "@/components/admin/BookForm";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const book = await getBookById(id);
  if (!book) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{book.title?.fa ?? book.title?.en}</h1>
      <div className="mt-8">
        <BookForm dict={dict} locale={l} book={book} />
      </div>
    </div>
  );
}

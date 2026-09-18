import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBookById } from "@/lib/data/admin";
import { deleteBook } from "@/lib/actions/admin/books";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
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
  const a = dict.admin;

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const book = await getBookById(id);
  if (!book) notFound();

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={book.title?.fa ?? book.title?.en}
        deleteAction={deleteBook.bind(null, l, book.id)}
        deleteLabel={a.delete}
        confirmText={a.confirmDelete}
      />
      <div className="mt-8">
        <BookForm dict={dict} locale={l} book={book} />
      </div>
    </div>
  );
}

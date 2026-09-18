import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPostById } from "@/lib/data/admin";
import { deletePost } from "@/lib/actions/admin/posts";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
import { PostForm } from "@/components/admin/PostForm";

export default async function EditPostPage({
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

  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={post.title?.fa ?? post.title?.en}
        deleteAction={deletePost.bind(null, l, post.id)}
        deleteLabel={a.delete}
        confirmText={a.confirmDelete}
      />
      <div className="mt-8">
        <PostForm dict={dict} locale={l} post={post} />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPostById } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
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

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{post.title?.fa ?? post.title?.en}</h1>
      <div className="mt-8">
        <PostForm dict={dict} locale={l} post={post} />
      </div>
    </div>
  );
}

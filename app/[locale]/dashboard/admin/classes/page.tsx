import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listClassesAdmin } from "@/lib/data/admin";
import { getClassCounts } from "@/lib/data/links";
import { lt } from "@/lib/join/links-labels";
import { href } from "@/lib/utils";
import { deleteClass } from "@/lib/actions/admin/classes";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);
  const a = dict.admin;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{a.manageClasses}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const [classes, counts] = await Promise.all([listClassesAdmin(), getClassCounts()]);
  const t = lt(l);
  const statusLabel: Record<string, string> = {
    upcoming: a.statusUpcoming,
    active: a.statusActive,
    finished: a.statusFinished,
    cancelled: a.statusCancelled,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{a.manageClasses}</h1>
        <Link
          href={href(l, "/dashboard/admin/classes/new")}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep"
        >
          {a.add}
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-canvas">
        {classes.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{dict.dash.name}</th>
                <th className="px-5 py-3 text-start font-medium">{a.teacher}</th>
                <th className="px-5 py-3 text-start font-medium">{a.status}</th>
                <th className="px-5 py-3 text-start font-medium">{t("students")}</th>
                <th className="px-5 py-3 text-start font-medium">{a.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium text-ink">
                    <Link href={href(l, `/dashboard/admin/classes/${c.id}/edit`)} className="hover:text-accent-deep hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{c.teacherName ?? a.noTeacher}</td>
                  <td className="px-5 py-3 text-ink-soft">{statusLabel[c.status] ?? c.status}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    <span className="numeral">
                      {counts.enrolled[c.id] ?? 0}
                      {c.capacity != null ? ` / ${c.capacity}` : ""}
                    </span>
                    {(counts.pending[c.id] ?? 0) > 0 && (
                      <Link
                        href={href(l, `/dashboard/admin/classes/${c.id}/edit`)}
                        className="ms-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-slate"
                        title={t("pendingRequests")}
                      >
                        +{counts.pending[c.id]}
                      </Link>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={href(l, `/dashboard/admin/classes/${c.id}/edit`)}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {a.edit}
                      </Link>
                      <ConfirmForm
                        action={deleteClass.bind(null, l, c.id, undefined)}
                        confirmText={a.confirmDelete}
                        cancelLabel={a.cancel}
                        confirmLabel={a.delete}
                      >
                        <button type="submit" className="text-red-600 hover:underline">
                          {a.delete}
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

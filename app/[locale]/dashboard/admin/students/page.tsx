import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import { listStudents, getUserEmails } from "@/lib/data/admin";
import { href } from "@/lib/utils";
import { deleteStudent } from "@/lib/actions/admin/students";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminStudentsPage({
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
        <h1 className="text-2xl font-extrabold text-ink">{a.manageStudents}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const canDelete = isServiceRoleConfigured();
  const [students, emails] = await Promise.all([
    listStudents(),
    canDelete ? getUserEmails() : Promise.resolve({} as Record<string, string>),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{a.manageStudents}</h1>
      </div>
      {!canDelete && (
        <p className="mt-2 text-sm text-muted">{a.serviceRoleMissing}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-canvas">
        {students.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{dict.dash.name}</th>
                <th className="px-5 py-3 text-start font-medium">{a.studentEmail}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.profile.phone}</th>
                <th className="px-5 py-3 text-start font-medium">{a.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium text-ink">{s.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {emails[s.id] ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {s.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={href(l, `/dashboard/admin/students/${s.id}/edit`)}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {a.edit}
                      </Link>
                      {canDelete && (
                        <ConfirmForm
                          action={deleteStudent.bind(null, l, s.id)}
                          confirmText={a.confirmDelete}
                        >
                          <button type="submit" className="text-red-600 hover:underline">
                            {a.delete}
                          </button>
                        </ConfirmForm>
                      )}
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

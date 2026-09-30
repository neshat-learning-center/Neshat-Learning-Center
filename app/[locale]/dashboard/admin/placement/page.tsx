import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listPlacementAttempts } from "@/lib/data/admin";
import { href } from "@/lib/utils";
import { markPlacementReviewed, deletePlacementAttempt } from "@/lib/actions/admin/placement";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminPlacementPage({
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
        <h1 className="text-2xl font-extrabold text-ink">{a.placementTitle}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const attempts = await listPlacementAttempts();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{a.placementTitle}</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-canvas">
        {attempts.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{a.leadName}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadPhone}</th>
                <th className="px-5 py-3 text-start font-medium">{a.placementLevel}</th>
                <th className="px-5 py-3 text-start font-medium">{a.placementScore}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadDate}</th>
                <th className="px-5 py-3 text-start font-medium">{a.placementReviewed}</th>
                <th className="px-5 py-3 text-start font-medium">{a.placementViewDetails}</th>
                <th className="px-5 py-3 text-start font-medium">{a.delete}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className={attempt.reviewed ? "opacity-60" : ""}>
                  <td className="px-5 py-3 font-medium text-ink">{attempt.name}</td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {attempt.phone}
                  </td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {attempt.level_code ? (
                      <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs">
                        {attempt.level_code}
                      </span>
                    ) : (
                      a.placementInProgress
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {attempt.score != null && attempt.total != null ? `${attempt.score}/${attempt.total}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {new Date(attempt.created_at).toLocaleDateString(l === "fa" ? "fa-IR" : "en-US")}
                  </td>
                  <td className="px-5 py-3">
                    <form action={markPlacementReviewed.bind(null, l, attempt.id, !attempt.reviewed)}>
                      <button type="submit" className="text-accent-deep hover:underline">
                        {attempt.reviewed ? "↩" : a.placementMarkReviewed}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={href(l, `/dashboard/admin/placement/${attempt.id}`)} className="text-accent-deep hover:underline">
                      {a.placementViewDetails}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <ConfirmForm action={deletePlacementAttempt.bind(null, l, attempt.id)} confirmText={a.confirmDelete}>
                      <button type="submit" className="text-red-600 hover:underline">
                        {a.delete}
                      </button>
                    </ConfirmForm>
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

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPlacementAttemptById } from "@/lib/data/admin";
import { PLACEMENT_QUESTIONS } from "@/content/placementTest";
import { NotConnected } from "@/components/admin/NotConnected";

export default async function AdminPlacementDetailPage({
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
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{a.placementTitle}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const attempt = await getPlacementAttemptById(id);
  if (!attempt) notFound();

  const answerByQuestion = new Map((attempt.answers ?? []).map((ans) => [ans.questionId, ans]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">{attempt.name}</h1>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">{a.leadPhone}</dt>
          <dd className="mt-0.5 text-ink" dir="ltr">
            {attempt.phone}
          </dd>
        </div>
        {attempt.email && (
          <div>
            <dt className="text-xs text-muted">{dict.pages.form.email}</dt>
            <dd className="mt-0.5 text-ink" dir="ltr">
              {attempt.email}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted">{a.placementLevel}</dt>
          <dd className="mt-0.5 text-ink" dir="ltr">
            {attempt.level_code ?? a.placementInProgress}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{a.placementScore}</dt>
          <dd className="mt-0.5 text-ink" dir="ltr">
            {attempt.score != null && attempt.total != null ? `${attempt.score}/${attempt.total}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{a.leadDate}</dt>
          <dd className="mt-0.5 text-ink" dir="ltr">
            {new Date(attempt.created_at).toLocaleDateString(l === "fa" ? "fa-IR" : "en-US")}
          </dd>
        </div>
      </dl>

      {!attempt.answers || attempt.answers.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          {a.placementInProgress}
        </p>
      ) : (
        <div className="mt-10 flex flex-col divide-y divide-line border-y border-line">
          {PLACEMENT_QUESTIONS.map((q) => {
            const given = answerByQuestion.get(q.id);
            const correct = given?.correct ?? false;
            return (
              <div key={q.id} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <p dir="ltr" className="text-start font-medium text-ink">
                    {q.prompt}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${
                      correct ? "border-accent-deep text-accent-deep" : "border-red-300 text-red-600"
                    }`}
                  >
                    {q.level}
                  </span>
                </div>
                <p dir="ltr" className="mt-2 text-start text-sm text-ink-soft">
                  {a.placementYourAnswer}:{" "}
                  <span className={correct ? "text-accent-deep" : "text-red-600"}>
                    {given && given.selectedIndex >= 0 ? q.options[given.selectedIndex] : a.placementNoAnswer}
                  </span>
                </p>
                {!correct && (
                  <p dir="ltr" className="mt-1 text-start text-sm text-ink-soft">
                    {a.placementCorrectAnswer}: <span className="text-ink">{q.options[q.correctIndex]}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

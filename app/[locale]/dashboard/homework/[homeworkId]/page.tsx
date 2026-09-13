import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getHomeworkById, listSubmissionsForHomework, resolveHomeworkUrl } from "@/lib/data/homework";
import { NotConnected } from "@/components/admin/NotConnected";
import { GradeForm } from "@/components/dashboard/GradeForm";

export default async function GradeHomeworkPage({
  params,
}: {
  params: Promise<{ locale: string; homeworkId: string }>;
}) {
  const { locale, homeworkId } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const h = dict.homework;

  const session = await getSession();
  if (!session) redirect(href(l, "/login"));
  if (session.role !== "teacher" && session.role !== "admin") redirect(href(l, "/dashboard"));

  if (!isSupabaseConfigured() || session.demo || !session.id) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink">{h.viewSubmissions}</h1>
        <div className="mt-6">
          <NotConnected message={dict.admin.notConnected} />
        </div>
      </div>
    );
  }

  const homework = await getHomeworkById(homeworkId);
  if (!homework) notFound();
  if (session.role !== "admin" && homework.teacher_id !== session.id) notFound();

  const roster = await listSubmissionsForHomework(homeworkId, homework.class_id);
  const rosterWithUrls = await Promise.all(
    roster.map(async (r) => ({
      ...r,
      fileUrl: r.submission?.file_url ? await resolveHomeworkUrl(r.submission.file_url) : null,
    })),
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">{homework.title}</h1>
      {homework.description && <p className="mt-2 text-ink-soft">{homework.description}</p>}

      <div className="mt-8">
        {rosterWithUrls.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
            {h.noStudentsEnrolled}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {rosterWithUrls.map((r) => (
              <li key={r.studentId} className="flex flex-col gap-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-ink">{r.studentName}</p>
                  <div className="flex items-center gap-3">
                    {r.fileUrl ? (
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-deep hover:underline">
                        {h.viewFile}
                      </a>
                    ) : (
                      <span className="text-sm text-muted">{h.notSubmitted}</span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.submission?.grade != null ? "bg-accent-wash text-accent-deep" : "bg-sand text-ink-soft"
                      }`}
                    >
                      {r.submission?.grade != null ? h.graded : h.pendingReview}
                    </span>
                  </div>
                </div>
                <GradeForm
                  dict={dict}
                  locale={l}
                  homeworkId={homeworkId}
                  studentId={r.studentId}
                  defaultGrade={r.submission?.grade ?? null}
                  defaultFeedback={r.submission?.feedback ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

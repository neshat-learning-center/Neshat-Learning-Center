import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getCourseById,
  getCourseBookIds,
  listBookOptions,
  listClassesByCourse,
  listTeacherOptions,
} from "@/lib/data/admin";
import { href } from "@/lib/utils";
import { deleteClass } from "@/lib/actions/admin/classes";
import { deleteCourse } from "@/lib/actions/admin/courses";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
import { CourseForm } from "@/components/admin/CourseForm";
import { ClassForm } from "@/components/admin/ClassForm";

export default async function EditCoursePage({
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

  const [course, books, selectedBookIds, classes, teachers] = await Promise.all([
    getCourseById(id),
    listBookOptions(),
    getCourseBookIds(id),
    listClassesByCourse(id),
    listTeacherOptions(),
  ]);
  if (!course) notFound();

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={course.title?.fa ?? course.title?.en}
        deleteAction={deleteCourse.bind(null, l, course.id)}
        deleteLabel={a.delete}
        confirmText={a.confirmDelete}
      />
      <div className="mt-8">
        <CourseForm dict={dict} locale={l} course={course} books={books} selectedBookIds={selectedBookIds} />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <h2 className="text-xl font-extrabold text-ink">{a.classesForCourse}</h2>

        {classes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{a.noClassesYet}</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-canvas">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-5 py-3 text-start font-medium">{dict.dash.name}</th>
                  <th className="px-5 py-3 text-start font-medium">{a.teacher}</th>
                  <th className="px-5 py-3 text-start font-medium">{a.status}</th>
                  <th className="px-5 py-3 text-start font-medium">{a.edit}</th>
                  <th className="px-5 py-3 text-start font-medium">{a.delete}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium text-ink">{c.title}</td>
                    <td className="px-5 py-3 text-ink-soft">{c.teacherName ?? a.noTeacher}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {{
                        upcoming: a.statusUpcoming,
                        active: a.statusActive,
                        finished: a.statusFinished,
                        cancelled: a.statusCancelled,
                      }[c.status]}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={href(l, `/dashboard/admin/classes/${c.id}/edit`)}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {a.edit}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <ConfirmForm
                        action={deleteClass.bind(null, l, c.id, `/dashboard/admin/courses/${course.id}/edit`)}
                        confirmText={a.confirmDelete}
                      >
                        <button type="submit" className="text-red-600 hover:underline">
                          {a.delete}
                        </button>
                      </ConfirmForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8">
          <h3 className="eyebrow">{a.addClass}</h3>
          <div className="mt-4">
            <ClassForm
              dict={dict}
              locale={l}
              teachers={teachers}
              lockedCourseId={course.id}
              returnTo={`/dashboard/admin/courses/${course.id}/edit`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

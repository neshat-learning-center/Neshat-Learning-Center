"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { unenrollStudent } from "@/lib/actions/admin/classes";
import { StudentProgressRow } from "@/components/dashboard/StudentProgressRow";
import { StudentPicker } from "@/components/admin/StudentPicker";
import type { StudentOption } from "@/lib/data/links";

export function EnrollmentManager({
  dict,
  locale,
  classId,
  enrollments,
  students,
}: {
  dict: Dictionary;
  locale: Locale;
  classId: string;
  students: StudentOption[];
  enrollments: { id: string; studentId?: string | null; studentName: string | null; studentPhone?: string | null; level?: string | null; progress?: number | null }[];
}) {
  const a = dict.admin;

  return (
    <div>
      <h2 className="eyebrow">{a.enrolledStudents}</h2>

      {enrollments.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line rounded-lg border border-line bg-canvas">
          {enrollments.map((e) => (
            <StudentProgressRow
              key={e.id}
              locale={locale}
              classId={classId}
              enrollmentId={e.id}
              name={e.studentName ?? "—"}
              phone={e.studentPhone}
              level={e.level ?? ""}
              progress={e.progress ?? 0}
              extra={
                <ConfirmForm
                  action={unenrollStudent.bind(null, locale, classId, e.id)}
                  confirmText={a.confirmDelete}
                  cancelLabel={a.cancel}
                  confirmLabel={a.remove}
                >
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    {a.remove}
                  </button>
                </ConfirmForm>
              }
            />
          ))}
        </ul>
      )}

      <StudentPicker locale={locale} classId={classId} students={students} enrolledIds={enrollments.map((e) => e.studentId ?? "")} />
    </div>
  );
}

"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { TextInput } from "@/components/admin/fields";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { enrollStudent, unenrollStudent, type EnrollState } from "@/lib/actions/admin/classes";

export function EnrollmentManager({
  dict,
  locale,
  classId,
  enrollments,
  canEnroll,
}: {
  dict: Dictionary;
  locale: Locale;
  classId: string;
  enrollments: { id: string; studentName: string | null }[];
  canEnroll: boolean;
}) {
  const [state, formAction, pending] = useActionState<EnrollState, FormData>(
    enrollStudent.bind(null, locale, classId),
    {},
  );
  const a = dict.admin;

  const errorMessage =
    state.error === "user-not-found"
      ? a.userNotFound
      : state.error === "email-required"
        ? a.emailRequired
        : state.error === "service-role-missing"
          ? a.serviceRoleMissing
          : state.error;

  return (
    <div>
      <h2 className="eyebrow">{a.enrolledStudents}</h2>

      {enrollments.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink">{e.studentName ?? "—"}</span>
              <ConfirmForm
                action={unenrollStudent.bind(null, locale, classId, e.id)}
                confirmText={a.confirmDelete}
              >
                <button type="submit" className="text-red-600 hover:underline">
                  {a.remove}
                </button>
              </ConfirmForm>
            </li>
          ))}
        </ul>
      )}

      {canEnroll ? (
        <form action={formAction} className="mt-5 flex items-end gap-3">
          <div className="flex-1">
            <TextInput
              name="email"
              type="email"
              dir="ltr"
              className="text-start"
              placeholder={a.studentEmail}
              required
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full border border-line-strong px-5 py-3 text-sm text-ink transition-colors hover:border-ink disabled:opacity-60"
          >
            {a.addStudent}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">{a.serviceRoleMissing}</p>
      )}
      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

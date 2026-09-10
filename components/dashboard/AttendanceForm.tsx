"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { RosterEntry } from "@/lib/data/attendance";
import { recordAttendance, type AttendanceFormState } from "@/lib/actions/attendance";

export function AttendanceForm({
  dict,
  locale,
  classId,
  roster,
}: {
  dict: Dictionary;
  locale: Locale;
  classId: string;
  roster: RosterEntry[];
}) {
  const [state, formAction, pending] = useActionState<AttendanceFormState, FormData>(
    recordAttendance.bind(null, locale, classId),
    {},
  );
  const d = dict.dash;

  const statuses: { value: string; label: string }[] = [
    { value: "present", label: d.present },
    { value: "absent", label: d.absent },
    { value: "late", label: d.late },
    { value: "excused", label: d.excused },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-lg border border-line bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-5 py-3 text-start font-medium">{d.name}</th>
              <th className="px-5 py-3 text-start font-medium">{d.attendance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roster.map((r) => (
              <tr key={r.enrollmentId}>
                <td className="px-5 py-3 font-medium text-ink">{r.studentName}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-4">
                    {statuses.map((s) => (
                      <label key={s.value} className="flex items-center gap-1.5 text-ink-soft">
                        <input
                          type="radio"
                          name={`status_${r.enrollmentId}`}
                          value={s.value}
                          defaultChecked={r.status === s.value}
                          className="accent-accent"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-accent-deep">{d.attendanceSaved}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? dict.admin.saving : dict.admin.save}
      </button>
    </form>
  );
}

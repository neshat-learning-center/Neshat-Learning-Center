"use client";

import { useActionState, useId, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { StudentOption } from "@/lib/data/links";
import { enrollStudentById, type EnrollState } from "@/lib/actions/admin/classes";
import { lt } from "@/lib/join/links-labels";

const norm = (s: string) => s.toLowerCase().replace(/[\s\-+]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** Admin: search registered students and add one to the class (replaces typing an email). */
export function StudentPicker({
  locale,
  classId,
  students,
  enrolledIds,
}: {
  locale: Locale;
  classId: string;
  students: StudentOption[];
  enrolledIds: string[];
}) {
  const t = lt(locale);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<StudentOption | null>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<EnrollState, FormData>(async (prev, fd) => {
    const r = await enrollStudentById(locale, classId, prev, fd);
    if (!r.error) {
      setPicked(null);
      setQuery("");
    }
    return r;
  }, {});

  const available = useMemo(() => {
    const taken = new Set(enrolledIds);
    return students.filter((s) => !taken.has(s.id));
  }, [students, enrolledIds]);

  const matches = useMemo(() => {
    const q = norm(query);
    const list = q ? available.filter((s) => norm(`${s.name} ${s.phone ?? ""}`).includes(q)) : available;
    return list.slice(0, 8);
  }, [available, query]);

  const error =
    state.error === "pick-student" ? t("chooseFirst") : state.error === "already-enrolled" ? t("allEnrolled") : state.error;

  if (available.length === 0) return <p className="mt-4 text-sm text-muted">{t("allEnrolled")}</p>;

  return (
    <form action={formAction} className="mt-5">
      <input type="hidden" name="student_id" value={picked?.id ?? ""} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            value={picked ? picked.name : query}
            onChange={(e) => {
              setPicked(null);
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={t("searchStudent")}
            autoComplete="off"
            className="w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
          />
          {open && !picked && (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-line-strong bg-canvas py-1 shadow-lg"
            >
              {matches.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">{t("noMatches")}</li>
              ) : (
                matches.map((s) => (
                  <li key={s.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setPicked(s);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-sm text-ink hover:bg-sand"
                    >
                      <span className="min-w-0 truncate">{s.name}</span>
                      {s.phone && (
                        <span dir="ltr" className="shrink-0 text-xs text-muted">
                          {s.phone}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={pending || !picked}
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-50"
        >
          {t("addStudentBtn")}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

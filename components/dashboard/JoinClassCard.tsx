"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { StudentJoinData } from "@/lib/data/join";
import { joinClassByCode, requestJoinClass, cancelJoinRequest, type JoinState } from "@/lib/actions/join";
import { jt } from "@/lib/join/labels";

const field =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";
const btn =
  "w-fit rounded-full bg-accent px-6 py-3 text-sm font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60";

/** Student: link an existing class with a join code, or ask the teacher when there's no code. */
export function JoinClassCard({ locale, data, hasClasses }: { locale: Locale; data: StudentJoinData; hasClasses: boolean }) {
  const t = jt(locale);
  const router = useRouter();
  const [mode, setMode] = useState<"code" | "request">("code");
  const [open, setOpen] = useState(!hasClasses);
  const [cancelling, startCancel] = useTransition();

  const [codeState, codeAction, codePending] = useActionState<JoinState, FormData>(joinClassByCode.bind(null, locale), {});
  const [reqState, reqAction, reqPending] = useActionState<JoinState, FormData>(requestJoinClass.bind(null, locale), {});
  const state = mode === "code" ? codeState : reqState;

  return (
    <div id="join" className="scroll-mt-28 rounded-lg border border-line bg-sand/40 p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h3 className="text-lg font-extrabold text-ink">{t("title")}</h3>
          {open && <p className="mt-2 text-sm leading-7 text-ink-soft">{t("lead")}</p>}
        </div>
        {hasClasses && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-accent"
          >
            {open ? "−" : t("joinBtn")}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-5">
          {mode === "code" ? (
            <form action={codeAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-2 sm:max-w-xs">
                <span className="text-sm font-medium text-ink">{t("codeLabel")}</span>
                <input
                  name="code"
                  dir="ltr"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={12}
                  placeholder={t("codePh")}
                  className={`${field} text-start font-en tracking-[0.18em] [&:not(:placeholder-shown)]:uppercase`}
                />
              </label>
              <button type="submit" disabled={codePending} className={btn}>
                {codePending ? t("joining") : t("joinBtn")}
              </button>
            </form>
          ) : (
            <form action={reqAction} className="flex flex-col gap-4">
              <label className="flex max-w-xl flex-col gap-2">
                <span className="text-sm font-medium text-ink">{t("pickClass")}</span>
                <select name="class_id" required defaultValue="" className={field}>
                  <option value="" disabled>
                    {t("pickPh")}
                  </option>
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              {data.classes.length === 0 ? (
                <p className="text-sm text-muted">{t("noClasses")}</p>
              ) : (
                <p className="max-w-xl text-sm text-muted">{t("requestHint")}</p>
              )}
              <button type="submit" disabled={reqPending || data.classes.length === 0} className={btn}>
                {reqPending ? t("joining") : t("sendRequest")}
              </button>
            </form>
          )}

          <div role="status" aria-live="polite" className="mt-3 min-h-5 text-sm">
            {state.error && <p className="text-red-600">{state.error}</p>}
            {state.ok && state.message && <p className="text-accent-deep">{state.message}</p>}
          </div>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "code" ? "request" : "code"))}
            className="mt-2 text-sm text-ink-soft underline decoration-accent decoration-2 underline-offset-4 hover:text-ink"
          >
            {mode === "code" ? t("noCode") : t("haveCode")}
          </button>
        </div>
      )}

      {data.pending.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="eyebrow">{t("pendingTitle")}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {data.pending.map((p) => (
              <li key={p.classId} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-canvas px-4 py-3 text-sm">
                <span className="min-w-0 text-ink">{p.label}</span>
                <span className="flex items-center gap-3">
                  <span className="rounded-full bg-accent-wash px-2.5 py-1 text-xs text-accent-deep">{t("waiting")}</span>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() =>
                      startCancel(async () => {
                        await cancelJoinRequest(locale, p.classId);
                        router.refresh();
                      })
                    }
                    className="text-xs text-muted underline underline-offset-4 hover:text-ink disabled:opacity-60"
                  >
                    {t("cancel")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

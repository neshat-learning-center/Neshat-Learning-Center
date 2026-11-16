"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { JoinPanelData } from "@/lib/data/join";
import { decideJoinRequest, regenerateJoinCode, setJoinApproval } from "@/lib/actions/join";
import { jt } from "@/lib/join/labels";

const fmt = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

/** Teacher / admin: the class's join code, approval switch and pending join requests. */
export function JoinCodePanel({ locale, classId, data }: { locale: Locale; classId: string; data: JoinPanelData }) {
  const t = jt(locale);
  const router = useRouter();
  const [code, setCode] = useState(data.code);
  const [approval, setApproval] = useState(data.requireApproval);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(fmt(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is still visible to copy by hand */
    }
  };

  return (
    <section aria-labelledby="join-code-h">
      <h2 id="join-code-h" className="eyebrow">{t("panelTitle")}</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-ink-soft">{t("panelHelp")}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div
          dir="ltr"
          className="rounded-md border border-line-strong bg-canvas px-5 py-3 font-en text-2xl font-bold tracking-[0.22em] text-ink select-all"
        >
          {code ? fmt(code) : "—"}
        </div>
        <button type="button" onClick={copy} disabled={!code} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60">
          {copied ? t("copied") : t("copy")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t("regenerateConfirm"))) return;
            start(async () => {
              const r = await regenerateJoinCode(locale, classId);
              if (r.code) setCode(r.code);
              setErr(r.error ?? null);
            });
          }}
          className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent disabled:opacity-60"
        >
          {t("regenerate")}
        </button>
      </div>

      <label className="mt-6 flex max-w-xl cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={approval}
          disabled={pending}
          onChange={(e) => {
            const on = e.target.checked;
            setApproval(on);
            start(async () => {
              const r = await setJoinApproval(locale, classId, on);
              if (r.error) {
                setApproval(!on);
                setErr(r.error);
              } else setErr(null);
            });
          }}
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="block text-sm font-medium text-ink">{t("requireApproval")}</span>
          <span className="block text-xs leading-6 text-muted">{t("requireApprovalHelp")}</span>
        </span>
      </label>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-ink">
          {t("requestsTitle")}
          {data.requests.length > 0 && (
            <span className="ms-2 rounded-full bg-accent px-2 py-0.5 text-xs text-slate numeral">{data.requests.length}</span>
          )}
        </h3>
        {data.requests.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line-strong p-5 text-center text-sm text-muted">{t("noRequests")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{r.studentName}</span>
                  <span className="block text-xs text-muted">{r.viaCode ? t("viaCode") : t("viaList")}</span>
                </span>
                <span className="flex gap-2">
                  {([true, false] as const).map((approve) => (
                    <button
                      key={String(approve)}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const res = await decideJoinRequest(locale, classId, r.id, approve);
                          setErr(res.error ?? null);
                          router.refresh();
                        })
                      }
                      className={
                        approve
                          ? "rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate hover:bg-accent-deep disabled:opacity-60"
                          : "rounded-full border border-line-strong px-4 py-2 text-sm text-ink hover:border-red-400 disabled:opacity-60"
                      }
                    >
                      {approve ? t("approve") : t("reject")}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
    </section>
  );
}

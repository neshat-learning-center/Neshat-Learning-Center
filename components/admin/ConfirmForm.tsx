"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};

/** Whether we're past hydration (so `document` exists) — via
 * useSyncExternalStore rather than a state+effect pair, since setting state
 * synchronously from an effect is exactly the footgun that hook exists to
 * avoid. */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Wraps a destructive server action with a branded confirm dialog — same
 * message the browser's native confirm() used to show, styled for Neshat
 * instead of looking like a stray OS popup. */
export function ConfirmForm({
  action,
  confirmText,
  cancelLabel,
  confirmLabel,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText: string;
  cancelLabel: string;
  confirmLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const mounted = useMounted();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  function confirm() {
    startTransition(async () => {
      await action(new FormData());
      setOpen(false);
    });
  }

  return (
    <>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </form>

      {mounted &&
        createPortal(
          <div
            role="presentation"
            aria-hidden={!open}
            onClick={() => !pending && setOpen(false)}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-slate/50 p-4 backdrop-blur-[2px] transition-opacity duration-200 ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-describedby="confirm-form-message"
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-lg border border-line bg-canvas p-6 shadow-[0_30px_60px_-20px_rgba(38,37,40,0.45)] transition-all duration-200 ${
                open ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p id="confirm-form-message" className="mt-4 text-sm leading-relaxed text-ink">
                {confirmText}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  ref={cancelRef}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  disabled={pending}
                  onClick={confirm}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {pending && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

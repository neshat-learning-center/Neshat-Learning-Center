"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { dir } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { answer, type ChatKnowledge, type ChatLink } from "@/lib/chat/answer";

interface Msg {
  from: "bot" | "user";
  text: string;
  links?: ChatLink[];
}

const CHIPS: Record<Locale, string[]> = {
  fa: ["دوره‌ها", "شهریه", "آزمون تعیین سطح", "اساتید", "آدرس", "تماس با ما"],
  en: ["Courses", "Prices", "Placement test", "Teachers", "Address", "Contact us"],
};

const UI = {
  fa: {
    title: "دستیار نشاط",
    status: "پاسخ‌گو به سؤالات شما",
    placeholder: "سؤالتان را بنویسید…",
    send: "ارسال",
    open: "گفتگو با دستیار",
    close: "بستن",
    hello: "سلام! من دستیار نشاط هستم. درباره‌ی دوره‌ها، شهریه، اساتید یا تعیین سطح بپرسید.",
  },
  en: {
    title: "Neshat Assistant",
    status: "Here to answer your questions",
    placeholder: "Type your question…",
    send: "Send",
    open: "Chat with the assistant",
    close: "Close",
    hello: "Hi! I'm the Neshat assistant. Ask me about courses, prices, teachers or the placement test.",
  },
} as const;

export function ChatBot({ locale, knowledge }: { locale: Locale; knowledge: ChatKnowledge }) {
  const ui = UI[locale];
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [value, setValue] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: ui.hello }]);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setValue("");
    setTyping(true);
    timer.current = setTimeout(() => {
      const r = answer(text, knowledge);
      setMsgs((m) => [...m, { from: "bot", text: r.text, links: r.links }]);
      setTyping(false);
    }, 450);
  };

  const linkClass =
    "rounded-full border border-line-strong bg-paper px-3 py-1.5 text-xs text-ink transition-colors hover:border-accent hover:bg-accent-wash";

  return (
    <div dir={dir[locale]} className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label={ui.title}
          className="flex h-[32rem] max-h-[calc(100vh-7rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line-strong bg-canvas shadow-[0_24px_60px_-20px_rgba(43,42,45,0.45)]"
        >
          <div className="flex items-center justify-between gap-3 bg-slate px-5 py-4 text-canvas">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-slate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{ui.title}</p>
                <p className="text-xs text-canvas/60">{ui.status}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={ui.close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-canvas/70 transition-colors hover:bg-canvas/10 hover:text-canvas"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.from === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "rounded-ee-sm bg-accent text-slate"
                      : "rounded-es-sm border border-line bg-paper text-ink"
                  }`}
                >
                  {m.text}
                </div>
                {m.links && m.links.length > 0 && (
                  <div className="flex max-w-[92%] flex-wrap gap-2">
                    {m.links.map((l, j) =>
                      l.external ? (
                        <a key={j} href={l.to} target={l.to.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={linkClass} dir="auto">
                          {l.label}
                        </a>
                      ) : (
                        <Link key={j} href={href(locale, l.to)} className={linkClass}>
                          {l.label}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-1 rounded-2xl rounded-es-sm border border-line bg-paper px-4 py-3 w-fit">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
            {CHIPS[locale].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => send(c)}
                className="shrink-0 rounded-full bg-sand px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-accent-tint hover:text-ink"
              >
                {c}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(value);
            }}
            className="flex items-center gap-2 border-t border-line bg-paper px-3 py-3"
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={ui.placeholder}
              className="min-w-0 flex-1 rounded-full bg-sand px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              aria-label={ui.send}
              disabled={!value.trim() || typing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-colors hover:bg-accent hover:text-slate disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100">
                <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? ui.close : ui.open}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-slate shadow-[0_14px_30px_-10px_rgba(221,156,12,0.7)] transition-all duration-300 hover:scale-105 hover:bg-accent-deep"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />}
        </svg>
      </button>
    </div>
  );
}

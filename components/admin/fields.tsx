"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const base =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {note && <span className="text-xs text-muted">{note}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={`${base} ${className ?? ""}`} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={`${base} resize-none ${className ?? ""}`} {...rest} />;
}

type SelectOption = { value: string; label: ReactNode; disabled: boolean };

function extractOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as { value?: string | number; disabled?: boolean; children?: ReactNode };
    return [{ value: String(props.value ?? ""), label: props.children, disabled: !!props.disabled }];
  });
}

/**
 * A from-scratch dropdown, not a styled native <select> — native option
 * popups render as unstyled OS chrome (no CSS reaches them), which is what
 * looked "default" before. Ships its own listbox so the open state matches
 * the rest of the UI. Keeps the native-<select> call shape (name/value/
 * defaultValue/onChange/children-as-<option>) so every existing call site
 * works unchanged; a hidden input carries the value for <form action> reads.
 */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { name, value, defaultValue, onChange, required, disabled, className, children } = props;
  const options = useMemo(() => extractOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(String(defaultValue ?? ""));
  const current = isControlled ? String(value ?? "") : internal;
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // jump straight to the selected option (e.g. editing a course already set
  // to a language near the bottom of a long list) instead of always the top,
  // and keep the active row in view while navigating with arrow keys
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(next: string) {
    if (!isControlled) setInternal(next);
    setOpen(false);
    buttonRef.current?.focus();
    onChange?.({ target: { value: next } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  }

  function openList() {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === current);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${base} flex items-center justify-between gap-2 text-start ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className ?? ""}`}
      >
        <span className={`truncate ${selected ? "" : "text-muted/70"}`}>{selected ? selected.label : "—"}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="dropdown-scroll absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-line-strong bg-paper p-1.5 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === current}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={(e) => {
                // this list lives inside a <Field>'s <label> — a plain <li>
                // isn't a form control, so the browser's native "clicking a
                // label activates its control" behavior re-forwards the same
                // click to the trigger button right after commit() closes
                // the panel, reopening it. Stop that default forwarding.
                e.preventDefault();
                if (!o.disabled) commit(o.value);
              }}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                o.disabled
                  ? "cursor-not-allowed text-muted/60"
                  : i === activeIndex
                    ? "bg-sand text-ink"
                    : "text-ink-soft"
              } ${o.value === current && !o.disabled ? "font-medium text-ink" : ""}`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === current && !o.disabled && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-accent-deep">
                  <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A checkbox-based multi-select — same trigger/panel language as Select, but
 * for "pick any number of these" fields (e.g. a course's recommended books)
 * that used to be rendered as one giant, ever-growing list of checkboxes.
 * Real checkboxes live inside the panel, so <form action> submission (via
 * `formData.getAll(name)`) needs no change at any call site.
 */
export function MultiSelect({
  name,
  options,
  defaultValues = [],
  placeholder = "—",
  searchPlaceholder = "جست‌وجو…",
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValues?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultValues));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const selectedLabels = options.filter((o) => selected.has(o.value)).map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join("، ")
        : `${selectedLabels.slice(0, 2).join("، ")} +${selectedLabels.length - 2}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${base} flex cursor-pointer items-center justify-between gap-2 text-start`}
      >
        <span className={`truncate ${selectedLabels.length ? "" : "text-muted/70"}`}>{summary}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-md border border-line-strong bg-paper shadow-lg">
          {options.length > 8 && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full border-b border-line px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60"
            />
          )}
          <div className="dropdown-scroll max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted">—</p>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-sand"
                >
                  <input
                    type="checkbox"
                    name={name}
                    value={o.value}
                    checked={selected.has(o.value)}
                    onChange={() => toggle(o.value)}
                    className="shrink-0"
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
    >
      {children}
    </button>
  );
}

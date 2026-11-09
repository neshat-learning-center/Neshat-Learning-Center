"use client";

import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/events/compress";
import type { Locale } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";
import { TextInput } from "@/components/admin/fields";

async function uploadOne(file: File, folder: string): Promise<string> {
  const { blob, ext } = await compressImage(file);
  const sb = createClient();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("events").upload(path, blob, { contentType: blob.type || undefined, upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from("events").getPublicUrl(path).data.publicUrl;
}

/** Single cover image: optimised in the browser, stored in the public `events` bucket. */
export function CoverUpload({ name, current, folder, locale }: { name: string; current?: string | null; folder: string; locale: Locale }) {
  const t = makeET(locale);
  const id = useId();
  const [url, setUrl] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      setUrl(await uploadOne(f, folder));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{t("a_cover")}</span>
      <input type="hidden" name={name} value={url} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[16/9] w-full max-w-md border border-line object-cover" />
      ) : (
        <div className="flex aspect-[16/9] w-full max-w-md items-center justify-center border border-dashed border-line-strong text-sm text-muted">16:9</div>
      )}
      <div className="flex items-center gap-4">
        <label htmlFor={id} className={`cursor-pointer border border-line-strong px-4 py-2.5 text-sm text-ink hover:border-ink ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? t("a_uploading") : t("a_addImages")}
          <input id={id} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
        {url && !busy && <button type="button" onClick={() => setUrl("")} className="text-sm text-red-600 hover:underline">{t("a_remove")}</button>}
      </div>
      {err && <span role="alert" className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

interface G { url: string; caption: string }

/** Many gallery images at once: upload, caption, reorder, remove. */
export function GalleryUpload({ name, initial, folder, locale }: { name: string; initial: G[]; folder: string; locale: Locale }) {
  const t = makeET(locale);
  const id = useId();
  const [items, setItems] = useState<G[]>(initial);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setErr("");
    setBusy(files.length);
    // 3 at a time: fast, but kind to a phone's memory
    for (let i = 0; i < files.length; i += 3) {
      const batch = files.slice(i, i + 3);
      const done = await Promise.allSettled(batch.map((f) => uploadOne(f, folder)));
      const ok = done.flatMap((r) => (r.status === "fulfilled" ? [{ url: r.value, caption: "" }] : []));
      const bad = done.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (bad) setErr(bad.reason instanceof Error ? bad.reason.message : "upload failed");
      setItems((cur) => [...cur, ...ok]);
      setBusy((b) => Math.max(0, b - batch.length));
    }
  };
  const move = (i: number, d: number) => setItems((c) => {
    const j = i + d;
    if (j < 0 || j >= c.length) return c;
    const n = c.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-ink">{t("a_galleryImgs")}</span>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g, i) => (
            <li key={g.url} className="flex flex-col gap-2 border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt="" className="aspect-[4/3] w-full object-cover" />
              <TextInput value={g.caption} placeholder="…" onChange={(e) => setItems((c) => c.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))} className="!py-2 text-sm" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-8 w-8 border border-line-strong hover:border-ink disabled:opacity-30" aria-label="←">‹</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="h-8 w-8 border border-line-strong hover:border-ink disabled:opacity-30" aria-label="→">›</button>
                </span>
                <button type="button" onClick={() => setItems((c) => c.filter((_, k) => k !== i))} className="text-red-600 hover:underline">{t("a_remove")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-4">
        <label htmlFor={id} className={`cursor-pointer border border-line-strong px-4 py-2.5 text-sm text-ink hover:border-ink ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? `${t("a_uploading")} (${busy})` : t("a_addImages")}
          <input ref={input} id={id} type="file" accept="image/*" multiple className="hidden" onChange={onPick} disabled={busy > 0} />
        </label>
      </div>
      {err && <span role="alert" className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

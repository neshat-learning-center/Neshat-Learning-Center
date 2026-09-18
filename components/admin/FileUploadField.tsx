"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Uploads a file straight from the browser to Supabase Storage, then exposes
 * the resulting public URL via a hidden input so it rides along with the
 * enclosing server-action form — no change needed to the form's own submit
 * handling, it just reads `hiddenInputName` like any other field.
 */
export function FileUploadField({
  bucket,
  pathPrefix,
  accept,
  label,
  note,
  hiddenInputName,
  currentUrl,
  previewAsImage = false,
  uploadingLabel = "…",
  chooseLabel = "انتخاب فایل",
  changeLabel = "تغییر فایل",
  removeLabel = "حذف تصویر",
  storePathOnly = false,
}: {
  bucket: "avatars" | "books" | "materials" | "homework";
  pathPrefix: string;
  accept?: string;
  label: string;
  note?: string;
  hiddenInputName: string;
  currentUrl?: string | null;
  previewAsImage?: boolean;
  uploadingLabel?: string;
  chooseLabel?: string;
  changeLabel?: string;
  /** Only ever shown for previewAsImage fields — clears the picture so
   * saving the form removes it (no confirm dialog: nothing takes effect
   * until the surrounding form is actually submitted). */
  removeLabel?: string;
  /** For private buckets (e.g. "materials") — store the raw storage path
   * instead of a public URL, since the bucket has no public URL to give. A
   * signed URL is generated server-side for authorized readers at display time. */
  storePathOnly?: boolean;
}) {
  const inputId = useId();
  const [url, setUrl] = useState(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const configured = isSupabaseConfigured();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(undefined);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      if (storePathOnly) {
        setUrl(path);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setUrl(data.publicUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload-failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input type="hidden" name={hiddenInputName} value={url} />

      {previewAsImage && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-20 w-20 rounded-full border border-line object-cover" />
      )}

      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className={`flex w-fit cursor-pointer items-center gap-2 rounded-md border border-line-strong px-4 py-2.5 text-sm text-ink transition-colors hover:border-ink ${
            !configured || uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? uploadingLabel : url ? changeLabel : chooseLabel}
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            disabled={!configured || uploading}
            onChange={handleChange}
          />
        </label>

        {previewAsImage && url && !uploading && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-red-600 hover:underline"
          >
            {removeLabel}
          </button>
        )}
      </div>

      {!previewAsImage && url && !storePathOnly && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-accent-deep hover:underline">
          {url}
        </a>
      )}
      {!previewAsImage && url && storePathOnly && (
        <span className="truncate text-xs text-muted" dir="ltr">
          {url}
        </span>
      )}
      {note && <span className="text-xs text-muted">{note}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

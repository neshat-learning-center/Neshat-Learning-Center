/**
 * Browser-side image optimisation before upload: scales the longest side down
 * to `maxSide` and re-encodes as WebP (JPEG fallback). A 6 MB phone photo
 * typically becomes a few hundred KB. Falls back to the original file if
 * anything goes wrong or the result isn't smaller.
 */
export async function compressImage(file: File, maxSide = 1920, quality = 0.82): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file as Blob, ext: (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg" };
  if (!file.type.startsWith("image/") || /svg|gif/.test(file.type)) return original;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
    const webp = await toBlob("image/webp");
    const out = webp && webp.type === "image/webp" ? { blob: webp, ext: "webp" } : { blob: (await toBlob("image/jpeg")) as Blob, ext: "jpg" };
    return out.blob && out.blob.size < file.size ? out : original;
  } catch {
    return original;
  }
}

/** Mirrors event_norm_phone() in the database, so the form and the server agree on what "the same number" is. */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

export function normalizePhone(input: string): string {
  let v = (input ?? "")
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/\D/g, "");
  if (/^0098\d{10}$/.test(v)) v = v.slice(4);
  else if (/^98\d{10}$/.test(v)) v = v.slice(2);
  else if (/^0\d{10}$/.test(v)) v = v.slice(1);
  return v;
}

export function isValidPhone(input: string): boolean {
  const v = normalizePhone(input);
  if (!/^\d{7,15}$/.test(v)) return false;
  if (v.startsWith("9") && !/^9\d{9}$/.test(v) && v.length < 10) return false;
  return true;
}

/** "9123456789" → "0912 345 6789" for display */
export const displayPhone = (normalised: string) =>
  /^9\d{9}$/.test(normalised) ? `0${normalised.slice(0, 3)} ${normalised.slice(3, 6)} ${normalised.slice(6)}` : normalised;

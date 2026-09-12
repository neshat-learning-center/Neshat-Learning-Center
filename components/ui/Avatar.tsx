/** Circular avatar — real photo if uploaded, a warm monogram otherwise.
 *  Plain <img> (not next/image) since avatar_url is an external Supabase
 *  Storage URL, same reasoning as TeacherPortrait. */
export function Avatar({
  name,
  src,
  size = 64,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const monogram = name.trim().charAt(0) || "?";
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-accent-wash ring-1 ring-line-strong ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-en font-bold text-accent-deep"
          style={{ fontSize: size * 0.4 }}
        >
          {monogram}
        </span>
      )}
    </div>
  );
}

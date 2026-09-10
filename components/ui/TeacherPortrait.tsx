import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { Teacher } from "@/content/types";

/** Editorial portrait crop with a designed placeholder until real photography lands. */
export function TeacherPortrait({
  teacher,
  locale,
  onDark = false,
}: {
  teacher: Teacher;
  locale: Locale;
  onDark?: boolean;
}) {
  const monogram = pick(teacher.name, locale).trim().charAt(0);
  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-sm ${
        onDark ? "bg-slate-soft" : "bg-gradient-to-b from-sand to-sand-deep"
      }`}
    >
      {teacher.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={teacher.image}
          alt={pick(teacher.name, locale)}
          className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
        />
      ) : (
        <>
          <span
            className={`absolute inset-0 flex items-center justify-center font-en text-[7rem] font-bold transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-110 ${
              onDark ? "text-canvas/10" : "text-ink/8"
            }`}
          >
            {monogram}
          </span>
          <span className={`absolute start-4 top-4 text-xs ${onDark ? "text-canvas/40" : "text-muted"}`}>
            portrait
          </span>
          <span
            className={`absolute bottom-4 end-4 h-8 w-8 rounded-full border ${
              onDark ? "border-canvas/20" : "border-line-strong"
            }`}
          />
        </>
      )}
      <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-x-100 rtl:origin-right" />
    </div>
  );
}

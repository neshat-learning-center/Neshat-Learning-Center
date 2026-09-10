import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Teacher } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { TeacherPortrait } from "@/components/ui/TeacherPortrait";

export function Teachers({
  dict,
  locale,
  teachers,
}: {
  dict: Dictionary;
  locale: Locale;
  teachers: Teacher[];
}) {
  return (
    <section id="teachers" className="bg-slate py-20 text-canvas md:py-28">
      <div className="container-editorial section-x">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow eyebrow-accent flex items-center gap-3">
              <span className="inline-block h-px w-6 bg-accent" />
              {dict.teachers.label}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-5 text-[clamp(1.9rem,4vw,3.4rem)] font-extrabold leading-[1.2] text-canvas">
              {dict.teachers.title}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-canvas/70">{dict.teachers.lead}</p>
          </Reveal>
        </div>

        <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible">
          {teachers.map((t, i) => (
            <Reveal
              key={t.slug}
              as="div"
              delay={i * 80}
              className="min-w-[72%] snap-start sm:min-w-[45%] md:min-w-0"
            >
              <Link href={href(locale, `/teachers/${t.slug}`)} className="group block">
                <TeacherPortrait teacher={t} locale={locale} onDark />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-canvas transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                      {pick(t.name, locale)}
                    </h3>
                    <p className="mt-1 text-sm text-canvas/55">{pick(t.specialty, locale)}</p>
                  </div>
                  <span className="mt-1 shrink-0 text-xs text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {dict.teachers.viewProfile}
                  </span>
                </div>
                <p className="mt-2 border-t border-canvas/12 pt-2 text-xs text-canvas/45">
                  {pick(t.languages, locale)}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12" delay={120}>
          <Button href={href(locale, "/teachers")} variant="accent" arrow>
            {dict.pages.teachersTitle}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

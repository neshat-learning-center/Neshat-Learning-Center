import type { Locale } from "@/lib/i18n/config";

/**
 * Rule-based answers built ONLY from data the site already has (courses,
 * teachers, books, contact details). Nothing here is invented: when a
 * question isn't covered, the bot says so and points to real contact options.
 */

export interface ChatKnowledge {
  locale: Locale;
  siteName: string;
  city: string;
  address?: string;
  mapUrl?: string;
  phones: string[];
  email?: string;
  instagram?: string;
  courses: Array<{
    slug: string;
    titleFa: string;
    titleEn: string;
    title: string;
    level: string;
    age: "kids" | "teens" | "adults";
    price?: number;
    sessionsCount?: number;
    languageFa: string;
    languageEn: string;
  }>;
  teachers: Array<{ slug: string; name: string; languages: string; specialty: string }>;
  bookCount: number;
}

export interface ChatLink {
  label: string;
  /** locale-less internal path ("/courses") or an absolute/tel/mailto URL */
  to: string;
  external?: boolean;
}

export interface ChatReply {
  text: string;
  links?: ChatLink[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏‎]/g, " ")
    .replace(/[?؟!.,،:؛]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

export function answer(input: string, k: ChatKnowledge): ChatReply {
  const fa = k.locale === "fa";
  const L = (f: string, e: string) => (fa ? f : e);
  const t = norm(input);
  const nf = (n: number) => n.toLocaleString(fa ? "fa-IR" : "en-US");
  const price = (n: number) => `${nf(n)} ${L("تومان", "Toman")}`;

  const contactLinks: ChatLink[] = [
    ...k.phones.map((p) => ({ label: p, to: `tel:${p}`, external: true })),
    ...(k.email ? [{ label: k.email, to: `mailto:${k.email}`, external: true }] : []),
    ...(k.instagram ? [{ label: "Instagram", to: k.instagram, external: true }] : []),
  ];

  // ---- course lookups (by language / age / explicit title) ----
  const byTitle = k.courses.filter(
    (c) => t.includes(norm(c.titleFa)) || t.includes(norm(c.titleEn)),
  );
  const byLang = k.courses.filter(
    (c) => t.includes(norm(c.languageFa)) || t.includes(norm(c.languageEn)),
  );
  const ageKey = has(t, ["کودک", "بچه", "kid", "child"])
    ? "kids"
    : has(t, ["نوجوان", "teen"])
      ? "teens"
      : has(t, ["بزرگسال", "adult"])
        ? "adults"
        : null;
  const byAge = ageKey ? k.courses.filter((c) => c.age === ageKey) : [];
  const wantsPrice = has(t, ["قیمت", "هزینه", "شهریه", "چند", "price", "cost", "fee", "how much", "tuition"]);

  const courseLinks = (list: typeof k.courses): ChatLink[] =>
    list.slice(0, 6).map((c) => ({
      label: `${c.title}${wantsPrice && c.price != null ? ` · ${price(c.price)}` : ""}`,
      to: `/courses/${c.slug}`,
    }));

  if (byTitle.length > 0) {
    const c = byTitle[0];
    const bits = [
      `${L("سطح", "Level")}: ${c.level}`,
      c.sessionsCount != null ? `${nf(c.sessionsCount)} ${L("جلسه", "sessions")}` : null,
      c.price != null ? `${L("شهریه", "Price")}: ${price(c.price)}` : null,
    ].filter(Boolean);
    return {
      text: `${c.title} — ${bits.join(" · ")}`,
      links: [
        { label: L("جزئیات و کلاس‌ها", "Details & classes"), to: `/courses/${c.slug}` },
        { label: L("ثبت‌نام", "Enrol"), to: "/placement" },
      ],
    };
  }

  if (byLang.length > 0 && !has(t, ["استاد", "مدرس", "teacher", "کتاب", "book"])) {
    return {
      text: L(
        `دوره‌های ${byLang[0].languageFa} ما:`,
        `Our ${byLang[0].languageEn} courses:`,
      ),
      links: courseLinks(byLang),
    };
  }

  if (byAge.length > 0) {
    return {
      text: L("این دوره‌ها برای این گروه سنی هستند:", "These courses fit that age group:"),
      links: courseLinks(byAge),
    };
  }

  // ---- general intents ----
  if (has(t, ["سلام", "درود", "hello", "hi ", "hey", "salam"]) || t === "hi") {
    return {
      text: L(
        `سلام! به ${k.siteName} خوش آمدید 👋 هر چه می‌خواهید بپرسید.`,
        `Hi! Welcome to ${k.siteName} 👋 Ask me anything.`,
      ),
    };
  }

  if (has(t, ["ثبت نام", "ثبتنام", "عضویت", "register", "enrol", "enroll", "sign up", "signup", "join"])) {
    return {
      text: L(
        "برای ثبت‌نام، ابتدا آزمون تعیین سطح رایگان را بدهید تا دوره مناسبتان مشخص شود؛ سپس وارد حساب خود شوید و در کلاس موردنظر ثبت‌نام کنید.",
        "To enrol, take the free placement test to find your level, then log in and sign up for the class you want.",
      ),
      links: [
        { label: L("آزمون تعیین سطح", "Placement test"), to: "/placement" },
        { label: L("ورود / ثبت‌نام", "Log in / Sign up"), to: "/signup" },
      ],
    };
  }

  if (has(t, ["تعیین سطح", "آزمون", "سطح", "placement", "level", "test"])) {
    return {
      text: L(
        "آزمون تعیین سطح رایگان است و چند دقیقه طول می‌کشد. در پایان سطح شما و دوره‌های مناسب نمایش داده می‌شود.",
        "The placement test is free and takes a few minutes. At the end you'll see your level and suitable courses.",
      ),
      links: [{ label: L("شروع آزمون", "Start the test"), to: "/placement" }],
    };
  }

  if (wantsPrice) {
    const priced = k.courses.filter((c) => c.price != null);
    if (priced.length > 0) {
      return {
        text: L("شهریه دوره‌ها (برای هر دوره روی آن بزنید):", "Course prices (tap a course for details):"),
        links: priced.slice(0, 6).map((c) => ({
          label: `${c.title} · ${price(c.price as number)}`,
          to: `/courses/${c.slug}`,
        })),
      };
    }
  }

  if (has(t, ["دوره", "کلاس", "course", "class", "learn", "یادگیری", "زبان", "language"])) {
    if (has(t, ["آنلاین", "حضوری", "online", "in person", "in-person"])) {
      return {
        text: L(
          "کلاس‌ها هم حضوری و هم آنلاین برگزار می‌شوند. فرمت هر کلاس در صفحه‌ی همان دوره نوشته شده است.",
          "Classes run both in person and online. The format of each class is listed on its course page.",
        ),
        links: [{ label: L("مشاهده کلاس‌ها", "Browse classes"), to: "/classes" }],
      };
    }
    return {
      text: L(
        `در حال حاضر ${nf(k.courses.length)} دوره داریم. چند نمونه:`,
        `We currently offer ${nf(k.courses.length)} courses. A few of them:`,
      ),
      links: [
        ...courseLinks(k.courses.slice(0, 4)),
        { label: L("همه‌ی دوره‌ها", "All courses"), to: "/courses" },
      ],
    };
  }

  if (has(t, ["آنلاین", "حضوری", "online", "in person", "in-person"])) {
    return {
      text: L(
        "هم کلاس حضوری در مرکز داریم و هم کلاس آنلاین زنده و تعاملی.",
        "We offer in-person classes at the centre and live, interactive online classes.",
      ),
      links: [{ label: L("مشاهده کلاس‌ها", "Browse classes"), to: "/classes" }],
    };
  }

  if (has(t, ["استاد", "مدرس", "معلم", "teacher", "tutor", "instructor"])) {
    const sample = k.teachers.slice(0, 4);
    return {
      text:
        sample.length > 0
          ? L("برخی از اساتید ما:", "Some of our teachers:")
          : L("اساتید ما را در صفحه‌ی اساتید ببینید.", "See our teachers on the Teachers page."),
      links: [
        ...sample.map((x) => ({
          label: `${x.name}${x.specialty ? ` · ${x.specialty}` : ""}`,
          to: `/teachers/${x.slug}`,
        })),
        { label: L("همه‌ی اساتید", "All teachers"), to: "/teachers" },
      ],
    };
  }

  if (has(t, ["کتاب", "book", "منبع"])) {
    return {
      text: L(
        `${nf(k.bookCount)} کتاب و منبع آموزشی در کتابخانه‌ی سایت داریم و هر دوره کتاب‌های پیشنهادی خودش را دارد.`,
        `Our library has ${nf(k.bookCount)} books and resources, and each course lists its recommended books.`,
      ),
      links: [{ label: L("کتاب‌ها", "Books"), to: "/books" }],
    };
  }

  if (has(t, ["تربیت مدرس", "teacher training", "tt", "آموزش مدرس"])) {
    return {
      text: L(
        "دوره‌های تربیت مدرس و ارتقای حرفه‌ای برای کسانی است که می‌خواهند مدرس زبان شوند یا مهارتشان را بالا ببرند.",
        "Our teacher-training courses are for people who want to teach languages or grow as educators.",
      ),
      links: [{ label: L("تربیت مدرس", "Teacher training"), to: "/teacher-training" }],
    };
  }

  if (has(t, ["آدرس", "کجا", "نشانی", "موقعیت", "نقشه", "address", "where", "location", "map", "find you"])) {
    return {
      text: k.address
        ? L(`آدرس ما: ${k.address}`, `Our address: ${k.address}`)
        : L(`ما در ${k.city} هستیم.`, `We're in ${k.city}.`),
      links: k.mapUrl ? [{ label: L("مشاهده روی نقشه", "Open in Maps"), to: k.mapUrl, external: true }] : [],
    };
  }

  if (has(t, ["تماس", "شماره", "تلفن", "ایمیل", "اینستاگرام", "پشتیبان", "contact", "phone", "call", "email", "instagram", "support"])) {
    return {
      text: L("از این راه‌ها می‌توانید با ما در ارتباط باشید:", "You can reach us here:"),
      links: [...contactLinks, { label: L("صفحه‌ی تماس", "Contact page"), to: "/contact" }],
    };
  }

  if (has(t, ["درباره", "about", "who are", "نشاط", "neshat", "philosophy"])) {
    return {
      text: L(
        "نشاط جایی است که زبان را زنده یاد می‌گیرید: از جلسه‌ی اول صحبت می‌کنید، اشتباه کردن بخشی از یادگیری است و مسیر یادگیری روشن و قدم‌به‌قدم است.",
        "At Neshat you learn language as a living skill: you speak from the first session, mistakes are part of learning, and the path is clear and step by step.",
      ),
      links: [{ label: L("درباره‌ی ما", "About us"), to: "/about" }],
    };
  }

  if (has(t, ["ممنون", "مرسی", "thank", "thx"])) {
    return { text: L("خواهش می‌کنم! اگر سؤال دیگری دارید بپرسید 🙂", "You're welcome! Ask me anything else 🙂") };
  }

  return {
    text: L(
      "متأسفانه جواب دقیق این سؤال را ندارم. می‌توانید از گزینه‌های زیر استفاده کنید یا مستقیم با ما تماس بگیرید:",
      "Sorry, I don't have a precise answer to that. Try the options below or contact us directly:",
    ),
    links: [...contactLinks.slice(0, 2), { label: L("صفحه‌ی تماس", "Contact page"), to: "/contact" }],
  };
}

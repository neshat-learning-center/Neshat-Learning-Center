import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import { getCategories, getCourses, getTeachers, getBooks, getPosts } from "@/lib/data/public";
import { pickRandom } from "@/lib/utils";
import { pick } from "@/lib/i18n/config";
import { site } from "@/content/site";
import { languageLabel } from "@/lib/labels";
import { ChatBot } from "@/components/chat/ChatBot";
import { EventsTeaser } from "@/components/sections/EventsTeaser";
import { getEvents } from "@/lib/events/data";

import { Hero } from "@/components/sections/Hero";
import { CourseDiscovery } from "@/components/sections/CourseDiscovery";
import { WhyNeshat } from "@/components/sections/WhyNeshat";
import { Courses } from "@/components/sections/Courses";
import { Teachers } from "@/components/sections/Teachers";
import { LearningModes } from "@/components/sections/LearningModes";
import { Books } from "@/components/sections/Books";
import { Journal } from "@/components/sections/Journal";
import { TeacherTraining } from "@/components/sections/TeacherTraining";
import { StudentExperience } from "@/components/sections/StudentExperience";
import { CallToAction } from "@/components/sections/CallToAction";

// Events change from the admin at any time and the page shows live seats and countdowns: always read fresh.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const categories = getCategories();
  const [courses, teachers, books, posts, events] = await Promise.all([
    getCourses(),
    getTeachers(),
    getBooks(),
    getPosts(),
    getEvents(),
  ]);

  const knowledge = {
    locale: l,
    siteName: pick(site.name, l),
    city: pick(site.city, l),
    address: site.address ? pick(site.address, l) : undefined,
    mapUrl: site.mapUrl,
    phones: site.phones ?? [],
    email: site.email,
    instagram: site.instagram,
    courses: courses.map((c) => ({
      slug: c.slug,
      titleFa: c.title.fa,
      titleEn: c.title.en,
      title: pick(c.title, l),
      level: pick(c.level, l),
      age: c.age,
      price: c.price,
      sessionsCount: c.sessionsCount,
      languageFa: languageLabel(c.language, "fa"),
      languageEn: languageLabel(c.language, "en"),
    })),
    teachers: teachers.map((t) => ({
      slug: t.slug,
      name: pick(t.name, l),
      languages: pick(t.languages, l),
      specialty: pick(t.specialty, l),
    })),
    bookCount: books.length,
  };

  return (
    <>
      <Hero dict={dict} locale={l} />
      <CourseDiscovery dict={dict} locale={l} categories={categories} />
      <WhyNeshat dict={dict} locale={l} />
      <Courses dict={dict} locale={l} courses={courses} categories={categories} />
      <Teachers dict={dict} locale={l} teachers={pickRandom(teachers, 4)} />
      <LearningModes dict={dict} locale={l} />
      <EventsTeaser events={events} locale={l} />
      <Books dict={dict} locale={l} books={pickRandom(books, 6)} />
      <Journal dict={dict} locale={l} posts={posts} />
      <TeacherTraining dict={dict} locale={l} />
      <StudentExperience dict={dict} locale={l} />
      <CallToAction dict={dict} locale={l} />
      <ChatBot locale={l} knowledge={knowledge} />
    </>
  );
}

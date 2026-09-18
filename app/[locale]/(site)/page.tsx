import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import { getCategories, getCourses, getTeachers, getBooks, getPosts } from "@/lib/data/public";

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
  const [courses, teachers, books, posts] = await Promise.all([
    getCourses(),
    getTeachers(),
    getBooks(),
    getPosts(),
  ]);

  return (
    <>
      <Hero dict={dict} locale={l} />
      <CourseDiscovery dict={dict} locale={l} categories={categories} />
      <WhyNeshat dict={dict} locale={l} />
      <Courses dict={dict} locale={l} courses={courses} categories={categories} />
      <Teachers dict={dict} locale={l} teachers={teachers} />
      <LearningModes dict={dict} locale={l} />
      <Books dict={dict} locale={l} books={books} />
      <Journal dict={dict} locale={l} posts={posts} />
      <TeacherTraining dict={dict} locale={l} />
      <StudentExperience dict={dict} locale={l} />
      <CallToAction dict={dict} locale={l} />
    </>
  );
}

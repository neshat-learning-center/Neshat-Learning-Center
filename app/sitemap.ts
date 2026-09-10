import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getCourses, getTeachers, getBooks, getPosts } from "@/lib/data/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/courses",
  "/teachers",
  "/books",
  "/classes",
  "/journal",
  "/about",
  "/teacher-training",
  "/placement",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, teachers, books, posts] = await Promise.all([
    getCourses(),
    getTeachers(),
    getBooks(),
    getPosts(),
  ]);

  const dynamicPaths = [
    ...courses.map((c) => `/courses/${c.slug}`),
    ...teachers.map((t) => `/teachers/${t.slug}`),
    ...books.map((b) => `/books/${b.slug}`),
    ...posts.map((p) => `/journal/${p.slug}`),
  ];

  const allPaths = [...STATIC_PATHS, ...dynamicPaths];

  return locales.flatMap((locale) =>
    allPaths.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
    })),
  );
}

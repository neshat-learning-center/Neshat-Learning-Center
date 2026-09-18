import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category, Course, Teacher, Book, Post, CourseCategory, CourseLanguage, LanguageKey } from "@/content/types";
import { categories as seedCategories } from "@/content/categories";
import { courses as seedCourses } from "@/content/courses";
import { teachers as seedTeachers } from "@/content/teachers";
import { books as seedBooks } from "@/content/books";
import { posts as seedPosts } from "@/content/journal";
import type { CourseRow, Profile, BookRow, BlogPostRow } from "@/lib/supabase/types";

export { languageLabel, categoryLabel } from "@/lib/labels";

/**
 * Public content layer: reads from Supabase when it's configured and has
 * rows, otherwise falls back to the static seed content in `content/`. This
 * means the site looks the same on day one (no backend yet) and starts
 * reflecting real data the moment courses/teachers/books/posts are added in
 * Supabase — no code changes needed at that point.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---- categories — editorial, not database-backed (see content/categories.ts) ----
export function getCategories(): Category[] {
  return seedCategories;
}

// ---- row → app-type mapping ----
const BOOK_SPINES: [string, string][] = [
  ["#2b2a2d", "#3a383c"],
  ["#f4b223", "#dd9c0c"],
  ["#3a383c", "#55535a"],
  ["#262528", "#2b2a2d"],
  ["#dd9c0c", "#f4b223"],
];

function spineFromSlug(slug: string): [string, string] {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return BOOK_SPINES[hash % BOOK_SPINES.length];
}

type CourseBooksRel = { course_books?: { books: { slug: string | null } | { slug: string | null }[] | null }[] | null };

function bookSlugsFromRow(row: CourseBooksRel): string[] {
  return (row.course_books ?? [])
    .map((cb) => (Array.isArray(cb.books) ? cb.books[0] : cb.books))
    .map((b) => b?.slug)
    .filter((s): s is string => !!s);
}

function mapCourse(row: CourseRow & CourseBooksRel): Course {
  return {
    slug: row.slug,
    title: row.title,
    language: row.language as CourseLanguage,
    category: row.category as CourseCategory,
    level: row.level ?? { fa: "", en: "" },
    age: (row.age_group as Course["age"]) ?? "adults",
    image: row.cover_url ?? undefined,
    bookSlugs: bookSlugsFromRow(row),
    summary: row.summary ?? { fa: "", en: "" },
  };
}

function mapTeacher(row: Profile): Teacher {
  return {
    slug: row.slug ?? row.id,
    name: { fa: row.full_name ?? "", en: row.full_name ?? "" },
    languages: row.languages ?? { fa: "", en: "" },
    specialty: row.specialty ?? { fa: "", en: "" },
    bio: row.bio ?? { fa: "", en: "" },
    image: row.avatar_url ?? undefined,
  };
}

function mapBook(row: BookRow): Book {
  return {
    slug: row.slug,
    title: row.title,
    language: (row.language as LanguageKey) ?? "english",
    level: row.level ?? { fa: "", en: "" },
    kind: row.kind ?? { fa: "", en: "" },
    description: row.description ?? undefined,
    fileUrl: row.file_url ?? undefined,
    cover: row.cover_url ?? undefined,
    spine: spineFromSlug(row.slug),
  };
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function mapPost(row: BlogPostRow): Post {
  const body =
    row.body?.fa && row.body?.en
      ? { fa: splitParagraphs(row.body.fa), en: splitParagraphs(row.body.en) }
      : undefined;
  return {
    slug: row.slug,
    title: row.title,
    category: row.category ?? { fa: "", en: "" },
    excerpt: row.excerpt ?? { fa: "", en: "" },
    body,
    minRead: row.min_read ?? 4,
    image: row.cover_url ?? undefined,
  };
}

// ---- courses ----
export async function getCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return seedCourses;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*, course_books(books(slug))")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return seedCourses;
    return data.map(mapCourse);
  } catch {
    return seedCourses;
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  if (!isSupabaseConfigured()) return seedCourses.find((c) => c.slug === slug);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*, course_books(books(slug))")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return seedCourses.find((c) => c.slug === slug);
    return mapCourse(data);
  } catch {
    return seedCourses.find((c) => c.slug === slug);
  }
}

export async function getRelatedCourses(
  slug: string,
  language: CourseLanguage,
  limit = 2,
): Promise<Course[]> {
  const all = await getCourses();
  return all.filter((c) => c.slug !== slug && c.language === language).slice(0, limit);
}

// ---- teachers ----
export async function getTeachers(): Promise<Teacher[]> {
  if (!isSupabaseConfigured()) return seedTeachers;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return seedTeachers;
    return data.map(mapTeacher);
  } catch {
    return seedTeachers;
  }
}

/** Resolves a teacher by friendly slug, falling back to raw id for teachers without one yet. */
async function findTeacherRow(slugOrId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const bySlug = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher")
    .eq("slug", slugOrId)
    .maybeSingle();
  if (bySlug.data) return bySlug.data;

  if (UUID_RE.test(slugOrId)) {
    const byId = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .eq("id", slugOrId)
      .maybeSingle();
    if (byId.data) return byId.data;
  }
  return null;
}

export async function getTeacherBySlug(slug: string): Promise<Teacher | undefined> {
  if (!isSupabaseConfigured()) return seedTeachers.find((t) => t.slug === slug);
  try {
    const row = await findTeacherRow(slug);
    return row ? mapTeacher(row) : seedTeachers.find((t) => t.slug === slug);
  } catch {
    return seedTeachers.find((t) => t.slug === slug);
  }
}

export interface TaughtClass {
  classId: string;
  courseSlug: string;
  title: Course["title"];
  level: Course["level"];
}

/** The classes a teacher currently teaches, with enough of the parent
 * course's info to link to and label it — teachers are a class-level
 * concern, not a course-level one, so this walks classes -> courses. */
export async function getClassesByTeacher(slug: string): Promise<TaughtClass[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const row = await findTeacherRow(slug);
    if (!row) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("classes")
      .select("id, course:courses(slug, title, level)")
      .eq("teacher_id", row.id);
    if (error || !data) return [];
    return data
      .map((c) => {
        const rel = c.course as unknown;
        const course = (Array.isArray(rel) ? rel[0] : rel) as
          | { slug: string; title: Course["title"]; level: Course["level"] | null }
          | undefined;
        if (!course) return null;
        return {
          classId: c.id,
          courseSlug: course.slug,
          title: course.title,
          level: course.level ?? { fa: "", en: "" },
        };
      })
      .filter((c): c is TaughtClass => !!c);
  } catch {
    return [];
  }
}

// ---- books ----
export async function getBooks(): Promise<Book[]> {
  if (!isSupabaseConfigured()) return seedBooks;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return seedBooks;
    return data.map(mapBook);
  } catch {
    return seedBooks;
  }
}

export async function getBookBySlug(slug: string): Promise<Book | undefined> {
  if (!isSupabaseConfigured()) return seedBooks.find((b) => b.slug === slug);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("books").select("*").eq("slug", slug).maybeSingle();
    if (error || !data) return seedBooks.find((b) => b.slug === slug);
    return mapBook(data);
  } catch {
    return seedBooks.find((b) => b.slug === slug);
  }
}

// ---- journal ----
export async function getPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return seedPosts;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return seedPosts;
    return data.map(mapPost);
  } catch {
    return seedPosts;
  }
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (!isSupabaseConfigured()) return seedPosts.find((p) => p.slug === slug);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return seedPosts.find((p) => p.slug === slug);
    return mapPost(data);
  } catch {
    return seedPosts.find((p) => p.slug === slug);
  }
}

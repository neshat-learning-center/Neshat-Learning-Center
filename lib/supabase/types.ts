import type { Localized } from "@/lib/i18n/config";

/**
 * Hand-authored database types mirroring supabase/migrations/0001_init.sql.
 * Regenerate with `supabase gen types typescript` once the CLI is connected.
 */
export type Role = "admin" | "teacher" | "student";
export type ClassMode = "offline" | "online" | "both";
export type ClassStatus = "upcoming" | "active" | "finished" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type MaterialKind = "pdf" | "document" | "audio" | "video" | "link";

export interface Profile {
  id: string;
  role: Role;
  slug: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: Localized | null;
  languages: Localized | null;
  specialty: Localized | null;
  created_at: string;
}

export interface CourseRow {
  id: string;
  slug: string;
  title: Localized;
  language: string;
  level: Localized | null;
  age_group: string | null;
  mode: ClassMode;
  summary: Localized | null;
  schedule: Localized | null;
  capacity: number | null;
  teacher_id: string | null;
  price: number | null;
  duration: string | null;
  created_at: string;
}

export interface ClassRow {
  id: string;
  course_id: string | null;
  teacher_id: string | null;
  title: string;
  classroom: string | null;
  schedule: string | null;
  status: ClassStatus;
  online_meeting_url: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  level: string | null;
  progress: number | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  session_date: string;
  status: AttendanceStatus;
}

export interface Material {
  id: string;
  class_id: string | null;
  uploaded_by: string | null;
  title: string;
  kind: MaterialKind;
  url: string;
  created_at: string;
}

export interface HomeworkRow {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  due_date: string | null;
  created_at: string;
}

export interface HomeworkSubmissionRow {
  id: string;
  homework_id: string;
  student_id: string;
  file_url: string | null;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  class_id: string | null;
  author_id: string | null;
  title: string;
  body: string | null;
  audience: Role | "all";
  created_at: string;
}

export interface BookRow {
  id: string;
  slug: string;
  title: Localized;
  language: string | null;
  level: Localized | null;
  kind: Localized | null;
  description: Localized | null;
  cover_url: string | null;
  file_url: string | null;
  created_at: string;
}

export interface BlogPostRow {
  id: string;
  slug: string;
  title: Localized;
  category: Localized | null;
  excerpt: Localized | null;
  body: Localized | null;
  min_read: number | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  kind: "placement" | "contact";
  name: string;
  phone: string;
  email: string | null;
  language: string | null;
  level: string | null;
  message: string | null;
  contacted: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      courses: { Row: CourseRow };
      classes: { Row: ClassRow };
      enrollments: { Row: Enrollment };
      attendance: { Row: Attendance };
      materials: { Row: Material };
      homeworks: { Row: HomeworkRow };
      homework_submissions: { Row: HomeworkSubmissionRow };
      announcements: { Row: Announcement };
      books: { Row: BookRow };
      blog_posts: { Row: BlogPostRow };
      leads: { Row: Lead };
    };
  };
}

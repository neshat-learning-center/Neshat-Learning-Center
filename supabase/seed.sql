-- =============================================================================
-- Neshat Learning Center — seed data
-- Mirrors the placeholder content in content/*.ts so the site shows the same
-- thing whether it reads from Supabase or falls back to static seed content.
-- Safe to re-run — every insert is keyed by its unique slug.
--
-- NOTE on teachers: profiles are 1:1 with auth.users, so they can't be
-- seeded by plain SQL — a teacher has to actually sign up (or be created via
-- Supabase Dashboard → Authentication → Add user) before a profile row
-- exists for them. Once you have real teacher accounts, see the commented
-- example at the bottom of this file for assigning them to courses.
-- =============================================================================

-- courses ----------------------------------------------------------------
insert into public.courses (slug, title, language, level, age_group, mode, summary, schedule, capacity)
values
  ('english-conversation-adults',
   jsonb_build_object('fa', $$مکالمهٔ انگلیسی بزرگسالان$$, 'en', $$English Conversation — Adults$$),
   'english',
   jsonb_build_object('fa', $$متوسط$$, 'en', $$Intermediate$$),
   'adults', 'both',
   jsonb_build_object('fa', $$تمرکز بر گفت‌وگوی روان و طبیعی در موقعیت‌های واقعی.$$, 'en', $$Focused on fluent, natural conversation in real situations.$$),
   jsonb_build_object('fa', $$شنبه و دوشنبه$$, 'en', $$Sat & Mon$$),
   12),

  ('ielts-intensive',
   jsonb_build_object('fa', $$آیلتس فشرده$$, 'en', $$IELTS Intensive$$),
   'ielts',
   jsonb_build_object('fa', $$پیشرفته$$, 'en', $$Advanced$$),
   'adults', 'both',
   jsonb_build_object('fa', $$آمادگی هدفمند برای چهار مهارت آزمون آیلتس.$$, 'en', $$Targeted preparation across all four IELTS skills.$$),
   jsonb_build_object('fa', $$یکشنبه و سه‌شنبه$$, 'en', $$Sun & Tue$$),
   8),

  ('german-a1',
   jsonb_build_object('fa', $$آلمانی پایه A1$$, 'en', $$German A1$$),
   'german',
   jsonb_build_object('fa', $$پایه$$, 'en', $$Beginner$$),
   'adults', 'offline',
   jsonb_build_object('fa', $$شروع اصولی آلمانی، از الفبا تا جمله‌سازی روزمره.$$, 'en', $$A solid start in German, from the alphabet to everyday sentences.$$),
   jsonb_build_object('fa', $$پنجشنبه$$, 'en', $$Thursdays$$),
   14),

  ('turkish-conversation',
   jsonb_build_object('fa', $$مکالمهٔ ترکی استانبولی$$, 'en', $$Turkish Conversation$$),
   'turkish',
   jsonb_build_object('fa', $$پایه تا متوسط$$, 'en', $$Beginner–Intermediate$$),
   'adults', 'online',
   jsonb_build_object('fa', $$مکالمهٔ کاربردی برای سفر، کار و زندگی.$$, 'en', $$Practical conversation for travel, work, and life.$$),
   jsonb_build_object('fa', $$دوشنبه$$, 'en', $$Mondays$$),
   12),

  ('kids-english',
   jsonb_build_object('fa', $$انگلیسی کودکان$$, 'en', $$English for Kids$$),
   'kids',
   jsonb_build_object('fa', $$خردسال$$, 'en', $$Young learners$$),
   'kids', 'offline',
   jsonb_build_object('fa', $$یادگیری زبان از راه بازی، داستان و فعالیت گروهی.$$, 'en', $$Learning through play, stories, and group activity.$$),
   jsonb_build_object('fa', $$چهارشنبه$$, 'en', $$Wednesdays$$),
   10),

  ('teens-english',
   jsonb_build_object('fa', $$انگلیسی نوجوانان$$, 'en', $$English for Teens$$),
   'kids',
   jsonb_build_object('fa', $$متوسط$$, 'en', $$Intermediate$$),
   'teens', 'both',
   jsonb_build_object('fa', $$پلی میان درس مدرسه و زبانِ واقعی و روزمره.$$, 'en', $$A bridge between school lessons and real, everyday language.$$),
   jsonb_build_object('fa', $$سه‌شنبه$$, 'en', $$Tuesdays$$),
   12)
on conflict (slug) do nothing;

-- books --------------------------------------------------------------------
insert into public.books (slug, title, language, level, kind)
values
  ('neshat-conversation-notebook',
   jsonb_build_object('fa', $$دفترچهٔ مکالمهٔ نشاط$$, 'en', $$Neshat Conversation Notebook$$),
   'english',
   jsonb_build_object('fa', $$متوسط$$, 'en', $$Intermediate$$),
   jsonb_build_object('fa', $$منبع نشاط$$, 'en', $$Neshat resource$$)),

  ('everyday-vocabulary',
   jsonb_build_object('fa', $$واژگان روزمره$$, 'en', $$Everyday Vocabulary$$),
   'english',
   jsonb_build_object('fa', $$پایه$$, 'en', $$Beginner$$),
   jsonb_build_object('fa', $$کتاب کار$$, 'en', $$Workbook$$)),

  ('german-first-steps',
   jsonb_build_object('fa', $$قدم‌های اول آلمانی$$, 'en', $$German First Steps$$),
   'german',
   jsonb_build_object('fa', $$پایه$$, 'en', $$Beginner$$),
   jsonb_build_object('fa', $$کتاب درسی$$, 'en', $$Coursebook$$)),

  ('ielts-writing-guide',
   jsonb_build_object('fa', $$راهنمای رایتینگ آیلتس$$, 'en', $$IELTS Writing Guide$$),
   'ielts',
   jsonb_build_object('fa', $$پیشرفته$$, 'en', $$Advanced$$),
   jsonb_build_object('fa', $$راهنما$$, 'en', $$Guide$$)),

  ('stories-for-kids',
   jsonb_build_object('fa', $$قصه‌هایی برای کودکان$$, 'en', $$Stories for Kids$$),
   'kids',
   jsonb_build_object('fa', $$خردسال$$, 'en', $$Young learners$$),
   jsonb_build_object('fa', $$کتاب داستان$$, 'en', $$Storybook$$))
on conflict (slug) do nothing;

-- journal / blog -------------------------------------------------------------
insert into public.blog_posts (slug, title, category, excerpt, min_read, published)
values
  ('speaking-from-day-one',
   jsonb_build_object('fa', $$چرا از جلسهٔ اول باید حرف بزنیم؟$$, 'en', $$Why you should speak from day one$$),
   jsonb_build_object('fa', $$نکات زبان$$, 'en', $$Language tips$$),
   jsonb_build_object('fa', $$ترسِ اشتباه‌کردن بزرگ‌ترین مانع مکالمه است؛ در این نوشته دربارهٔ عبور از آن حرف می‌زنیم.$$, 'en', $$Fear of mistakes is the biggest barrier to speaking. Here's how to move past it.$$),
   4, true),

  ('common-mistakes-fa-speakers',
   jsonb_build_object('fa', $$اشتباه‌های رایج فارسی‌زبان‌ها در انگلیسی$$, 'en', $$Common English mistakes by Persian speakers$$),
   jsonb_build_object('fa', $$اشتباهات رایج$$, 'en', $$Common mistakes$$),
   jsonb_build_object('fa', $$چند الگوی تکرارشونده که با کمی دقت به‌سادگی برطرف می‌شوند.$$, 'en', $$A few recurring patterns that are easy to fix with a little attention.$$),
   6, true),

  ('vocabulary-that-sticks',
   jsonb_build_object('fa', $$واژه‌هایی که در ذهن می‌مانند$$, 'en', $$Vocabulary that sticks$$),
   jsonb_build_object('fa', $$Vocabulary$$, 'en', $$Vocabulary$$),
   jsonb_build_object('fa', $$یادگیری لغت با داستان و بافت، به‌جای فهرست‌های خشک.$$, 'en', $$Learning words through story and context, instead of dry lists.$$),
   5, true),

  ('choosing-your-first-book',
   jsonb_build_object('fa', $$اولین کتابت را چطور انتخاب کنی؟$$, 'en', $$How to choose your first book$$),
   jsonb_build_object('fa', $$معرفی کتاب$$, 'en', $$Book picks$$),
   jsonb_build_object('fa', $$راهنمای کوتاهی برای انتخاب منبعی که با سطح تو جور باشد.$$, 'en', $$A short guide to picking a resource that matches your level.$$),
   4, true)
on conflict (slug) do nothing;

-- =============================================================================
-- Assigning teachers to courses (manual, after real accounts exist)
-- =============================================================================
-- 1. Create the teacher's account — either have them sign up at /signup, or
--    create one yourself: Supabase Dashboard → Authentication → Add user.
-- 2. Promote + fill in their public profile (replace the uuid and text):
--
--   update public.profiles set
--     role = 'teacher',
--     slug = 'ali-rezaei',
--     specialty = jsonb_build_object('fa', 'مکالمهٔ بزرگسالان', 'en', 'Adult conversation'),
--     languages = jsonb_build_object('fa', 'انگلیسی · مکالمه', 'en', 'English · Conversation'),
--     bio = jsonb_build_object('fa', 'معرفی کوتاه مدرس…', 'en', 'A short teacher bio…')
--   where id = '00000000-0000-0000-0000-000000000000';
--
-- 3. Assign them to a course:
--
--   update public.courses set teacher_id = '00000000-0000-0000-0000-000000000000'
--   where slug = 'english-conversation-adults';

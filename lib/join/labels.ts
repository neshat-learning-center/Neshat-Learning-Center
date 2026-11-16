import type { Locale } from "@/lib/i18n/config";

type Pair = readonly [fa: string, en: string];

/** Copy for the class join-code feature (student card + teacher/admin panel). Persian first. */
export const J = {
  // student
  title: ["کلاسِ فعلی‌ات را به حسابت وصل کن", "Already in a class? Link it to your account"],
  lead: [
    "اگر پیش‌تر در یکی از کلاس‌های نشاط ثبت‌نام کرده‌ای، کدِ کلاس را از مدرس یا آموزشگاه بگیر و اینجا وارد کن؛ کلاست همین‌جا در پروفایلت ظاهر می‌شود.",
    "If you already study at Neshat, get your class code from your teacher or the institute and enter it here. Your class will appear on your profile.",
  ],
  codeLabel: ["کد کلاس", "Class code"],
  codePh: ["مثلاً K7M2-9QXA", "e.g. K7M2-9QXA"],
  joinBtn: ["پیوستن به کلاس", "Join class"],
  joining: ["در حال بررسی…", "Checking…"],
  noCode: ["کد را ندارم", "I don't have the code"],
  haveCode: ["کد را دارم", "I have the code"],
  pickClass: ["کلاسِ خودت را انتخاب کن", "Choose your class"],
  pickPh: ["یک کلاس را انتخاب کن…", "Select a class…"],
  sendRequest: ["ارسال درخواست", "Send request"],
  requestHint: [
    "درخواستت برای مدرسِ آن کلاس ارسال می‌شود؛ بعد از تأیید، کلاس در داشبوردت ظاهر می‌شود.",
    "Your request goes to that class's teacher. Once approved, the class shows up on your dashboard.",
  ],
  noClasses: ["فعلاً کلاسِ بازی برای درخواست وجود ندارد.", "There are no open classes to request right now."],
  pendingTitle: ["درخواست‌های در انتظار تأیید", "Requests awaiting approval"],
  waiting: ["در انتظار تأیید مدرس", "Waiting for the teacher"],
  cancel: ["لغو درخواست", "Cancel request"],
  joined: ["به کلاس پیوستی؛ حالا در بخش «کلاس‌های من» می‌بینی‌اش.", "You've joined the class — find it under “My classes”."],
  already: ["پیش‌تر در این کلاس عضو بودی.", "You're already in this class."],
  invalid: ["این کد درست نیست. دوباره بررسی کن یا از مدرس بپرس.", "That code isn't right. Check it again or ask your teacher."],
  full: ["ظرفیت این کلاس تکمیل است. با آموزشگاه تماس بگیر.", "This class is full. Please contact the institute."],
  closed: ["این کلاس دیگر فعال نیست.", "This class is no longer active."],
  pending: ["درخواستت ارسال شد. پس از تأیید مدرس، کلاس در داشبوردت ظاهر می‌شود.", "Request sent. The class appears on your dashboard once the teacher approves."],
  tooMany: ["تلاش‌های ناموفق زیاد بود. چند دقیقه بعد دوباره امتحان کن.", "Too many tries. Please wait a few minutes and try again."],
  generic: ["مشکلی پیش آمد. دوباره تلاش کن.", "Something went wrong. Please try again."],
  notConnected: ["این بخش فقط با اتصال به پایگاه داده کار می‌کند.", "This needs the database to be connected."],

  signupNote: [
    "قبلاً در یکی از کلاس‌های نشاط بوده‌ای؟ بعد از ساخت حساب، کدِ کلاس را در داشبوردت وارد کن تا کلاست به پروفایلت وصل شود.",
    "Already studying at Neshat? After creating your account, enter your class code on your dashboard to link your class.",
  ],

  // teacher / admin
  panelTitle: ["کد پیوستن به کلاس", "Class join code"],
  panelHelp: [
    "این کد را در گروه کلاس (واتساپ، تلگرام و…) بفرست تا زبان‌آموزانِ فعلی خودشان به کلاس بپیوندند؛ نیازی به وارد کردن دستیِ اسامی نیست.",
    "Share this code in the class group (WhatsApp, Telegram…) so current students join themselves. No need to type names in.",
  ],
  copy: ["کپی", "Copy"],
  copied: ["کپی شد", "Copied"],
  regenerate: ["ساخت کد جدید", "Generate new code"],
  regenerateConfirm: ["کد قبلی از کار می‌افتد. ادامه می‌دهی؟", "The old code will stop working. Continue?"],
  requireApproval: ["هر زبان‌آموز باید تأیید شود", "Approve each student"],
  requireApprovalHelp: [
    "اگر روشن باشد، کد فقط درخواست می‌سازد و پیوستن بعد از تأیید شما انجام می‌شود.",
    "When on, the code only creates a request and the student joins after you approve.",
  ],
  requestsTitle: ["درخواست‌های پیوستن", "Join requests"],
  noRequests: ["درخواستی در انتظار نیست.", "No requests waiting."],
  approve: ["تأیید", "Approve"],
  reject: ["رد", "Reject"],
  viaCode: ["با کد", "via code"],
  viaList: ["بدون کد", "no code"],
  classFull: ["ظرفیت کلاس تکمیل است؛ اول ظرفیت را بیشتر کن.", "The class is full — raise its capacity first."],
} as const satisfies Record<string, Pair>;

export type JKey = keyof typeof J;

export function jt(locale: Locale) {
  return (k: JKey) => J[k][locale === "fa" ? 0 : 1];
}

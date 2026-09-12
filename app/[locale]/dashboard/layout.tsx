import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { getMyProfile } from "@/lib/dashboard/data";
import { href } from "@/lib/utils";
import { Shell } from "@/components/dashboard/Shell";
import { ProfileShell } from "@/components/dashboard/ProfileShell";

// Private account/admin area — never indexed by search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  const session = await getSession();
  if (!session) redirect(href(l, "/login"));

  // Admin keeps the sidebar dashboard; students/teachers get a personal
  // profile experience instead — same brand, very different shape.
  if (session.role === "admin") {
    return (
      <Shell dict={dict} locale={l} session={session}>
        {children}
      </Shell>
    );
  }

  const profile = await getMyProfile(session);
  return (
    <ProfileShell dict={dict} locale={l} session={session} profile={profile}>
      {children}
    </ProfileShell>
  );
}

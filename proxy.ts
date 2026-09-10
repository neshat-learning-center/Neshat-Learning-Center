import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (!hasLocale) {
    // Persian is the site's default for every visitor, regardless of browser
    // language — English is an opt-in the user reaches via the FA/EN toggle.
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // locale present — refresh the auth session cookies
  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/auth";
import type { Role } from "@/lib/supabase/types";
import type { Locale } from "@/lib/i18n/config";

export async function enterDemo(role: Role, locale: Locale) {
  const store = await cookies();
  store.set(DEMO_COOKIE, role, { path: "/", maxAge: 60 * 60 * 8 });
  redirect(`/${locale}/dashboard`);
}

export async function signOut(locale: Locale) {
  const store = await cookies();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  store.delete(DEMO_COOKIE);
  redirect(`/${locale}`);
}

export type SignInState = { error?: string };

export async function signIn(
  locale: Locale,
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!isSupabaseConfigured()) {
    return { error: "not-configured" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(`/${locale}/dashboard`);
}

export type SignUpState = { error?: string; checkEmail?: boolean };

/** Self-registration always creates a `student` account (see the `handle_new_user` trigger). */
export async function signUp(
  locale: Locale,
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const fullName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  if (!isSupabaseConfigured()) {
    return { error: "not-configured" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  // If email confirmation is off, signUp returns an active session right
  // away — in that case we can also save the phone number the trigger
  // doesn't know about. If confirmation is required, there's no session yet;
  // the user can fill in their phone later from their profile page.
  if (data.session && phone) {
    await supabase.from("profiles").update({ phone }).eq("id", data.user!.id);
  }

  if (!data.session) {
    return { checkEmail: true };
  }
  redirect(`/${locale}/dashboard`);
}

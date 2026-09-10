"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Profile, Role } from "@/lib/supabase/types";
import { href } from "@/lib/utils";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";
import { FileUploadField } from "@/components/admin/FileUploadField";

const field =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";
const label = "text-sm font-medium text-ink";

export function ProfileForm({
  dict,
  locale,
  role,
  email,
  profile,
}: {
  dict: Dictionary;
  locale: Locale;
  role: Role;
  email?: string;
  profile: Profile;
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile.bind(null, locale, role),
    {},
  );
  const p = dict.profile;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={label}>{p.name}</span>
          <input name="name" defaultValue={profile.full_name ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={label}>{p.phone}</span>
          <input
            name="phone"
            type="tel"
            dir="ltr"
            defaultValue={profile.phone ?? ""}
            className={`${field} text-start`}
          />
        </label>
      </div>

      {email && (
        <label className="flex flex-col gap-2">
          <span className={label}>{p.email}</span>
          <input value={email} disabled dir="ltr" className={`${field} text-start opacity-60`} />
        </label>
      )}

      <FileUploadField
        bucket="avatars"
        pathPrefix={profile.id}
        accept="image/*"
        hiddenInputName="avatar_url"
        currentUrl={profile.avatar_url}
        previewAsImage
        label={p.avatarUrl}
        note={p.avatarNote}
        chooseLabel={dict.admin.chooseFile}
        changeLabel={dict.admin.changeFile}
        uploadingLabel={dict.admin.uploading}
      />

      {role === "teacher" && (
        <>
          <div className="hair" />
          <label className="flex flex-col gap-2">
            <span className={label}>{p.slug}</span>
            <input
              name="slug"
              dir="ltr"
              defaultValue={profile.slug ?? ""}
              className={`${field} text-start`}
              placeholder="ali-rezaei"
            />
            <span className="text-xs text-muted">{p.slugNote}</span>
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={label}>{p.specialtyFa}</span>
              <input name="specialty_fa" defaultValue={profile.specialty?.fa ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={label}>{p.specialtyEn}</span>
              <input
                name="specialty_en"
                dir="ltr"
                defaultValue={profile.specialty?.en ?? ""}
                className={`${field} text-start`}
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={label}>{p.languagesFa}</span>
              <input name="languages_fa" defaultValue={profile.languages?.fa ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={label}>{p.languagesEn}</span>
              <input
                name="languages_en"
                dir="ltr"
                defaultValue={profile.languages?.en ?? ""}
                className={`${field} text-start`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className={label}>{p.bioFa}</span>
            <textarea name="bio_fa" rows={4} defaultValue={profile.bio?.fa ?? ""} className={`${field} resize-none`} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={label}>{p.bioEn}</span>
            <textarea
              name="bio_en"
              dir="ltr"
              rows={4}
              defaultValue={profile.bio?.en ?? ""}
              className={`${field} resize-none text-start`}
            />
          </label>

          {profile.slug && (
            <Link
              href={href(locale, `/teachers/${profile.slug}`)}
              target="_blank"
              className="text-sm font-medium text-accent-deep underline-offset-4 hover:underline"
            >
              {p.publicProfile} ↗
            </Link>
          )}
        </>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-accent-deep">{p.saved}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? p.saving : p.save}
      </button>
    </form>
  );
}

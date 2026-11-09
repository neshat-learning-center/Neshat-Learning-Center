"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";
import { EVENT_STATUSES, type EventItem, type EventCategory } from "@/lib/events/types";
import { isoToTehranParts } from "@/lib/events/time";
import { saveEvent, type EvState } from "@/lib/actions/admin/events";
import { Field, TextInput, TextArea, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";
import { MoneyInput } from "@/components/finance/FinForm";
import { CoverUpload, GalleryUpload } from "./ImageFields";
import { ProgramEditor } from "./ProgramEditor";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
      <legend className="mb-1 flex items-center gap-3 text-sm font-bold text-ink"><span className="h-4 w-1 bg-accent" />{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({ name, label, defaultChecked, onChange }: { name: string; label: string; defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} onChange={(e) => onChange?.(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent-deep)]" />
      {label}
    </label>
  );
}

export function EventForm({ locale, event, categories, folderKey }: { locale: Locale; event?: EventItem; categories: EventCategory[]; folderKey: string }) {
  const t = makeET(locale);
  const [state, action, pending] = useActionState<EvState, FormData>(saveEvent.bind(null, locale, event?.id ?? null), {});
  const [paid, setPaid] = useState(event?.isPaid ?? false);
  const start = isoToTehranParts(event?.startsAt);
  const end = isoToTehranParts(event?.endsAt);
  const dl = isoToTehranParts(event?.deadline);
  const two = (a: string, b: string, labelA: string, labelB: string, vA?: string, vB?: string) => (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={labelA}><TextInput name={a} defaultValue={vA ?? ""} /></Field>
      <Field label={labelB}><TextInput name={b} defaultValue={vB ?? ""} dir="ltr" className="text-start" /></Field>
    </div>
  );
  const twoArea = (a: string, b: string, labelA: string, labelB: string, vA?: string, vB?: string, rows = 4, hint?: string) => (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={labelA} note={hint}><TextArea name={a} rows={rows} defaultValue={vA ?? ""} /></Field>
      <Field label={labelB}><TextArea name={b} rows={rows} defaultValue={vB ?? ""} dir="ltr" className="text-start" /></Field>
    </div>
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      <Group title={t("about")}>
        {two("title_fa", "title_en", t("a_titleFa"), t("a_titleEn"), event?.title.fa, event?.title.en)}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("category")}>
            <Select name="category_id" defaultValue={event?.category?.id ?? ""}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.title[locale]}</option>)}
            </Select>
          </Field>
          <Field label={t("a_slug")}><TextInput name="slug" dir="ltr" className="text-start" defaultValue={event?.slug ?? ""} placeholder="movie-night-december" /></Field>
        </div>
        {twoArea("summary_fa", "summary_en", t("a_summaryFa"), t("a_summaryEn"), event?.summary?.fa, event?.summary?.en, 2)}
        {twoArea("description_fa", "description_en", t("a_descFa"), t("a_descEn"), event?.description?.fa, event?.description?.en, 7, t("a_descHint"))}
      </Group>

      <Group title={t("date")}>
        <p className="text-sm text-muted">{t("a_tzNote")}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("a_startDate")}><DatePicker name="start_date" locale={locale} defaultValue={start.date} required /></Field>
          <Field label={t("a_startTime")}><TextInput type="time" name="start_time" required dir="ltr" className="text-start" defaultValue={start.time || "18:00"} /></Field>
          <Field label={t("a_endDate")}><DatePicker name="end_date" locale={locale} defaultValue={end.date} /></Field>
          <Field label={t("a_endTime")}><TextInput type="time" name="end_time" dir="ltr" className="text-start" defaultValue={end.time} /></Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("a_deadlineDate")}><DatePicker name="deadline_date" locale={locale} defaultValue={dl.date} /></Field>
          <Field label={t("a_deadlineTime")}><TextInput type="time" name="deadline_time" dir="ltr" className="text-start" defaultValue={dl.time || "23:59"} /></Field>
        </div>
      </Group>

      <Group title={t("venue")}>
        {two("venue_fa", "venue_en", t("a_venueFa"), t("a_venueEn"), event?.venue?.fa, event?.venue?.en)}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("a_address")}><TextInput name="address" defaultValue={event?.address ?? ""} /></Field>
          <Field label={t("a_mapUrl")}><TextInput name="map_url" type="url" dir="ltr" className="text-start" defaultValue={event?.mapUrl ?? ""} placeholder="https://maps.google.com/…" /></Field>
        </div>
        {two("organizer_fa", "organizer_en", t("a_orgFa"), t("a_orgEn"), event?.organizer?.fa, event?.organizer?.en)}
      </Group>

      <Group title={t("seats")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("a_capacity")}><TextInput name="capacity" type="number" min={1} dir="ltr" className="text-start" defaultValue={event?.capacity ?? ""} /></Field>
          <Field label={t("a_maxPer")}><TextInput name="max_per_registration" type="number" min={1} dir="ltr" className="text-start" defaultValue={event?.maxPerRegistration ?? 5} /></Field>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Check name="allow_waitlist" label={t("a_waitlist")} defaultChecked={event?.allowWaitlist ?? true} />
          <Check name="auto_confirm" label={t("a_autoConfirm")} defaultChecked={event?.autoConfirm ?? true} />
        </div>
        <div className="flex flex-col gap-4">
          <Check name="is_paid" label={t("a_paid")} defaultChecked={paid} onChange={setPaid} />
          {paid && (
            <div className="max-w-xs"><Field label={t("a_priceToman")}><MoneyInput name="price" locale={locale} defaultValue={event?.price || undefined} /></Field></div>
          )}
        </div>
      </Group>

      <Group title={t("program")}>
        <ProgramEditor name="program_json" initial={event?.program ?? []} locale={locale} />
        {twoArea("req_fa", "req_en", t("a_reqFa"), t("a_reqEn"), event?.requirements?.fa.join("\n"), event?.requirements?.en.join("\n"), 4)}
      </Group>

      <Group title={t("gallery")}>
        <CoverUpload name="cover_url" current={event?.cover} folder={folderKey} locale={locale} />
        <GalleryUpload name="gallery_json" initial={(event?.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? "" }))} folder={folderKey} locale={locale} />
      </Group>

      <Group title={t("a_status")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("a_status")}>
            <Select name="status" defaultValue={event?.status ?? "draft"}>
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{t(`es_${s}` as "es_draft")}</option>)}
            </Select>
          </Field>
        </div>
        <Check name="is_featured" label={t("a_featured")} defaultChecked={event?.featured} />
      </Group>

      <div className="sticky bottom-0 z-10 -mx-2 flex flex-wrap items-center gap-4 border-t border-line bg-canvas px-2 py-4">
        <button type="submit" disabled={pending} className="rounded-full bg-accent px-8 py-3 font-semibold text-slate transition-colors hover:bg-accent-deep disabled:opacity-60">{pending ? "…" : t("a_save")}</button>
        {state.error && <span role="alert" className="text-sm text-red-600">{state.error}</span>}
        {state.ok && !pending && <span className="max-w-xl text-sm text-accent-deep">✓ {state.message}</span>}
      </div>
    </form>
  );
}

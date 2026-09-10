import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listLeads } from "@/lib/data/admin";
import { markLeadContacted, deleteLead } from "@/lib/actions/admin/leads";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);
  const a = dict.admin;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{a.leadsTitle}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const leads = await listLeads();
  const kindLabel: Record<string, string> = {
    placement: a.leadKindPlacement,
    contact: a.leadKindContact,
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{a.leadsTitle}</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-canvas">
        {leads.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{a.leadName}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadPhone}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadKind}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadDate}</th>
                <th className="px-5 py-3 text-start font-medium">{a.leadContacted}</th>
                <th className="px-5 py-3 text-start font-medium">{a.delete}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((lead) => (
                <tr key={lead.id} className={lead.contacted ? "opacity-60" : ""}>
                  <td className="px-5 py-3 font-medium text-ink">{lead.name}</td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {lead.phone}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{kindLabel[lead.kind] ?? lead.kind}</td>
                  <td className="px-5 py-3 text-ink-soft" dir="ltr">
                    {new Date(lead.created_at).toLocaleDateString(l === "fa" ? "fa-IR" : "en-US")}
                  </td>
                  <td className="px-5 py-3">
                    <form action={markLeadContacted.bind(null, l, lead.id, !lead.contacted)}>
                      <button type="submit" className="text-accent-deep hover:underline">
                        {lead.contacted ? "↩" : a.leadMarkContacted}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3">
                    <ConfirmForm action={deleteLead.bind(null, l, lead.id)} confirmText={a.confirmDelete}>
                      <button type="submit" className="text-red-600 hover:underline">
                        {a.delete}
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

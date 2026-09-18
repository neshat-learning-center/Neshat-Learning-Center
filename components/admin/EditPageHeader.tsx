import { ConfirmForm } from "@/components/admin/ConfirmForm";

/** Title + delete button for an admin "edit X" page — every entity that can
 * be edited should also be deletable from right there, not just from its
 * list page. */
export function EditPageHeader({
  title,
  deleteAction,
  deleteLabel,
  confirmText,
}: {
  title: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteLabel: string;
  confirmText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
      <ConfirmForm action={deleteAction} confirmText={confirmText}>
        <button type="submit" className="shrink-0 text-sm font-medium text-red-600 hover:underline">
          {deleteLabel}
        </button>
      </ConfirmForm>
    </div>
  );
}

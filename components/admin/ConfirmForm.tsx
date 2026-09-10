"use client";

import type { ReactNode } from "react";

/** Wraps a server-action form with a native confirm() before it submits. */
export function ConfirmForm({
  action,
  confirmText,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";

export function Panel({
  id,
  title,
  action,
  children,
}: {
  id?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-canvas p-5 ${className}`}>{children}</div>
  );
}

export function StatTile({
  label,
  value,
  href,
  urgent,
}: {
  label: string;
  value: number | null;
  href?: string;
  urgent?: boolean;
}) {
  const content = (
    <>
      <p className={`numeral text-3xl font-bold ${urgent && value ? "text-accent-deep" : "text-ink"}`}>
        {value ?? "—"}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </>
  );
  const className = `block rounded-lg border p-5 transition-colors ${
    urgent && value ? "border-accent/50 bg-accent-wash hover:border-accent-deep" : "border-line bg-canvas hover:border-line-strong"
  }`;
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-deep">
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">{label}</p>;
}

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "accent" | "ghost" | "link";

const base =
  "group inline-flex items-center gap-2.5 font-medium transition-colors duration-300 ease-[var(--ease-out-soft)]";

const styles: Record<Variant, string> = {
  solid:
    "rounded-full bg-ink text-canvas px-6 py-3 text-[0.95rem] hover:bg-slate",
  accent:
    "rounded-full bg-accent text-slate px-6 py-3 text-[0.95rem] hover:bg-accent-deep",
  ghost:
    "rounded-full border border-line-strong text-ink px-6 py-3 text-[0.95rem] hover:border-ink hover:bg-sand/60",
  link: "text-ink text-[0.95rem] hover:text-accent-deep",
};

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="rtl:-scale-x-100 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
    >
      <path
        d="M3 8h9M8 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Button({
  href,
  children,
  variant = "solid",
  arrow = false,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={cn(base, styles[variant], className)} {...rest}>
      {variant === "link" ? (
        <span className="relative">
          <span className="bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-[length:0%_2px] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-300 ease-[var(--ease-out-soft)] group-hover:bg-[length:100%_2px]">
            {children}
          </span>
        </span>
      ) : (
        children
      )}
      {arrow && <Arrow />}
    </Link>
  );
}

"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Lightweight scroll-reveal. Toggles [data-reveal]/[data-reveal-mask] once the
 * element enters the viewport — CSS in globals.css does the actual transition.
 * No animation library; respects prefers-reduced-motion via CSS.
 */
export function Reveal({
  children,
  as,
  className = "",
  delay = 0,
  mask = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  mask?: boolean;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setShown(true);
      cleanup();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "15% 0px -10% 0px" },
    );
    io.observe(el);

    // Fallback for fast/instant scrolls (scrollbar drags, anchor jumps, full-page
    // screenshot tools): the observer only fires when it happens to sample the
    // element crossing into view, so a quick jump can skip past it entirely and
    // leave it stuck invisible forever. A cheap rect check on scroll/resize
    // (and once on mount, for pages that load already scrolled) reveals
    // anything that's already in view or has been scrolled past.
    let ticking = false;
    const checkRect = () => {
      if (settled || !el.isConnected) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh || rect.bottom < 0) reveal();
    };
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        checkRect();
        ticking = false;
      });
    };
    checkRect();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    function cleanup() {
      io.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    }

    return cleanup;
  }, [shown]);

  const attr = mask ? "data-reveal-mask" : "data-reveal";
  return (
    <Tag
      ref={ref}
      {...{ [attr]: shown ? "in" : "" }}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
      className={className}
    >
      {children}
    </Tag>
  );
}

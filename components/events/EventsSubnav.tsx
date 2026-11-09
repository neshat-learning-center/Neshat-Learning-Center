"use client";

import { useEffect, useState } from "react";

/** Sticky in-page navigation with smooth-scroll anchors; highlights the section being read. */
export function EventsSubnav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5] },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="Events sections" className="sticky top-16 z-40 border-b border-line bg-canvas">
      <div className="section-x">
        <div className="container-editorial no-scrollbar flex gap-1 overflow-x-auto py-1">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${active === i.id ? "text-ink" : "text-muted hover:text-ink"}`}>
              {i.label}
              <span className={`absolute inset-x-4 bottom-1 h-0.5 origin-center bg-accent transition-transform duration-300 ${active === i.id ? "scale-x-100" : "scale-x-0"}`} />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

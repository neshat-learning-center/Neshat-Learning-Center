"use client";

import { useEffect } from "react";

/**
 * Makes every table in the dashboard usable on a phone. On small screens the
 * CSS in globals.css (.rtable) turns each row into a labelled card, so no
 * column — least of all the Actions column — is ever hidden off-screen. This
 * reads the header cells and stamps each body cell with its label. It also
 * re-runs when the page changes, so tables added by client navigation or by a
 * form submitting are covered too. Desktop layout is untouched.
 */
export function ResponsiveTables() {
  useEffect(() => {
    let frame = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // React stamps a node with a __reactFiber key once it has hydrated it. Touching the DOM before
    // that makes React report a hydration mismatch, so only label tables that are fully hydrated.
    const hydrated = (el: Element | null) => !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    const run = () => {
      let waiting = false;
      document.querySelectorAll<HTMLTableElement>("table:not([data-plain])").forEach((table) => {
        const last = table.querySelector("tbody tr:last-of-type > *:last-child");
        if (!hydrated(table) || (last && !hydrated(last))) {
          waiting = true;
          return;
        }
        table.classList.add("rtable");
        const heads = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent ?? "").trim());
        table.querySelectorAll("tbody tr").forEach((tr) => {
          const cells = Array.from(tr.children).filter((c): c is HTMLTableCellElement => c instanceof HTMLTableCellElement);
          if (cells.length === 1 && cells[0].colSpan > 1) {
            cells[0].dataset.span = "1";
            return;
          }
          cells.forEach((td, i) => {
            const label = heads[i] ?? "";
            if (td.dataset.label !== label) td.dataset.label = label;
            if (td.querySelector("details, form, button, a[href]")) {
              if (!label || td.querySelector("details, form")) td.dataset.full = "1";
            }
            if (!td.textContent?.trim() && !td.querySelector("*")) td.dataset.empty = "1";
          });
        });
      });
      if (waiting) retry = setTimeout(run, 250);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    };
    run();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(retry);
    };
  }, []);
  return null;
}

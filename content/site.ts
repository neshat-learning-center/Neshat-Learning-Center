import type { SiteConfig } from "./types";

/**
 * Institute-level facts. Only fields with real, confirmed data should be set.
 * `foundedYear` is intentionally left undefined until a real value is provided —
 * the UI hides it rather than inventing a year.
 */
export const site: SiteConfig = {
  name: { fa: "دانش‌سرای نشاط", en: "Neshat Learning Center" },
  city: { fa: "شیراز", en: "Shiraz" },
  address: { fa: "شیراز، بلوار بهشت", en: "Shiraz, Beheshat Blvd" },
  mapUrl: "https://www.google.com/maps/search/?api=1&query=MFQC%2BWWR+Shiraz+Iran",
  foundedYear: undefined,
  email: "neshatlearningcenter@gmail.com",
  phones: ["09175136313", "09164085066"],
  instagram: "https://www.instagram.com/neshat_learning_center/",
  telegram: undefined,
};

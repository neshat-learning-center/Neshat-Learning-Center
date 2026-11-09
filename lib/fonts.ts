import { Vazirmatn, Inter, Caveat, Bricolage_Grotesque } from "next/font/google";

// Persian — high quality, variable, excellent for editorial headlines
export const fontFa = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-fa-var",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// English — clean modern grotesk
export const fontEn = Inter({
  subsets: ["latin"],
  variable: "--font-en-var",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Handwritten accent — used sparingly for small editorial captions (hero only)
export const fontScript = Caveat({
  subsets: ["latin"],
  variable: "--font-script-var",
  display: "swap",
  weight: ["500", "600", "700"],
});

// English display — a characterful grotesque for large editorial headlines (Events). Body stays Inter.
export const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-var",
  display: "swap",
});

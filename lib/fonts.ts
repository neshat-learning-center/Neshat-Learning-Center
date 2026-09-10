import { Vazirmatn, Inter, Caveat } from "next/font/google";

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

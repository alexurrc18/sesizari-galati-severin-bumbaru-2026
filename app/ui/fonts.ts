import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

export const aspekta = localFont({
  src: "../fonts/AspektaVF.woff2",
  variable: "--font-aspekta",
  weight: "100 900",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
import type { Metadata } from "next";
import { aspekta } from "@/app/ui/fonts";
import '@/app/ui/globals.css';
import Navbar from "@/app/ui/navbar";

export const metadata: Metadata = {
  title: "Sesizări Galați",
  description: "Raportați problemele din Galați și ajutați la îmbunătățirea orașului!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${aspekta.className} min-h-full flex flex-col antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
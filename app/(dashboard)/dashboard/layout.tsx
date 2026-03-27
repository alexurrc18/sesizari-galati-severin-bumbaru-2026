import type { Metadata } from "next";
import { aspekta } from "@/app/ui/fonts";
import '@/app/ui/globals.css';
import Navbar from "@/app/ui/dashboard/navbar";
import { StaffAuthProvider } from "@/app/context/staff-auth-context";

export const metadata: Metadata = {
  title: "Sesizări Galați - Angajați",
  description: "Panoul de administrare pentru angajații Primăriei Galați",
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
        <StaffAuthProvider>
          <Navbar />
          {children}
        </StaffAuthProvider>
      </body>
    </html>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Profilul meu",    href: "/user/profil",   icon: "/icons/user.svg"     },
  { label: "Sesizările mele", href: "/user/sesizari", icon: "/icons/message-bubble-exclamation.svg" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-full md:flex flex-col w-72 bg-gray-100 rounded-2xl p-6 gap-2 self-stretch">
        <h2 className="text-xs font-black text-blue uppercase tracking-widest mb-4 ml-1">
          Contul meu
        </h2>

        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-white text-dark-blue border border-gray-300"
                  : "text-gray-500 hover:bg-white/60 hover:text-dark-blue"
              }`}
            >
              <Image src={item.icon} alt={item.label} width={18} height={18} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile */}
      <nav className="flex md:hidden w-full bg-gray-100 rounded-2xl px-4 py-3 gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 justify-center ${
                isActive
                  ? "bg-white text-dark-blue border border-gray-300"
                  : "text-gray-500 hover:bg-white/60 hover:text-dark-blue"
              }`}
            >
              <Image src={item.icon} alt={item.label} width={16} height={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffAuth } from "@/app/context/staff-auth-context";

const navItems = [
  { label: "Acasă",    href: "/dashboard/admin/home",     icon: "/icons/home.svg"     },
  { label: "Sesizări", href: "/dashboard/admin/sesizari",  icon: "/icons/message-bubble-exclamation.svg" },
  { label: "Rapoarte Abuz", href: "/dashboard/admin/rapoarte",  icon: "/icons/message-bubble-exclamation.svg" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { logout, employeeData } = useStaffAuth();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-full md:flex flex-col w-72 bg-gray-100 rounded-2xl p-6 gap-2 self-stretch border border-gray-300">
        <h2 className="text-xs font-black text-blue uppercase tracking-widest mb-1 ml-1">
          Dashboard
        </h2>
        {employeeData && (
          <p className="text-xs text-gray-400 font-medium ml-1 mb-3">
            {employeeData.firstName} {employeeData.lastName} · {employeeData.deptCode}
          </p>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-md font-bold transition-all ${
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

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-md font-bold transition-all text-gray-500 hover:bg-white/60 hover:text-red-600 mt-auto"
        >
          <Image src="/icons/door-open-alt.svg" alt="Deconectare" width={18} height={18} />
          Deconectare
        </button>
      </aside>

      {/* Mobile */}
      <nav className="flex md:hidden w-full bg-gray-100 rounded-2xl px-4 py-3 gap-2">
        {navItems.map((item) => {
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
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 justify-center text-gray-500 hover:bg-white/60 hover:text-red-600"
        >
          <Image src="/icons/door-open-alt.svg" alt="Deconectare" width={16} height={16} />
          Ieși
        </button>
      </nav>
    </>
  );
}
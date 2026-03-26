import Sidebar from "@/app/ui/dashboard/sidebar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-white px-12 py-5">
      <div className="flex flex-col md:flex-row gap-10 min-h-[calc(100vh-40px)]">
        <Sidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
import StatCard from "@/app/ui/dashboard/stat-card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl">

      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-dark-blue">Acasă</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Sesizări recente"
            value="12 / 34"
            subtitle="în ultimele 24h / 48h"
          />
          <StatCard
            title="Timp Mediu"
            value="48h"
            subtitle="de soluționare"
          />
          <StatCard
            title="În lucru"
            value="56"
            subtitle="sesizări preluate"
          />
          <StatCard
            title="Nesoluționate"
            value="8"
            subtitle="peste termenul limită"
          />
        </div>
      </div>

    </div>
  );
}
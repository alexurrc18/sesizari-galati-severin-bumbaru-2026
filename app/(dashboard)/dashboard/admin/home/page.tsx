"use client";

import { useState, useEffect } from "react";
import { useStaffAuth } from "@/app/context/staff-auth-context";
import StatCard from "@/app/ui/dashboard/stat-card";

export default function HomePage() {
  const { authenticatedFetch } = useStaffAuth();
  const [stats, setStats] = useState<{
    sesizariNoi24h: number;
    sesizariInLucru: number;
    nesolutionatePeste1Luna: number;
    timpMediuSolutionareZile: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      try {
        const res = await authenticatedFetch(`${apiUrl}/Employees/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Eroare la încărcarea statisticilor:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [authenticatedFetch]);

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-dark-blue">Acasă</h1>

        {isLoading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Se încarcă statisticile...</span>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Sesizări noi"
              value={stats.sesizariNoi24h}
              subtitle="în ultimele 24h"
            />
            <StatCard
              title="În lucru"
              value={stats.sesizariInLucru}
              subtitle="sesizări active"
            />
            <StatCard
              title="Nesoluționate"
              value={stats.nesolutionatePeste1Luna}
              subtitle="mai vechi de 1 lună"
            />
            <StatCard
              title="Timp mediu"
              value={`${stats.timpMediuSolutionareZile} zile`}
              subtitle="de soluționare"
            />
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-bold">
            Nu s-au putut încărca statisticile.
          </div>
        )}
      </div>
    </div>
  );
}
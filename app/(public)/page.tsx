"use client";

import MapComponent from "@/app/ui/map";
import { APIProvider } from "@vis.gl/react-google-maps";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchPublicReports,
  fetchCategories,
  fetchStatuses,
  toMapReport,
  type ApiReport,
  type Category,
  type ApiStatus,
  type MapReport,
} from "@/app/lib/api";

export default function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Date din API
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stare filtre
  const [selectedStatuses, setSelectedStatuses] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [periodFilter, setPeriodFilter] = useState("toate");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch date la mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, c, s] = await Promise.all([
          fetchPublicReports(),
          fetchCategories(),
          fetchStatuses(),
        ]);
        setReports(r);
        setCategories(c);
        setStatuses(s);
        // Selectăm toate statusurile și toate categoriile
        setSelectedStatuses(new Set(s.map(st => st.idStatus)));
        setSelectedCategories(new Set(c.map(cat => cat.idCategory)));
      } catch (err) {
        console.error("Eroare la încărcarea datelor:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Lookup maps
  const categoryMap = useMemo(() => {
    const m: Record<number, string> = {};
    categories.forEach(c => { m[c.idCategory] = c.categoryName; });
    return m;
  }, [categories]);

  const statusMap = useMemo(() => {
    const m: Record<number, string> = {};
    statuses.forEach(s => { m[s.idStatus] = s.statusName; });
    return m;
  }, [statuses]);

  // Filtrare client-side
  const filteredReports: MapReport[] = useMemo(() => {
    return reports
      .filter(r => {
        if (!selectedStatuses.has(r.idStatus)) return false;
        if (!selectedCategories.has(r.idCategory)) return false;

        if (periodFilter !== "toate") {
          const d = new Date(r.createdAt);
          const now = new Date();
          if (periodFilter === "luna") {
            const ago = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (d < ago) return false;
          } else if (periodFilter === "saptamana") {
            const ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (d < ago) return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.trim().replace('#', '');
          if (!r.idReport.toString().includes(q)) return false;
        }

        return true;
      })
      .map(r => toMapReport(r, categoryMap, statusMap));
  }, [reports, selectedStatuses, selectedCategories, periodFilter, searchQuery, categoryMap, statusMap]);

  // Toggle helpers
  const toggleStatus = useCallback((id: number) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: number) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Conținut filtre (shared între desktop și mobile)
  const filterContent = (radioNameSuffix: string = "") => (
    <div className="flex flex-col gap-3">
      {/* Status */}
      <details className="group rounded-lg" open>
        <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
          Status
          <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
          {statuses.map(s => (
            <label key={s.idStatus} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectedStatuses.has(s.idStatus)}
                onChange={() => toggleStatus(s.idStatus)}
              />
              <span className="text-gray-700 text-sm">{s.statusName}</span>
            </label>
          ))}
          {statuses.length === 0 && (
            <span className="text-gray-400 text-sm italic">Se încarcă...</span>
          )}
        </div>
      </details>

      {/* Categorie */}
      <details className="group rounded-lg">
        <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
          Categorie
          <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg max-h-48 overflow-y-auto">
          {categories.map(c => (
            <label key={c.idCategory} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectedCategories.has(c.idCategory)}
                onChange={() => toggleCategory(c.idCategory)}
              />
              <span className="text-gray-700 text-sm">{c.categoryName}</span>
            </label>
          ))}
          {categories.length === 0 && (
            <span className="text-gray-400 text-sm italic">Se încarcă...</span>
          )}
        </div>
      </details>

      {/* Perioadă */}
      <details className="group rounded-lg">
        <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
          Perioadă adăugare
          <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
          {[
            { value: "toate", label: "Toate timpurile" },
            { value: "luna", label: "Ultima lună" },
            { value: "saptamana", label: "Ultimele 7 zile" },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`perioada${radioNameSuffix}`}
                value={opt.value}
                className="w-4 h-4"
                checked={periodFilter === opt.value}
                onChange={() => setPeriodFilter(opt.value)}
              />
              <span className="text-gray-700 text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>

      {/* DESKTOP */}
      <div className="hidden md:block w-full h-full relative px-12 py-5">
        <div className="relative w-full h-[85vh] rounded-2xl overflow-hidden bg-gray-50">

          <MapComponent reports={filteredReports} />

          {/* Panou lateral filtre */}
          <div className="absolute top-6 left-6 bottom-6 w-85 bg-white rounded-2xl z-10 p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-dark-blue">Sesizări</h2>
              <Link
                href="/sesizari/nou"
                className="bg-orange hover:bg-orange-400 text-white text-sm font-bold py-2 px-3 rounded-lg transition-all active:scale-95"
              >
                + Adaugă
              </Link>
            </div>

            {/* Contor rezultate */}
            <div className="mb-4 text-xs text-gray-400 font-medium">
              {isLoading ? "Se încarcă..." : `${filteredReports.length} sesizări pe hartă`}
            </div>

            {/* Căutare */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Caută sesizare după ID (ex: 42)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue/30 transition-all"
              />
            </div>

            {filterContent()}
          </div>

        </div>
      </div>

      {/* MOBILE */}
      <div className="flex md:hidden flex-col w-full px-4 py-4 gap-3">

        <div className="relative w-full h-[88.5vh] rounded-2xl overflow-hidden bg-gray-50">
          <MapComponent reports={filteredReports} />

          {/* Bara peste hartă */}
          <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
            <input
              type="text"
              placeholder="Caută după ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-3 bg-white rounded-xl text-sm text-gray-700 focus:outline-none border border-gray-300"
            />
            <button
              onClick={() => setFiltersOpen(true)}
              className="bg-white p-3 rounded-xl border border-gray-300"
            >
              <Image src="/icons/chevron-down.svg" alt="Filtre" width={20} height={20} />
            </button>
            <Link
              href="/sesizari/nou"
              className="bg-orange text-white text-sm font-bold px-4 rounded-xl flex items-center border border-gray-300"
            >
              + Adaugă
            </Link>
          </div>

          {/* Contor pe hartă */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-500 font-medium">
            {isLoading ? "..." : `${filteredReports.length} sesizări`}
          </div>
        </div>

        {/* Drawer filtre mobile */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="relative bg-white rounded-t-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-dark-blue">Filtre</h3>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              {filterContent("_m")}

              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full bg-blue text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs mt-2"
              >
                Aplică filtrele ({filteredReports.length} rezultate)
              </button>
            </div>
          </div>
        )}

      </div>

    </APIProvider>
  );
}
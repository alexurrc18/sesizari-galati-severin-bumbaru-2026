"use client";

import { useState, useEffect, useCallback } from "react";
import { useStaffAuth } from "@/app/context/staff-auth-context";

interface AbuseReport {
  idAbuse: number;
  idReport: number;
  idUser: number;
  reason: string;
  createdAt: string;
  isResolved: boolean;
  reportDescription: string | null;
  userName: string | null;
  userEmail: string | null;
}

type FilterType = 'toate' | 'nerezolvate' | 'rezolvate';

export default function RapoarteAbuzPage() {
  const { authenticatedFetch, isD10 } = useStaffAuth();

  const [abuseReports, setAbuseReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('toate');
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/abuse-reports`);
      if (res.ok) {
        const data = await res.json();
        setAbuseReports(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Eroare la încărcarea rapoartelor de abuz:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleResolve = async (id: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/abuse-reports/${id}/resolve`, {
        method: 'PUT'
      });
      if (res.ok) {
        setAbuseReports(prev => prev.map(a => 
          a.idAbuse === id ? { ...a, isResolved: true } : a
        ));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.eroare || "Eroare la marcarea ca rezolvat.");
      }
    } catch {
      alert("Eroare de conexiune.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ești sigur că vrei să ștergi acest raport de abuz?")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/abuse-reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAbuseReports(prev => prev.filter(a => a.idAbuse !== id));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.eroare || "Eroare la ștergere.");
      }
    } catch {
      alert("Eroare de conexiune.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  const filteredReports = abuseReports.filter(a => {
    if (filter === 'nerezolvate' && a.isResolved) return false;
    if (filter === 'rezolvate' && !a.isResolved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (
        !a.idReport.toString().includes(q) &&
        !(a.userName?.toLowerCase().includes(q)) &&
        !(a.reason?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const counts = {
    toate: abuseReports.length,
    nerezolvate: abuseReports.filter(a => !a.isResolved).length,
    rezolvate: abuseReports.filter(a => a.isResolved).length,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-2xl font-bold text-dark-blue">Rapoarte de Abuz</h1>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Se încarcă rapoartele...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-blue">Rapoarte de Abuz</h1>
        <span className="text-sm text-gray-400 font-medium">
          {counts.nerezolvate} nerezolvate din {counts.toate} total
        </span>
      </div>

      {/* Banner non-D10 */}
      {!isD10 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="text-sm font-bold text-yellow-700">
            Mod vizualizare — doar departamentul D10 poate gestiona rapoartele de abuz.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-6 w-full overflow-hidden">
        {/* Filtre */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
            {([
              { key: 'toate' as FilterType, label: 'Toate', count: counts.toate },
              { key: 'nerezolvate' as FilterType, label: 'Nerezolvate', count: counts.nerezolvate },
              { key: 'rezolvate' as FilterType, label: 'Rezolvate', count: counts.rezolvate },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.key
                    ? "bg-white text-red-600 border border-red-300"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Caută (ID sesizare, utilizator, motiv)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 focus:outline-none focus:border-red-400 w-full md:w-72"
          />
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Utilizator</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Sesizare</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Motiv</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Data</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                {isD10 && (
                  <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Acțiuni</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={isD10 ? 6 : 5} className="py-8 text-center text-gray-400 text-sm">
                    Niciun raport de abuz găsit.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.idAbuse} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-dark-blue">
                          {report.userName || "Anonim"}
                        </span>
                        <span className="text-xs text-gray-400">{report.userEmail || "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-blue">
                          #{report.idReport}
                        </span>
                        <span className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                          {report.reportDescription || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-sm text-gray-700 font-medium bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                        {report.reason}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                    </td>
                    <td className="py-4 px-4">
                      {report.isResolved ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                          ✓ Rezolvat
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                          ⏳ Deschis
                        </span>
                      )}
                    </td>
                    {isD10 && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!report.isResolved && (
                            <button
                              onClick={() => handleResolve(report.idAbuse)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors"
                              title="Marchează ca rezolvat"
                            >
                              ✓ Rezolvă
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(report.idAbuse)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                            title="Șterge raportul"
                          >
                            🗑 Șterge
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

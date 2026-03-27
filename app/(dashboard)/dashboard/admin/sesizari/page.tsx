"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useStaffAuth } from "@/app/context/staff-auth-context";
import { fetchCategories, fetchStatuses, fetchCompanies, fetchPriorities, type Category, type ApiStatus, type Company, type Priority } from "@/app/lib/api";
import ReportModal from "@/app/ui/dashboard/sesizare-modal";

// Tip pentru rapoartele din /Employees/reports
interface AdminReport {
  idReport: number;
  idUser: number | null;
  idCategory: number;
  idStatus: number;
  idPriority: number | null;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  taxId: string | null;
  officialResponse?: string;
  attachments?: string[];
  abuseCount: number;
}

// Fluxul real (aliniat cu BD):
// 1 = Nou  →  Moderate(aproba=true) → 2 (În lucru)
// 1 = Nou  →  Moderate(aproba=false) → 4 (Respins)
// 2 = În lucru  →  Assign Company (rămâne 2, doar setează tax_id)
// 2 = În lucru  →  Resolve → 3 (Rezolvat)

type TabType = 'nou' | 'in_lucru' | 'rezolvat' | 'respins';

export default function SesizariAdminPage() {
  const { authenticatedFetch, isD10 } = useStaffAuth();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('nou');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("toate");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  // Fetch date
  const loadData = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const [reportsRes, cats, stats, comps, prios] = await Promise.all([
        authenticatedFetch(`${apiUrl}/Employees/reports`),
        fetchCategories(),
        fetchStatuses(),
        fetchCompanies(),
        fetchPriorities(),
      ]);

      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReports(Array.isArray(d) ? d : []);
      }

      setCategories(cats);
      setStatuses(stats);
      setCompanies(comps);
      setPriorities(prios);
    } catch (err) {
      console.error("Eroare:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const priorityMap = useMemo(() => {
    const m: Record<number, string> = {};
    priorities.forEach(p => { m[p.idPriority] = p.levelName; });
    return m;
  }, [priorities]);

  // Tab → status mapping
  const tabStatusMap: Record<TabType, number> = {
    'nou': 1,
    'in_lucru': 2,
    'rezolvat': 3,
    'respins': 4,
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (r.idStatus !== tabStatusMap[activeTab]) return false;
      if (categoryFilter !== "toate" && r.idCategory.toString() !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!r.idReport.toString().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reports, activeTab, categoryFilter, searchQuery]);

  const tabCounts = useMemo(() => ({
    nou: reports.filter(r => r.idStatus === 1).length,
    in_lucru: reports.filter(r => r.idStatus === 2).length,
    rezolvat: reports.filter(r => r.idStatus === 3).length,
    respins: reports.filter(r => r.idStatus === 4).length,
  }), [reports]);

  // =============================================
  // ACȚIUNI MODERARE
  // =============================================

  const moderateReport = async (reportId: number, aproba: boolean, newCategoryId?: number | null) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/reports/${reportId}/moderate`, {
        method: 'PUT',
        body: JSON.stringify({
          aproba,
          newCategoryId: newCategoryId || null,
          newPriorityId: null
        })
      });
      if (res.ok) {
        if (aproba) {
          setReports(prev => prev.map(r => {
            if (r.idReport !== reportId) return r;
            const updated = { ...r, idStatus: 2 };
            if (newCategoryId) updated.idCategory = newCategoryId;
            return updated;
          }));
        } else {
          setReports(prev => prev.map(r =>
            r.idReport === reportId ? { ...r, idStatus: 4 } : r
          ));
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.eroare || err?.mesaj || "Eroare la moderare.");
      }
    } catch {
      alert("Eroare de conexiune.");
    }
  };

  // Asignare companie + prioritate
  const assignCompany = async (reportId: number, taxId: string, idPriority?: number | null) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/reports/${reportId}/assign-company`, {
        method: 'PUT',
        body: JSON.stringify({ taxId, idPriority: idPriority || null })
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        console.log("[Assign Company] Succes:", data);
        setReports(prev => prev.map(r =>
          r.idReport === reportId ? { ...r, taxId, idPriority: idPriority || null } : r
        ));
        alert(data?.mesaj || "Compania a fost asignată!");
      } else {
        const errText = await res.text().catch(() => "");
        console.error("[Assign Company] Eroare:", res.status, errText);
        try {
          const errJson = JSON.parse(errText);
          alert(errJson?.eroare || errJson?.mesaj || errJson?.title || `Eroare ${res.status}`);
        } catch {
          alert(`Eroare ${res.status}: ${errText}`);
        }
      }
    } catch (e) {
      console.error("[Assign Company] Exception:", e);
      alert("Eroare de conexiune.");
    }
  };

  // Finalizare
  const resolveReport = async (reportId: number, officialResponse: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await authenticatedFetch(`${apiUrl}/Employees/reports/${reportId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ officialResponse })
      });
      if (res.ok) {
        setReports(prev => prev.map(r =>
          r.idReport === reportId ? { ...r, idStatus: 3, officialResponse } : r
        ));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.eroare || err?.mesaj || "Eroare la finalizare.");
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-2xl font-bold text-dark-blue">Gestionare Sesizări</h1>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Se încarcă sesizările...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <h1 className="text-2xl font-bold text-dark-blue">Gestionare Sesizări</h1>

      {/* Banner non-D10 */}
      {!isD10 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="text-sm font-bold text-yellow-700">
            Mod vizualizare — doar departamentul D10 poate efectua acțiuni.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-6 w-full overflow-hidden">

        {/* Tabs + Filtre */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex gap-1 bg-gray-50 p-1 rounded-xl flex-wrap">
            {([
              { key: 'nou' as TabType, label: 'Nou', count: tabCounts.nou },
              { key: 'in_lucru' as TabType, label: 'În lucru', count: tabCounts.in_lucru },
              { key: 'rezolvat' as TabType, label: 'Rezolvat', count: tabCounts.rezolvat },
              { key: 'respins' as TabType, label: 'Respins', count: tabCounts.respins },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-blue border border-blue"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Caută ID sau cuvânt cheie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 focus:outline-none focus:border-blue w-full md:w-64"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border border-gray-500 focus:border-blue cursor-pointer"
            >
              <option value="toate">Toate categoriile</option>
              {categories.map(c => (
                <option key={c.idCategory} value={c.idCategory.toString()}>{c.categoryName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID / Dată</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Categorie</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Prioritate</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Descriere</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    Nicio sesizare în această categorie.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => {
                  const catName = categoryMap[report.idCategory] || "—";
                  const prioName = report.idPriority ? priorityMap[report.idPriority] : null;

                  return (
                    <tr key={report.idReport} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4 cursor-pointer" onClick={() => setSelectedReport(report)}>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-dark-blue hover:text-blue transition-colors flex items-center gap-2">
                            #{report.idReport}
                            {report.abuseCount > 0 && (
                              <span title={`${report.abuseCount} cetățeni au raportat abuz pentru această sesizare.`} className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                🚩 {report.abuseCount}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-gray-700">{catName}</span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        {prioName ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                            {prioName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">{report.description}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {/* Status 1 (Nou): Publică / Respinge — doar D10 */}
                          {activeTab === 'nou' && isD10 && (
                            <>
                              <button
                                onClick={() => moderateReport(report.idReport, true)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors"
                              >
                                Publică
                              </button>
                              <button
                                onClick={() => moderateReport(report.idReport, false)}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                              >
                                Respinge
                              </button>
                            </>
                          )}

                          {/* Status 2 (În lucru): Acțiuni contextuale — doar D10 */}
                          {activeTab === 'in_lucru' && isD10 && (
                            <>
                              {!report.taxId ? (
                                <button
                                  onClick={() => setSelectedReport(report)}
                                  className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-200 transition-colors"
                                >
                                  Asignare Companie
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                  ✓ {companies.find(c => c.taxId === report.taxId)?.companyName || report.taxId}
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="px-3 py-1.5 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue/90 transition-colors"
                              >
                                Finalizează
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Detalii
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalii */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          categoryName={categoryMap[selectedReport.idCategory] || "—"}
          statusName={statusMap[selectedReport.idStatus] || "—"}
          categories={categories}
          companies={companies}
          priorities={priorities}
          isD10={isD10}
          onClose={() => setSelectedReport(null)}
          onModerate={moderateReport}
          onAssignCompany={assignCompany}
          onResolve={resolveReport}
        />
      )}
    </div>
  );
}
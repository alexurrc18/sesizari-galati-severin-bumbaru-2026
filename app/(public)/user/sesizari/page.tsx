"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/app/context/auth-context";
import { fetchCategories, fetchStatuses, getStatusStyle, toggleVote, reportAbuse, type ApiReport, type Category, type ApiStatus } from "@/app/lib/api";
import Link from "next/link";

export default function SesizarileMelePage() {
  const { authenticatedFetch } = useAuth();

  const [reports, setReports] = useState<ApiReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        const [reportsRes, cats, stats] = await Promise.all([
          authenticatedFetch(`${apiUrl}/Reports/my-reports`),
          fetchCategories(),
          fetchStatuses(),
        ]);

        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(Array.isArray(data) ? data : []);
        } else {
          setError("Nu am putut încărca sesizările tale.");
        }

        setCategories(cats);
        setStatuses(stats);
      } catch {
        setError("Eroare de conexiune.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [authenticatedFetch]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-dark-blue">Sesizările mele</h1>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Se încarcă sesizările...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-dark-blue">Sesizările mele</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-blue">Sesizările mele</h1>
        <Link
          href="/sesizari/nou"
          className="bg-orange hover:bg-orange-400 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95"
        >
          + Adaugă sesizare
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-6xl opacity-30">📋</div>
          <p className="text-gray-400 font-medium text-center">
            Nu ai făcut nicio sesizare încă.
          </p>
          <Link
            href="/sesizari/nou"
            className="bg-blue text-white text-sm font-bold py-3 px-6 rounded-xl transition-all active:scale-95 hover:bg-[#4a8ebf]"
          >
            Creează prima ta sesizare
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => {
            const catName = categoryMap[report.idCategory] || "Necunoscută";
            const statName = statusMap[report.idStatus] || "Necunoscut";
            const statusStyle = getStatusStyle(report.idStatus);
            const date = (() => {
              try {
                return new Date(report.createdAt).toLocaleDateString('ro-RO', {
                  day: 'numeric', month: 'long', year: 'numeric'
                });
              } catch { return report.createdAt; }
            })();

            return (
                <ReportItem 
                  key={report.idReport} 
                  report={report} 
                  catName={catName} 
                  statName={statName} 
                  statusStyle={statusStyle} 
                  date={date} 
                  statuses={statuses}
                />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportItem({ report, catName, statName, statusStyle, date, statuses }: any) {
  const [voteCount, setVoteCount] = useState(report.voteCount || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // You might want to fetch initial vote status if needed, or assume false and let the user click
  // For simplicity, we just allow the user to click to vote

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    
    setIsVoting(true);
    const result = await toggleVote(report.idReport);
    
    if (result) {
        setVoteCount(result.totalVotes);
        setHasVoted(result.voted);
    } else {
        alert("Trebuie să fii autentificat pentru a vota.");
    }
    setIsVoting(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header: categorie + status + ID */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black text-blue uppercase tracking-widest">
            {catName}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            #{report.idReport} · {date}
          </span>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          {statName}
        </span>
      </div>

      {/* Descriere */}
      <p className="text-sm text-gray-700 font-medium">{report.description}</p>

      {/* Imagini adăugate (dacă există) */}
      {report.attachments && report.attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-1 scrollbar-hide">
            {report.attachments.map((url: string, i: number) => (
                <div key={i} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={url} alt={`Atașament ${i + 1}`} className="w-full h-full object-cover" />
                </div>
            ))}
        </div>
      )}

      {/* Răspuns oficial */}
      {report.officialResponse && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-1">
            Răspuns oficial
          </span>
          <p className="text-xs text-green-700 font-medium">{report.officialResponse}</p>
        </div>
      )}

      {/* Istoric (Timeline) */}
      {report.history && report.history.length > 0 && (
        <div className="mt-1 border-l-2 border-gray-100 pl-4 py-1 ml-2 flex flex-col gap-3 relative">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-3 left-[-2px] bg-white pr-2 py-1 z-10">
                Istoric Stări
            </span>
            <div className="mt-3 flex flex-col gap-3">
                {report.history.map((h: any, idx: number) => {
                    const isNewest = idx === 0;
                    const histStatusName = h.statusNew || "Actualizat";
                    const isAssigned = h.statusNew === "În lucru";
                    
                    return (
                        <div key={idx} className="relative flex items-center justify-between">
                            {/* Punctul de pe timeline */}
                            <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full ${isNewest ? 'bg-blue border-2 border-blue-200 scale-125' : 'bg-gray-200'}`} />
                            
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold leading-tight ${isNewest ? 'text-gray-800' : 'text-gray-500'}`}>
                                    {histStatusName}
                                    {isAssigned && report.companyName && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-100 text-orange-600 text-[9px] uppercase font-black">
                                            {report.companyName}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {new Date(h.changedAt).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Footer: Locație și Voturi */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>📍</span>
          <span>
            {Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}
          </span>
        </div>
        
        {/* Vote button */}
        <button
            onClick={handleVote}
            disabled={isVoting}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                hasVoted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-red-500'
            } ${isVoting ? 'opacity-50 cursor-wait' : 'cursor-pointer active:scale-95'}`}
        >
            <span className={`text-sm transition-transform duration-200 ${hasVoted ? 'scale-110' : ''}`}>
                {hasVoted ? '❤️' : '🤍'}
            </span>
            <span>{voteCount} voturi</span>
        </button>

        <button 
            onClick={(e) => { e.stopPropagation(); setIsReporting(!isReporting); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isReporting 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title="Raportează o problemă cu această sesizare"
        >
            <span>🚩</span>
            <span className="hidden sm:inline">Raportează</span>
        </button>
      </div>

      {/* Fereastră Raportare Abuz (similar cu Popup-ul de pe hartă) */}
      {isReporting && (
        <div className="mt-2 p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-600 uppercase tracking-widest">
                Raportare Sesizare
            </span>
            <button onClick={() => setIsReporting(false)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Motivul raportării:</label>
            <select 
                value={reportReason} 
                onChange={e => setReportReason(e.target.value)}
                className="text-sm p-3 border border-red-200 rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 transition-all cursor-pointer"
            >
                <option value="">Alege motivul...</option>
                <option value="Conținut Inadecvat / Limbaj">Limbaj / Poze Neadecvate</option>
                <option value="Dublură">Este o dublură</option>
                <option value="Spam / Fals">Problemă falsă (Spam)</option>
            </select>
          </div>

          <div className="flex gap-3 mt-1">
            <button 
                disabled={!reportReason || submittingReport}
                onClick={async (e) => {
                    e.stopPropagation();
                    setSubmittingReport(true);
                    const res = await reportAbuse(report.idReport, reportReason);
                    alert(res.message);
                    setSubmittingReport(false);
                    if(res.success) {
                        setIsReporting(false);
                        setReportReason("");
                    }
                }}
                className="flex-1 bg-red-500 text-white text-sm py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-red-600 transition-all active:scale-95 shadow-sm shadow-red-200"
            >
                {submittingReport ? "Se trimite..." : "Trimite Raportarea"}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsReporting(false); }}
                className="px-4 py-3 text-gray-500 text-sm font-bold hover:text-gray-700 transition-colors"
            >
                Anulează
            </button>
          </div>
          <p className="text-[10px] text-red-400 italic text-center">
            Abuzul de acest sistem poate duce la suspendarea contului.
          </p>
        </div>
      )}
    </div>
  );
}
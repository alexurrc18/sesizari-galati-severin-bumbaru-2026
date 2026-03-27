"use client";

import { useState, useMemo } from "react";
import { type Category, type Company, type Priority, getStatusStyle } from "@/app/lib/api";

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

interface ReportModalProps {
  report: AdminReport;
  categoryName: string;
  statusName: string;
  categories: Category[];
  companies: Company[];
  priorities: Priority[];
  isD10: boolean;
  onClose: () => void;
  onModerate: (reportId: number, aproba: boolean, newCategoryId?: number | null) => Promise<void>;
  onAssignCompany: (reportId: number, taxId: string, idPriority?: number | null) => Promise<void>;
  onResolve: (reportId: number, officialResponse: string) => Promise<void>;
}

export default function ReportModal({
  report, categoryName, statusName, categories, companies, priorities, isD10,
  onClose, onModerate, onAssignCompany, onResolve
}: ReportModalProps) {
  const statusStyle = getStatusStyle(report.idStatus);
  const [officialResponse, setOfficialResponse] = useState("");
  const [selectedTaxId, setSelectedTaxId] = useState("");
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | null>(report.idPriority);
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  // Filtrare companii pe baza domeniului categoriei sesizării
  const filteredCompanies = useMemo(() => {
    const reportCategory = categories.find(c => c.idCategory === report.idCategory);
    if (!reportCategory) return companies;
    if (reportCategory.idCategory === 12 || !reportCategory.idDomain) return companies;
    const categoryDomain = reportCategory.idDomain;
    return companies.filter(comp => comp.idDomain === categoryDomain);
  }, [report.idCategory, categories, companies]);

  const handleModerate = async (aproba: boolean) => {
    setIsSubmitting(true);
    await onModerate(report.idReport, aproba, newCategoryId);
    setIsSubmitting(false);
    onClose();
  };

  const handleAssignCompany = async () => {
    if (!selectedTaxId) {
      alert("Selectează o companie din listă.");
      return;
    }
    setIsSubmitting(true);
    await onAssignCompany(report.idReport, selectedTaxId, selectedPriorityId);
    setIsSubmitting(false);
    onClose();
  };

  const handleResolve = async () => {
    if (!officialResponse.trim()) {
      alert("Introdu un răspuns oficial înainte de a finaliza.");
      return;
    }
    setIsSubmitting(true);
    await onResolve(report.idReport, officialResponse.trim());
    setIsSubmitting(false);
    onClose();
  };

  // Status labels
  const statusLabels: Record<number, string> = {
    1: "Nou",
    2: "În lucru",
    3: "Rezolvat",
    4: "Respins"
  };

  // Prioritate curentă
  const currentPriority = priorities.find(p => p.idPriority === report.idPriority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-dark-blue">Sesizarea #{report.idReport}</h2>
            <span className="text-sm text-gray-400">Depusă la {formatDate(report.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {statusLabels[report.idStatus] || statusName}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl leading-none">
              &times;
            </button>
          </div>
        </div>

        {/* Conținut */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Categorie</span>
            <span className="text-sm font-bold text-blue">{categoryName}</span>
          </div>

          {/* Prioritate curentă (vizibilă pentru toți) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Prioritate</span>
            {currentPriority ? (
              <span className="text-sm font-bold text-orange-600">
                {currentPriority.levelName} ({currentPriority.resolutionDays} zile)
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Nesetată</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Descriere</span>
            <p className="text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              {report.description}
            </p>
          </div>

          {/* Secțiune Abuz */}
          {report.abuseCount > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">🚩</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-red-700 uppercase tracking-wide">
                  Atenție: Posibil Abuz / Spam
                </span>
                <span className="text-xs text-red-600 font-medium">
                  Această sesizare a fost marcată de {report.abuseCount} cetățeni diferiți ca fiind neconformă (spam/duplicată).
                </span>
              </div>
            </div>
          )}

          {/* Imagini */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Imagini Atașate</span>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {report.attachments.map((url, i) => {
                   const backendRoot = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || '';
                   const fullUrl = url.startsWith('/') ? `${backendRoot}${url}` : url;
                   return (
                     <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 bg-opacity-50 hover:border-blue transition-colors group relative cursor-zoom-in">
                       <img src={fullUrl} alt={`Poza ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                     </a>
                   );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Locație</span>
              <span className="text-sm font-bold text-gray-700">
                📍 {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Data creării</span>
              <span className="text-sm font-bold text-gray-700">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          {report.taxId && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Companie asignată</span>
              <span className="text-sm font-bold text-gray-700">
                {companies.find(c => c.taxId === report.taxId)?.companyName || report.taxId} (CUI: {report.taxId})
              </span>
            </div>
          )}

          {report.officialResponse && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Răspuns Oficial</span>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-medium">{report.officialResponse}</p>
              </div>
            </div>
          )}

          {/* ── Status 1: Schimbă categoria (opțional) — doar D10 ── */}
          {report.idStatus === 1 && isD10 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Schimbă categoria (opțional)
              </span>
              <select
                value={newCategoryId ?? ""}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border border-gray-300 focus:border-blue cursor-pointer"
              >
                <option value="">Păstrează categoria curentă</option>
                {categories.map(c => (
                  <option key={c.idCategory} value={c.idCategory}>{c.categoryName}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Status 2: Asignare companie + Prioritate (dropdown filtrat) — doar D10 ── */}
          {report.idStatus === 2 && !report.taxId && isD10 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Selectează compania
                </span>
                {filteredCompanies.length === 0 ? (
                  <p className="text-sm text-red-500 font-medium">
                    Nu există companii disponibile pentru domeniul acestei categorii.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedTaxId}
                      onChange={(e) => setSelectedTaxId(e.target.value)}
                      className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border border-gray-300 focus:border-blue cursor-pointer"
                    >
                      <option value="">Alege o companie...</option>
                      {filteredCompanies.map(comp => (
                        <option key={comp.idCompany} value={comp.taxId}>
                          {comp.companyName} (CUI: {comp.taxId})
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400">
                      {filteredCompanies.length} companii disponibile · Backend-ul va trimite email automat
                    </span>
                  </>
                )}
              </div>

              {/* Dropdown Prioritate — se setează aici, odată cu compania */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Setează Prioritatea
                </span>
                <select
                  value={selectedPriorityId ?? ""}
                  onChange={(e) => setSelectedPriorityId(e.target.value ? Number(e.target.value) : null)}
                  className="p-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border border-gray-300 focus:border-blue cursor-pointer"
                >
                  <option value="">Fără prioritate</option>
                  {priorities.map(p => (
                    <option key={p.idPriority} value={p.idPriority}>
                      {p.levelName} ({p.resolutionDays} zile)
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">
                  Prioritatea va fi inclusă în emailul trimis companiei
                </span>
              </div>
            </div>
          )}

          {/* ── Status 2 cu companie deja asignată ── */}
          {report.idStatus === 2 && report.taxId && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Companie Asignată
              </span>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-lg">🏢</span>
                <div>
                  <p className="text-sm font-bold text-green-800">
                    {companies.find(c => c.taxId === report.taxId)?.companyName || "Companie necunoscută"}
                  </p>
                  <p className="text-xs text-green-600">CUI: {report.taxId}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Status 2 (În lucru): Finalizare cu răspuns oficial — doar D10 ── */}
          {report.idStatus === 2 && isD10 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Răspuns oficial (obligatoriu pentru finalizare)
              </span>
              <textarea
                value={officialResponse}
                onChange={(e) => setOfficialResponse(e.target.value)}
                placeholder="Ex: Echipa Ecosal a rezolvat problema pe teren..."
                className="w-full h-24 p-4 bg-gray-50 rounded-xl text-sm font-medium focus:outline-none border border-gray-300 focus:border-blue resize-none"
              />
            </div>
          )}

          {/* Mesaj pentru non-D10 */}
          {!isD10 && (report.idStatus === 1 || report.idStatus === 2) && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-yellow-700">Acces doar pentru vizualizare</span>
                <span className="text-xs text-yellow-600 font-medium">
                  Doar angajații din departamentul D10 pot efectua acțiuni asupra sesizărilor.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Acțiuni */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 flex-wrap">
          {/* Status 1: Publică / Respinge — doar D10 */}
          {report.idStatus === 1 && isD10 && (
            <>
              <button
                onClick={() => handleModerate(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : "Publică pe hartă"}
              </button>
              <button
                onClick={() => handleModerate(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : "Respinge"}
              </button>
            </>
          )}

          {/* Status 2 (În lucru): Asignare companie — doar D10, doar dacă nu e deja asignată */}
          {report.idStatus === 2 && !report.taxId && isD10 && (
            <button
              onClick={handleAssignCompany}
              disabled={isSubmitting || !selectedTaxId}
              className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Se asignează..." : "Asignează Compania"}
            </button>
          )}

          {/* Status 2 (În lucru): Finalizare — doar D10 */}
          {report.idStatus === 2 && isD10 && (
            <button
              onClick={handleResolve}
              disabled={isSubmitting || !officialResponse.trim()}
              className="px-6 py-2.5 bg-blue text-white text-sm font-bold rounded-xl hover:bg-blue/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Se finalizează..." : "Finalizează sesizarea"}
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Închide
          </button>
        </div>

      </div>
    </div>
  );
}
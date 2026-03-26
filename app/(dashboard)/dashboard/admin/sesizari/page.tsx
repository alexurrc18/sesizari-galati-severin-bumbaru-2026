"use client";

import { useState } from "react";
import ReportModal from "@/app/ui/dashboard/sesizare-modal";

type TabType = 'noi' | 'in_lucru' | 'finalizate';

export default function SesizariAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('noi');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("toate");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const categories = ["Infrastructură", "Iluminat", "Salubritate", "Spații Verzi"];
  const priorities = ["Scăzută", "Medie", "Ridicată", "Urgentă"];
  const executanti = ["Echipa Intervenții 1", "Echipa Spații Verzi", "Echipa Electrica", "Echipa Salubritate"];

  const openDetails = (id: string) => setSelectedReportId(id);
  const closeDetails = () => setSelectedReportId(null);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-blue">Gestionare Sesizări</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-6 w-full overflow-hidden">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('noi')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'noi' ? "bg-white text-blue border border-blue" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Noi (12)
            </button>
            <button
              onClick={() => setActiveTab('in_lucru')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'in_lucru' ? "bg-white text-blue border border-blue" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              În lucru (5)
            </button>
            <button
              onClick={() => setActiveTab('finalizate')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'finalizate' ? "bg-white text-blue border border-blue" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Finalizate (145)
            </button>
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
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID / Dată</th>
                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Categorie</th>
                
                {activeTab === 'noi' && (
                  <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Prioritate</th>
                )}
                
                {activeTab === 'in_lucru' && (
                  <>
                    <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Executant</th>
                    <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Timp în stagiu</th>
                  </>
                )}

                {activeTab === 'finalizate' && (
                  <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data Finalizării</th>
                )}

                <th className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>

              {activeTab === 'noi' && (
                <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 cursor-pointer" onClick={() => openDetails('1024')}>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-dark-blue hover:text-blue transition-colors">#1024</span>
                      <span className="text-xs text-gray-400">27 Mar 2026, 09:30</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <select className="p-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:outline-none border border-transparent focus:border-blue/20 cursor-pointer">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <select className="p-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:outline-none border border-transparent focus:border-blue/20 cursor-pointer">
                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors">
                        Publică
                      </button>
                      <button className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors">
                        Respinge
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {activeTab === 'in_lucru' && (
                <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 cursor-pointer" onClick={() => openDetails('1018')}>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-dark-blue hover:text-blue transition-colors">#1018</span>
                      <span className="text-xs text-gray-400">25 Mar 2026, 14:15</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-700">Infrastructură</span>
                  </td>
                  <td className="py-4 px-4">
                    <select className="p-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:outline-none border border-transparent focus:border-blue/20 cursor-pointer">
                      <option value="">Atribuie executant...</option>
                      {executanti.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-orange">48h 12m</span>
                  </td>
                  <td className="py-4 px-4 text-right flex justify-end gap-2">
                     <button onClick={() => openDetails('1018')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        Detalii
                      </button>
                    <button className="px-3 py-1.5 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue/90 transition-colors">
                      Finalizează
                    </button>
                  </td>
                </tr>
              )}

              {activeTab === 'finalizate' && (
                <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 cursor-pointer" onClick={() => openDetails('0988')}>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-dark-blue hover:text-blue transition-colors">#0988</span>
                      <span className="text-xs text-gray-400">20 Mar 2026, 11:00</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-700">Iluminat</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-700">26 Mar 2026</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button onClick={() => openDetails('0988')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                      Vezi detalii
                    </button>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>

      {selectedReportId && (
        <ReportModal 
          reportId={selectedReportId} 
          onClose={closeDetails} 
        />
      )}

    </div>
  );
}
"use client";

import MapComponent from "@/app/ui/map";
import { APIProvider } from "@vis.gl/react-google-maps";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MOCK_REPORTS } from "@/app/config/sesizari";

export default function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>

      {/* desktop */}
      <div className="hidden md:block w-full h-full relative px-12 py-5">
        <div className="relative w-full h-[85vh] rounded-2xl overflow-hidden bg-gray-50">

          <MapComponent reports={MOCK_REPORTS} />

          {/* harta */}
          <div className="absolute top-6 left-6 bottom-6 w-85 bg-white rounded-2xl z-10 p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-blue">Sesizări</h2>
              <Link
                href="/sesizari/nou"
                className="bg-orange hover:bg-orange-400 text-white text-sm font-bold py-2 px-3 rounded-lg transition-all active:scale-95"
              >
                + Adaugă
              </Link>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Caută sesizare după ID"
                className="w-full p-3 bg-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue/30 transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <details className="group rounded-lg" open>
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Status
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Rezolvate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">În lucru</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Respinse / Nevalide</span>
                  </label>
                </div>
              </details>

              <details className="group rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Categorie
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Infrastructură rutieră</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Iluminat public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Salubritate și deșeuri</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Parcuri și spații verzi</span>
                  </label>
                </div>
              </details>

              <details className="group rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Perioadă adăugare
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada" value="toate" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Toate timpurile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada" value="luna" className="w-4 h-4" />
                    <span className="text-gray-700 text-sm">Ultima lună</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada" value="saptamana" className="w-4 h-4" />
                    <span className="text-gray-700 text-sm">Ultimele 7 zile</span>
                  </label>
                </div>
              </details>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="flex md:hidden flex-col w-full px-4 py-4 gap-3">

        {/* harta */}
        <div className="relative w-full h-[88.5vh] rounded-2xl overflow-hidden bg-gray-50">
          <MapComponent reports={MOCK_REPORTS} />

          {/* bara peste harta */}
          <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
            <input
              type="text"
              placeholder="Caută sesizare după ID"
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
        </div>

        {/* drawer filtre */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="relative bg-white rounded-t-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-dark-blue">Filtre</h3>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              {/* filters */}
              <details className="group rounded-lg" open>
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Status
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Rezolvate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">În lucru</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Respinse / Nevalide</span>
                  </label>
                </div>
              </details>

              <details className="group rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Categorie
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Infrastructură rutieră</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Iluminat public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Salubritate și deșeuri</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Parcuri și spații verzi</span>
                  </label>
                </div>
              </details>

              <details className="group rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  Perioadă adăugare
                  <Image src="/icons/chevron-down.svg" alt="Deschide" width={16} height={16} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-b-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada_m" value="toate" className="w-4 h-4" defaultChecked />
                    <span className="text-gray-700 text-sm">Toate timpurile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada_m" value="luna" className="w-4 h-4" />
                    <span className="text-gray-700 text-sm">Ultima lună</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perioada_m" value="saptamana" className="w-4 h-4" />
                    <span className="text-gray-700 text-sm">Ultimele 7 zile</span>
                  </label>
                </div>
              </details>

              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full bg-blue text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs mt-2"
              >
                Aplică filtrele
              </button>
            </div>
          </div>
        )}

      </div>

    </APIProvider>
  );
}
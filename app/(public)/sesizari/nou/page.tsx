"use client";

import MapComponent from "@/app/ui/map";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { APIProvider, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { CENTER, BOUNDS } from "@/app/config/map";

function SesizareNoua() {
  const map = useMap("HARTA_SESIZARI_GALATI");
  const placesLib = useMapsLibrary("places");

  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (!placesLib || !map) return;
    autocompleteService.current = new placesLib.AutocompleteService();
  }, [placesLib, map]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (isSelectingRef.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value || value.length < 3) { setSuggestions([]); return; }

    debounceTimer.current = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        {
          input: value,
          locationRestriction: {
            north: BOUNDS.north,
            south: BOUNDS.south,
            east: BOUNDS.east,
            west: BOUNDS.west,
          },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);
  };

  const handleSelectSuggestion = async (prediction: google.maps.places.AutocompletePrediction) => {
    isSelectingRef.current = true;
    setSuggestions([]);
    setAddress(prediction.description);

    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      const place = new Place({ id: prediction.place_id, requestedLanguage: "ro" });
      await place.fetchFields({ fields: ["location"] });

      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();

        if (lat >= BOUNDS.south && lat <= BOUNDS.north && lng >= BOUNDS.west && lng <= BOUNDS.east) {
          map?.setCenter({ lat, lng });
          map?.setZoom(18);
        } else {
          map?.setCenter(CENTER);
          setAddress("");
        }
      }
    } catch (err) {
      console.error("Eroare la obținerea detaliilor locației:", err);
    } finally {
      isSelectingRef.current = false;
    }
  };

  const onMapMove = useCallback((lat: number, lng: number) => {
    if (isSelectingRef.current) return;
    if (lat < BOUNDS.south || lat > BOUNDS.north || lng < BOUNDS.west || lng > BOUNDS.east) {
      setAddress("");
      return;
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => { if (data.results?.[0]) setAddress(data.results[0].formatted_address); })
      .catch(console.error);
  }, []);

  const formContent = (
    <div className="flex flex-col gap-6">

      {/* locatie */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Locație</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            placeholder="Caută o adresă..."
            onChange={(e) => handleAddressChange(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-300 overflow-hidden z-50">
              {suggestions.map((s) => (
                <li
                  key={s.place_id}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <span className="font-bold">{s.structured_formatting.main_text}</span>
                  <span className="text-gray-400 text-xs ml-1">{s.structured_formatting.secondary_text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* categorie */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Categorie</label>
        <div className="grid grid-cols-2 gap-2">
          {["Gropi", "Iluminat", "Gunoi", "Spații Verzi"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`p-4 rounded-xl text-xs font-bold transition-all border-2 ${
                selectedCategory === cat
                  ? "bg-blue text-white border-blue"
                  : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* fotografii */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Fotografii</label>
        <div className="flex gap-2">
          <button type="button" className="flex-1 aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <span className="text-xl text-gray-400">+</span>
          </button>
          <div className="flex-1 aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200" />
          <div className="flex-1 aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200" />
        </div>
      </div>

      {/* detalii */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Detalii</label>
        <textarea
          placeholder="Descrieți problema..."
          className="w-full h-24 p-4 bg-gray-100 rounded-xl text-sm focus:outline-none resize-none"
        />
      </div>

      <button className="w-full bg-orange hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
        Trimite Sesizarea
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="hidden md:block relative w-full h-[85vh] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
        <MapComponent onCenterChange={onMapMove} />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
          <Image src="/icons/pin_blue.svg" alt="Pin" width={48} height={48} priority />
        </div>

        <div className="absolute top-6 left-6 bottom-6 w-95 bg-white rounded-2xl z-30 p-8 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-4 mb-8 text-dark-blue">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Image src="/icons/chevron-down.svg" alt="Inapoi" width={24} height={24} className="rotate-90" />
            </Link>
            <h2 className="text-2xl font-bold">Sesizare Nouă</h2>
          </div>
          {formContent}
        </div>
      </div>

      {/* MOBILE  */}
      <div className="flex md:hidden flex-col w-full h-full">

        {/* harta */}
        <div className="relative w-full h-[45vh] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          <MapComponent onCenterChange={onMapMove} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
            <Image src="/icons/pin_blue.svg" alt="Pin" width={40} height={40} priority />
          </div>

          {/* buton inapoi peste harta */}
          <Link href="/" className="absolute top-4 left-4 z-30 bg-white p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors">
            <Image src="/icons/chevron-down.svg" alt="Inapoi" width={20} height={20} className="rotate-90" />
          </Link>
        </div>

        {/* formular */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl mt-3 p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-6">Sesizare Nouă</h2>
          {formContent}
        </div>

      </div>
    </>
  );
}

export default function PaginaSesizare() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
      <div className="w-full h-full relative px-4 md:px-12 py-5 bg-white">
        <SesizareNoua />
      </div>
    </APIProvider>
  );
}
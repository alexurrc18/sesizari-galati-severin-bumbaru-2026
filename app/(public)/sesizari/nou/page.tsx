"use client";

import MapComponent from "@/app/ui/map";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { APIProvider, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { CENTER, BOUNDS } from "@/app/config/map";
import { useAuth } from "@/app/context/auth-context";
import { fetchCategories, type Category } from "@/app/lib/api";
import { useRouter } from "next/navigation";

function SesizareNoua() {
  const map = useMap("HARTA_SESIZARI_GALATI");
  const placesLib = useMapsLibrary("places");
  const { authenticatedFetch, userData } = useAuth();
  const router = useRouter();

  // Stare formular
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(CENTER);

  // File variables
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);

  // Categorii din API
  const [categories, setCategories] = useState<Category[]>([]);

  // Stare submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Autocomplete refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingRef = useRef(false);

  // Fetch categorii la mount
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

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
          setMapCenter({ lat, lng });
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
    setMapCenter({ lat, lng });
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

  // Submit sesizare
  const handleSubmit = async () => {
    setMessage(null);

    // Validare
    if (!selectedCategoryId) {
      setMessage({ type: 'error', text: 'Selectează o categorie.' });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setMessage({ type: 'error', text: 'Descrierea trebuie să aibă cel puțin 10 caractere.' });
      return;
    }
    if (!userData?.validation) {
      setMessage({ type: 'error', text: 'Trebuie să-ți completezi profilul înainte de a trimite o sesizare.' });
      return;
    }

    setIsSubmitting(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      // 1. Upload files first if any
      const filesToUpload = files.filter(f => f !== null) as File[];
      let uploadedUrls: string[] = [];

      if (filesToUpload.length > 0) {
          const formData = new FormData();
          filesToUpload.forEach(f => formData.append('files', f));

          const token = Cookies.get('auth_token');

          const uploadRes = await fetch(`${apiUrl}/Reports/upload-media`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'ngrok-skip-browser-warning': 'true' // Ngrok block bypass
              },
              body: formData
          });

          if (!uploadRes.ok) {
              const err = await uploadRes.json().catch(() => null);
              throw new Error(err?.eroare || 'Eroare la încărcarea imaginilor.');
          }

          const uploadData = await uploadRes.json();
          uploadedUrls = uploadData.urls || [];
      }

      // 2. Trimite Report
      const response = await authenticatedFetch(`${apiUrl}/Reports`, {
        method: 'POST',
        body: JSON.stringify({
          description: description.trim(),
          idCategory: selectedCategoryId,
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          fileUrls: uploadedUrls
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sesizarea a fost trimisă cu succes! Vei fi redirecționat...' });
        setTimeout(() => router.push('/'), 2500);
      } else {
        const err = await response.json().catch(() => null);
        setMessage({ type: 'error', text: err?.message || err?.eroare || 'A apărut o eroare. Reîncercați.' });
      }
    } catch (err: any) {
      console.error("Fetch error details:", err);
      setMessage({ type: 'error', text: `EROARE CRITICĂ: ${err?.message || JSON.stringify(err)}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-6">

      {/* locatie */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Locație</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            placeholder="Caută o adresă sau mută harta..."
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
        <p className="text-xs text-gray-400 ml-1">
          📍 Lat: {mapCenter.lat.toFixed(6)}, Lng: {mapCenter.lng.toFixed(6)}
        </p>
      </div>

      {/* categorie — din API */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Categorie</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.idCategory}
              type="button"
              onClick={() => setSelectedCategoryId(cat.idCategory)}
              className={`p-3 rounded-xl text-xs font-bold transition-all border-2 text-left ${
                selectedCategoryId === cat.idCategory
                  ? "bg-blue text-white border-blue"
                  : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
          {categories.length === 0 && (
            <span className="text-gray-400 text-sm italic col-span-2">Se încarcă categoriile...</span>
          )}
        </div>
      </div>

      {/* detalii */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Descriere</label>
        <textarea
          placeholder="Descrieți problema în detaliu..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-28 p-4 bg-gray-100 rounded-xl text-sm focus:outline-none resize-none border-2 border-transparent focus:border-blue/20"
        />
        <span className="text-xs text-gray-400 ml-1">{description.length} caractere (min. 10)</span>
      </div>

      {/* Media (3 poze max) */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Imagini (Max 3)</label>
        <div className="flex gap-4">
          {[0, 1, 2].map(index => (
             <div key={index} className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue/50 bg-gray-50 flex items-center justify-center overflow-hidden transition-all group cursor-pointer"
                  onClick={() => document.getElementById(`file-upload-${index}`)?.click()}>
                {previews[index] ? (
                  <>
                    <img src={previews[index] as string} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                         e.stopPropagation();
                         const newPreviews = [...previews]; newPreviews[index] = null;
                         const newFiles = [...files]; newFiles[index] = null;
                         setPreviews(newPreviews); setFiles(newFiles);
                         const inputEl = document.getElementById(`file-upload-${index}`) as HTMLInputElement;
                         if (inputEl) inputEl.value = '';
                      }}
                    >&times;</button>
                  </>
                ) : (
                  <span className="text-gray-400 text-2xl font-light">+</span>
                )}
                <input
                   id={`file-upload-${index}`}
                   type="file"
                   accept="image/png, image/jpeg, image/webp"
                   className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const newFiles = [...files]; newFiles[index] = file;
                       const newPreviews = [...previews]; newPreviews[index] = URL.createObjectURL(file);
                       setFiles(newFiles); setPreviews(newPreviews);
                     }
                   }}
                />
             </div>
          ))}
        </div>
      </div>

      {/* mesaj succes/eroare */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-bold text-center ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs ${
          isSubmitting
            ? "bg-orange-300 text-white cursor-wait"
            : "bg-orange hover:bg-orange-500 text-white active:scale-95"
        }`}
      >
        {isSubmitting ? "Se trimite..." : "Trimite Sesizarea"}
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
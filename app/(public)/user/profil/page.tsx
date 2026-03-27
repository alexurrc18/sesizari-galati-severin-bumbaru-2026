"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { userData, completeProfile, updateLocalUserData, authenticatedFetch, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnp, setCnp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setEmail(userData.email || "");
      setPhone(userData.phone || "");
      setCnp(userData.cnp || "");
    }
  }, [userData]);

  const handleSave = async () => {
    setMessage(null);
    
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setMessage({ type: 'error', text: 'Completează toate câmpurile obligatorii (Nume, Prenume, Telefon).' });
      return;
    }

    setIsSaving(true);
    
    if (!userData?.validation) {
      // ===== PROFIL NOU — completare inițială (CNP obligatoriu) =====
      if (!cnp.trim() || cnp.length !== 13) {
        setMessage({ type: 'error', text: 'CNP-ul trebuie să aibă exact 13 cifre.' });
        setIsSaving(false);
        return;
      }

      const success = await completeProfile({
        firstName,
        lastName,
        cnp,
        phone
      });
      
      if (success) {
        setMessage({ type: 'success', text: 'Profil completat cu succes! Acum poți adăuga sesizări.' });
        setTimeout(() => router.push('/'), 2000);
      } else {
        setMessage({ type: 'error', text: 'A apărut o eroare la salvare. Verifică datele introduse.' });
      }
    } else {
      // ===== PROFIL EXISTENT — actualizare date (fără CNP) =====
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      try {
        const response = await authenticatedFetch(`${apiUrl}/Users/${userData.idUser}`, {
          method: 'PUT',
          body: JSON.stringify({
            firstName,
            lastName,
            phone
          })
        });
        
        if (response.ok) {
          // Actualizare stare locală + localStorage
          updateLocalUserData({ firstName, lastName, phone });
          setMessage({ type: 'success', text: 'Profil actualizat cu succes!' });
        } else {
          const err = await response.json().catch(() => null);
          setMessage({ type: 'error', text: err?.message || 'A apărut o eroare la salvare.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Eroare de conexiune.' });
      }
    }
    
    setIsSaving(false);
  };

  if (authLoading) {
    return <div className="p-6 text-dark-blue font-bold">Se încarcă...</div>;
  }

  if (!userData) {
    return <div className="p-6 text-dark-blue font-bold">Se încarcă datele profilului...</div>;
  }

  const isNewProfile = !userData.validation;
  const hasCnp = !!(userData.cnp && userData.cnp.trim().length > 0);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Profilul meu</h1>
        {isNewProfile && (
          <p className="text-sm text-orange font-medium mt-1">
            Completează-ți profilul pentru a putea adăuga sesizări.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Nume</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Numele tău"
              className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Prenume</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prenumele tău"
              className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            placeholder="email@exemplu.ro"
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-400 border-2 border-transparent cursor-not-allowed select-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Număr de telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx xxx xxx"
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">CNP</label>
          <input
            type="text"
            value={cnp}
            onChange={(e) => setCnp(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={13}
            disabled={hasCnp}
            placeholder="xxxxxxxxxxxxx"
            className={`w-full p-3 bg-gray-100 rounded-xl text-sm font-bold border-2 border-transparent ${
              hasCnp ? "text-gray-400 cursor-not-allowed select-none" : "text-gray-700 focus:outline-none focus:border-blue/20"
            }`}
          />
          {hasCnp && <span className="text-xs text-gray-400 ml-1">CNP-ul nu poate fi modificat după prima salvare.</span>}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-bold text-center ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {message.text}
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`mt-2 w-full font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs ${
            isSaving ? "bg-orange-300 text-white cursor-wait" : "bg-orange hover:bg-orange-500 text-white active:scale-95"
          }`}
        >
          {isSaving ? "Se salvează..." : (isNewProfile ? "Completează profilul" : "Salvează modificările")}
        </button>

      </div>
    </div>
  );
}
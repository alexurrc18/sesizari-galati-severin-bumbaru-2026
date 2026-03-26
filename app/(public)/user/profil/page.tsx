"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/auth-context";

export default function ProfilPage() {
  const { userData, updateProfile } = useAuth();

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
    if (!userData?.idUser) {
        setMessage({ type: 'error', text: 'Eroare: Lipsă ID utilizator.'});
        return;
    }
    
    setIsSaving(true);
    
    const success = await updateProfile(
      {
        firstName,
        lastName,
        phone,
        cnp
      },
      userData.idUser
    );
    
    if (success) {
        setMessage({ type: 'success', text: 'Profil actualizat cu succes!'});
    } else {
        setMessage({ type: 'error', text: 'A apărut o eroare la salvare.'});
    }
    
    setIsSaving(false);
  };

  if (!userData) {
      return <div className="p-6 text-dark-blue font-bold">Se încarcă datele profilului...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold text-dark-blue">Profilul meu</h1>

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
            onChange={(e) => setCnp(e.target.value)}
            disabled={!!userData?.cnp && userData.cnp.length > 0}
            placeholder="xxxxxxxxxxxxx"
            className={`w-full p-3 bg-gray-100 rounded-xl text-sm font-bold border-2 border-transparent ${
              userData?.cnp && userData.cnp.length > 0 ? "text-gray-400 cursor-not-allowed select-none" : "text-gray-700 focus:outline-none focus:border-blue/20"
            }`}
          />
          <span className="text-xs text-gray-400 ml-1">CNP-ul nu poate fi modificat după prima salvare.</span>
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
          {isSaving ? "Se salvează..." : "Salvează modificările"}
        </button>

      </div>
    </div>
  );
}
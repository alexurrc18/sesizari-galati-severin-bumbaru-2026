"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [pinError, setPinError] = useState(false);

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  {/* SEND PIN */}
  const handleSendPin = () => {
    if (!validateEmail(email)) {
      setEmailError(true);
      setIsEmailSent(false);
    } else {
      setEmailError(false);
      setIsEmailSent(true);
    }
  };

  {/* LOGIN */}
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setPinError(true);
    } else {
      setPinError(false);

    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <div className="p-8 bg-white rounded-2xl w-100 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-primarie-inchis text-center">Conectare</h1>
        
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 ml-1">Adresă email</label>
            <div className="relative flex items-center">
              <input 
                type="email" 
                value={email}
                disabled={isEmailSent}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                placeholder="exemplu@email.com" 
                className={`w-full p-3 bg-gray-100 rounded-lg focus:outline-none pr-32 text-sm border-2 transition-all ${
                  emailError ? "border-red-500 bg-red-50" : "border-transparent focus:border-blue"
                } ${isEmailSent ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-200" : ""}`} 
              />
              
              {!isEmailSent ? (
                <button 
                  type="button"
                  onClick={handleSendPin}
                  className="absolute right-1.5 px-3 py-1.5 bg-blue hover:bg-[#4a8ebf] text-white text-[10px] font-bold rounded-md transition-colors whitespace-nowrap"
                >
                  TRIMITE PIN
                </button>
              ) : (
                <div className="absolute right-1.5 px-3 py-1.5 bg-green-200 text-green-800 text-[10px] font-bold rounded-md whitespace-nowrap flex items-center gap-1">
                  PIN TRIMIS
                </div>
              )}
            </div>
            {emailError && <p className="text-[10px] text-red-500 ml-1 italic font-medium">Email invalid.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 ml-1">Cod PIN (6 cifre)</label>
            <input 
              type="text" 
              maxLength={6}
              value={pin}
              disabled={!isEmailSent}
              onChange={(e) => {
                setPin(e.target.value);
                if(pinError) setPinError(false);
              }}
              placeholder="000000" 
              className={`p-3 bg-gray-100 rounded-lg focus:outline-none text-center tracking-[0.5em] font-mono text-lg border-2 transition-all ${
                pinError ? "border-red-500 bg-red-50" : "border-transparent focus:border-blue"
              } ${!isEmailSent ? "opacity-40 cursor-not-allowed" : ""}`} 
            />
            {pinError && (
              <p className="text-[11px] text-red-500 ml-1 font-medium italic">
                PIN-ul trebuie să aibă 6 cifre.
              </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={!isEmailSent}
            className={`p-4 rounded-xl font-bold transition-all mt-2 active:scale-[0.98] ${
                isEmailSent 
                ? "bg-blue hover:bg-[#4a8ebf] text-white" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Verifică și intră în cont
          </button>
        </form>
      </div>
    </div>
  );
}
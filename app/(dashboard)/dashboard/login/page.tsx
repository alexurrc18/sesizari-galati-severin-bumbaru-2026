"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStaffAuth } from "@/app/context/staff-auth-context";

export default function DashboardLogin() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [apiError, setApiError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { requestPin, verifyPin } = useStaffAuth();

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleSendPin = async () => {
    setApiError("");

    if (!validateEmail(email)) {
      setEmailError(true);
      setIsEmailSent(false);
      return;
    }

    setEmailError(false);
    setIsLoading(true);

    const success = await requestPin(email);
    
    setIsLoading(false);

    if (success) {
      setIsEmailSent(true);
    } else {
      setApiError("Eroare la trimiterea codului. Vă rugăm să reîncercați.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    if (pin.length !== 6) {
      setPinError(true);
      return;
    }
    
    setPinError(false);
    setIsLoading(true);

    const result = await verifyPin(email, pin);
    
    setIsLoading(false);

    if (result.success) {
      router.push("/dashboard/admin/home");
    } else {
      setApiError(result.errorMessage || "Cod incorect sau expirat.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <div className="p-8 bg-white rounded-2xl w-100 border border-gray-200 shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-dark-blue text-center">Conectare Angajat</h1>
        <p className="text-xs text-gray-400 text-center mb-6">Acces exclusiv pentru personalul administrației</p>
        
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 ml-1">Adresă email instituțională</label>
            <div className="relative flex items-center">
              <input 
                type="email" 
                value={email}
                disabled={isEmailSent || isLoading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                placeholder="exemplu@municipiugalati.ro" 
                className={`w-full p-3 bg-gray-100 rounded-lg focus:outline-none pr-32 text-sm border-2 transition-all ${
                  emailError ? "border-red-500 bg-red-50" : "border-transparent focus:border-blue/30"
                } ${(isEmailSent || isLoading) ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-200" : ""}`} 
              />
              
              {!isEmailSent ? (
                <button 
                  type="button"
                  onClick={handleSendPin}
                  disabled={isLoading}
                  className={`absolute right-1.5 px-3 py-1.5 text-white text-[10px] font-bold rounded-md transition-colors whitespace-nowrap ${
                    isLoading ? "bg-gray-400 cursor-wait" : "bg-blue hover:bg-[#4a8ebf]"
                  }`}
                >
                  {isLoading ? "SE TRIMITE..." : "TRIMITE PIN"}
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
              disabled={!isEmailSent || isLoading}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ''));
                if(pinError) setPinError(false);
              }}
              placeholder="000000" 
              className={`p-3 bg-gray-100 rounded-lg focus:outline-none text-center tracking-[0.5em] font-mono text-lg border-2 transition-all ${
                pinError ? "border-red-500 bg-red-50" : "border-transparent focus:border-blue/30"
              } ${(!isEmailSent || isLoading) ? "opacity-40 cursor-not-allowed" : ""}`} 
            />
            {pinError && (
              <p className="text-[11px] text-red-500 ml-1 font-medium italic">
                PIN-ul trebuie să aibă exact 6 cifre.
              </p>
            )}
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium text-center">
              {apiError}
            </div>
          )}

          <button 
            type="submit"
            disabled={!isEmailSent || isLoading}
            className={`p-4 rounded-xl font-bold transition-all mt-2 active:scale-[0.98] ${
                isEmailSent && !isLoading 
                ? "bg-blue hover:bg-[#4a8ebf] text-white" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading && isEmailSent ? "SE VERIFICĂ..." : "Verifică și intră în cont"}
          </button>
        </form>
      </div>
    </div>
  );
}
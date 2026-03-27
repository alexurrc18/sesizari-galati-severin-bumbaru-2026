"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Chei pentru angajați (partajate cu staff-auth-context)
const STAFF_TOKEN_KEY = 'staff_token';
const STAFF_DATA_KEY = 'staff_data';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

const baseHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
});

export interface UserData {
    idUser: number;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    cnp?: string;
    validation: boolean;
}

interface AuthContextType {
    token: string | null;
    userData: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    requestPin: (email: string) => Promise<boolean>;
    verifyPin: (email: string, pin: string) => Promise<{ success: boolean; redirect?: string; errorMessage?: string }>;
    logout: () => void;

    completeProfile: (data: { firstName: string; lastName: string; cnp: string; phone: string }) => Promise<boolean>;
    updateLocalUserData: (data: Partial<UserData>) => void;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Restaurare state din cookie + localStorage la mount
    useEffect(() => {
        const savedToken = Cookies.get(TOKEN_KEY);
        if (savedToken) {
            setToken(savedToken);
            try {
                const saved = localStorage.getItem(USER_DATA_KEY);
                if (saved) {
                    setUserData(JSON.parse(saved));
                }
            } catch (e) {
                console.error('Eroare la citirea datelor utilizatorului:', e);
            }
        } else {
            // Cookie expirat/șters (browser închis) → curăță și localStorage
            localStorage.removeItem(USER_DATA_KEY);
        }
        setIsLoading(false);
    }, []);

    // Trimite OTP pe email
    const requestPin = async (email: string): Promise<boolean> => {
        try {
            const response = await fetch(`${apiUrl}/Auth/request-code`, {
                method: 'POST',
                headers: baseHeaders(),
                body: JSON.stringify({ email })
            });
            return response.ok;
        } catch (error) {
            console.error('Eroare la trimiterea codului:', error);
            return false;
        }
    };

    // Verifică OTP și stochează JWT-ul real
    const verifyPin = async (email: string, pin: string): Promise<{ success: boolean; redirect?: string; errorMessage?: string }> => {
        try {
            const response = await fetch(`${apiUrl}/Auth/verify-code`, {
                method: 'POST',
                headers: baseHeaders(),
                body: JSON.stringify({ email, code: pin })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => null);
                return { success: false, errorMessage: err?.eroare || 'Cod invalid sau expirat.' };
            }

            const data = await response.json();

            // Dacă e angajat → stochează token-ul în staff_token și redirect direct la dashboard
            // (fără a cere un al doilea cod OTP)
            if (data.role === 'employee') {
                Cookies.set(STAFF_TOKEN_KEY, data.token, { path: '/' });
                localStorage.setItem(STAFF_DATA_KEY, JSON.stringify({
                    idEmployee: data.user.idEmployee,
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                    email: data.user.email,
                    phone: data.user.phone,
                    deptCode: data.user.deptCode
                }));
                return { success: true, redirect: '/dashboard/admin/home' };
            }

            // Stocare JWT REAL în cookie (nu email-ul!)
            Cookies.set(TOKEN_KEY, data.token, { path: '/' });
            setToken(data.token);

            // Stocare date user din răspuns
            const user: UserData = {
                idUser: data.user.idUser,
                firstName: data.user.firstName || undefined,
                lastName: data.user.lastName || undefined,
                email: data.user.email,
                phone: data.user.phone || undefined,
                cnp: data.user.cnp || undefined,
                validation: data.isProfileValid ?? false
            };
            setUserData(user);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

            // Redirect: profil necompletat → completare, altfel → hartă
            const redirectPath = data.isProfileValid ? '/' : '/user/profil';
            return { success: true, redirect: redirectPath };
        } catch (error) {
            console.error('Eroare la verificarea codului:', error);
            return { success: false, errorMessage: 'Eroare de conexiune. Reîncercați.' };
        }
    };

    const logout = () => {
        Cookies.remove(TOKEN_KEY, { path: '/' });
        localStorage.removeItem(USER_DATA_KEY);
        setToken(null);
        setUserData(null);
        router.push('/login');
    };

    // Completare profil (user nou, după prima autentificare)
    const completeProfile = async (data: { firstName: string; lastName: string; cnp: string; phone: string }): Promise<boolean> => {
        if (!userData?.idUser) return false;
        try {
            const response = await fetch(`${apiUrl}/Auth/complete-profile/${userData.idUser}`, {
                method: 'POST',
                headers: baseHeaders(),
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updated: UserData = {
                    ...userData,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    cnp: data.cnp,
                    phone: data.phone,
                    validation: true
                };
                setUserData(updated);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Eroare la completarea profilului:', error);
            return false;
        }
    };

    // Actualizare date user local (după PUT /Users/{id} reușit)
    const updateLocalUserData = (data: Partial<UserData>) => {
        setUserData(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...data };
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    // Fetch autentificat — adaugă automat Bearer token
    const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const currentToken = Cookies.get(TOKEN_KEY);
        const headers: Record<string, string> = {
            ...baseHeaders(),
            ...((options.headers as Record<string, string>) || {}),
        };
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        return fetch(url, { ...options, headers });
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{
            token,
            userData,
            isAuthenticated,
            isLoading,
            requestPin,
            verifyPin,
            logout,
            completeProfile,
            updateLocalUserData,
            authenticatedFetch
        }}>
            {children}
        </AuthContext.Provider>
    );
};
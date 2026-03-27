"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const STAFF_TOKEN_KEY = 'staff_token';
const STAFF_DATA_KEY = 'staff_data';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

const baseHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
});

export interface EmployeeData {
    idEmployee: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    deptCode: string;
}

interface StaffAuthContextType {
    token: string | null;
    employeeData: EmployeeData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isD10: boolean; // Departament D10 = poate modifica date

    requestPin: (email: string) => Promise<boolean>;
    verifyPin: (email: string, pin: string) => Promise<{ success: boolean; errorMessage?: string }>;
    logout: () => void;

    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const useStaffAuth = () => {
    const context = useContext(StaffAuthContext);
    if (!context) {
        throw new Error('useStaffAuth trebuie folosit în interiorul unui StaffAuthProvider');
    }
    return context;
};

export const StaffAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Restaurare state la mount
    useEffect(() => {
        const savedToken = Cookies.get(STAFF_TOKEN_KEY);
        if (savedToken) {
            setToken(savedToken);
            try {
                const saved = localStorage.getItem(STAFF_DATA_KEY);
                if (saved) {
                    setEmployeeData(JSON.parse(saved));
                }
            } catch (e) {
                console.error('Eroare la citirea datelor angajatului:', e);
            }
        } else {
            // Cookie expirat/șters (browser închis) → curăță și localStorage
            localStorage.removeItem(STAFF_DATA_KEY);
        }
        setIsLoading(false);
    }, []);

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

    const verifyPin = async (email: string, pin: string): Promise<{ success: boolean; errorMessage?: string }> => {
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

            // Dacă NU e angajat, refuză login-ul pe dashboard
            if (data.role !== 'employee') {
                return {
                    success: false,
                    errorMessage: 'Acest cont nu este de angajat. Folosiți portalul pentru cetățeni.'
                };
            }

            // Stocare JWT real
            Cookies.set(STAFF_TOKEN_KEY, data.token, { path: '/' });
            setToken(data.token);

            // Stocare date angajat
            const employee: EmployeeData = {
                idEmployee: data.user.idEmployee,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                email: data.user.email,
                phone: data.user.phone,
                deptCode: data.user.deptCode
            };
            setEmployeeData(employee);
            localStorage.setItem(STAFF_DATA_KEY, JSON.stringify(employee));

            return { success: true };
        } catch (error) {
            console.error('Eroare la verificarea codului:', error);
            return { success: false, errorMessage: 'Eroare de conexiune. Reîncercați.' };
        }
    };

    const logout = () => {
        Cookies.remove(STAFF_TOKEN_KEY, { path: '/' });
        localStorage.removeItem(STAFF_DATA_KEY);
        setToken(null);
        setEmployeeData(null);
        router.push('/dashboard/login');
    };

    // Fetch autentificat cu token angajat
    const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const currentToken = Cookies.get(STAFF_TOKEN_KEY);
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
    const isD10 = employeeData?.deptCode === 'D10';

    return (
        <StaffAuthContext.Provider value={{
            token,
            employeeData,
            isAuthenticated,
            isLoading,
            isD10,
            requestPin,
            verifyPin,
            logout,
            authenticatedFetch
        }}>
            {children}
        </StaffAuthContext.Provider>
    );
};

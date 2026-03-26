"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'auth_token';

interface UserData {
    idUser?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cnp?: string;
    validation?: boolean;
}

interface AuthContextType {
    token: string | null;
    userData: UserData | null;
    isAuthenticated: boolean;
    
    requestPin: (email: string) => Promise<boolean>;
    verifyPin: (email: string, pin: string) => Promise<boolean>;
    logout: () => void;
    
    updateProfile: (data: Partial<UserData>, userId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth trebuie folosit in interiorul unui AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const router = useRouter();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

    const fetchUserData = async (userEmail: string) => {
        try {
            const response = await fetch(`${apiUrl}/Users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const users = await response.json();
                const currentUser = users.find((u: UserData) => u.email === userEmail);
                
                if (currentUser) {
                    setUserData(currentUser);
                } else {
                    setUserData({ email: userEmail });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const savedToken = Cookies.get(TOKEN_KEY);
            if (savedToken) {
                setToken(savedToken);
                await fetchUserData(savedToken);
            }
        };
        loadInitialData();
    }, []);

    const requestPin = async (email: string) => {
        try {
            const response = await fetch(`${apiUrl}/Auth/request-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ email })
            });
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const verifyPin = async (email: string, pin: string) => {
        try {
            const response = await fetch(`${apiUrl}/Auth/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ email: email, code: pin })
            });

            if (response.ok) {
                Cookies.set(TOKEN_KEY, email, { expires: 7, path: '/' });
                setToken(email);
                await fetchUserData(email);
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const logout = () => {
        Cookies.remove(TOKEN_KEY, { path: '/' });
        setToken(null);
        setUserData(null);
        router.push('/login');
    };

    const updateProfile = async (newData: Partial<UserData>, userId: number) => {
        if (!token) return false;

        try {
            const response = await fetch(`${apiUrl}/Auth/complete-profile/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    firstName: newData.firstName,
                    lastName: newData.lastName,
                    cnp: newData.cnp,
                    phone: newData.phone
                })
            });

            if (response.ok) {
                setUserData(prev => prev ? { ...prev, ...newData } : null);
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{
            token,
            userData,
            isAuthenticated,
            requestPin,
            verifyPin,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
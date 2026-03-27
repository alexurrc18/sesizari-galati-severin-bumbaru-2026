"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [authState, setAuthState] = useState<'none' | 'user' | 'employee'>('none');

    // Verifică ambele cookie-uri (user + angajat)
    useEffect(() => {
        const checkAuth = () => {
            const userToken = Cookies.get('auth_token');
            const staffToken = Cookies.get('staff_token');
            
            if (userToken) setAuthState('user');
            else if (staffToken) setAuthState('employee');
            else setAuthState('none');
        };

        checkAuth();

        // Re-verifică periodic (ex: după login în alt tab)
        const interval = setInterval(checkAuth, 2000);
        return () => clearInterval(interval);
    }, []);

    const getButtonLink = () => {
        switch (authState) {
            case 'user': return '/user/profil';
            case 'employee': return '/dashboard/admin/home';
            default: return '/login';
        }
    };

    const getButtonLabel = () => {
        switch (authState) {
            case 'user': return 'Profilul meu';
            case 'employee': return 'Dashboard';
            default: return 'Conectare';
        }
    };

    return (
        <nav className="w-full px-6 md:px-12 py-4 flex items-center justify-between bg-white relative z-50">
            <div className="flex items-center">
                <Link href="/" className="transition-opacity hover:opacity-80">
                    <Image
                        src="/logo.png"
                        alt="Logo Galați"
                        width={120}
                        height={50}
                        priority
                    />
                </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
                <Link
                    href="https://stiri.primariagalati.ro/"
                    target="_blank"
                    className="text-sm font-bold text-dark-blue hover:text-blue transition-colors"
                >
                    Știri
                </Link>

                <Link
                    href="https://www.primariagalati.ro/"
                    target="_blank"
                    className="text-sm font-bold text-dark-blue hover:text-blue transition-colors"
                >
                    Primăria Galați
                </Link>

                <Link
                    href={getButtonLink()}
                    className="bg-blue text-white px-6 py-3 text-sm font-bold flex items-center gap-2 hover:bg-[#4a8ebf] transition-all rounded-xl active:scale-95"
                >
                    {getButtonLabel()}
                </Link>
            </div>

            <button
                className="md:hidden p-2 focus:outline-none flex items-center justify-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <Image src="/icons/x.svg" alt="Inchide" width={24} height={24} />
                ) : (
                    <Image src="/icons/menu.svg" alt="Meniu" width={24} height={24} />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-sm flex flex-col items-center gap-6 py-6 md:hidden border-t border-gray-100">
                    <Link
                        href="https://stiri.primariagalati.ro/"
                        target="_blank"
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-dark-blue hover:text-blue transition-colors"
                    >
                        Știri
                    </Link>

                    <Link
                        href="https://www.primariagalati.ro/"
                        target="_blank"
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-dark-blue hover:text-blue transition-colors"
                    >
                        Primăria Galați
                    </Link>

                    <Link
                        href={getButtonLink()}
                        onClick={() => setIsOpen(false)}
                        className="bg-blue text-white px-8 py-3 text-sm font-bold flex items-center gap-2 hover:bg-[#4a8ebf] transition-all rounded-xl active:scale-95 w-11/12 justify-center"
                    >
                        {getButtonLabel()}
                    </Link>
                </div>
            )}
        </nav>
    );
}
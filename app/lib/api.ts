// Funcții centralizate pentru comunicarea cu backend-ul

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const baseHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
});

// ==========================================
// TIPURI (mapate pe DTO-urile din backend)
// ==========================================

export interface ApiReport {
    idReport: number;
    latitude: number;
    longitude: number;
    description: string;
    idCategory: number;
    idStatus: number;
    idPriority?: number | null;
    priorityName?: string | null;
    createdAt: string;
    officialResponse?: string;
    voteCount: number;
    attachments: string[];
    companyName?: string;
    history: ReportHistoryDto[];
}

export interface Category {
    idCategory: number;
    categoryName: string;
    idDomain?: number | null;
}

export interface ReportHistoryDto {
    statusOld?: string;
    statusNew: string;
    changedAt: string;
}

export interface ApiStatus {
    idStatus: number;
    statusName: string;
}

export interface Company {
    idCompany: number;
    taxId: string;
    companyName: string;
    idDomain: number;
}

export interface Priority {
    idPriority: number;
    levelName: string;
    resolutionDays: number;
}

// Tip unificat pentru componente UI (map, card, etc.)
export interface MapReport {
    id: number;
    lat: number;
    lng: number;
    categoryName: string;
    statusId: number;
    statusName: string;
    description: string;
    createdAt: string;
    officialResponse?: string;
    voteCount: number;
    attachments: string[];
    companyName?: string;
    priorityName?: string | null;
    history: ReportHistoryDto[];
}

// ==========================================
// FUNCȚII FETCH (publice, fără JWT)
// ==========================================

export async function fetchPublicReports(): Promise<ApiReport[]> {
    const response = await fetch(`${API_URL}/Reports/public`, {
        headers: baseHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
    const response = await fetch(`${API_URL}/Lookups/categories`, {
        headers: baseHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

export async function fetchStatuses(): Promise<ApiStatus[]> {
    const response = await fetch(`${API_URL}/Lookups/statuses`, {
        headers: baseHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

export async function fetchCompanies(): Promise<Company[]> {
    const response = await fetch(`${API_URL}/Lookups/companies`, {
        headers: baseHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

export async function fetchPriorities(): Promise<Priority[]> {
    const response = await fetch(`${API_URL}/Lookups/priorities`, {
        headers: baseHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

// ==========================================
// HELPER: Conversie ApiReport → MapReport
// ==========================================

export function toMapReport(
    report: ApiReport,
    categoryMap: Record<number, string>,
    statusMap: Record<number, string>
): MapReport {
    // Extract base URL from NEXT_PUBLIC_API_URL (eliminate /api ending)
    const backendRoot = API_URL.replace(/\/api$/, '') || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || '';

    // Prefix attachments with backendRoot if they are relative paths
    const fullAttachments = (report.attachments || []).map(url =>
        url.startsWith('/') ? `${backendRoot}${url}` : url
    );

    return {
        id: report.idReport,
        lat: Number(report.latitude),
        lng: Number(report.longitude),
        categoryName: categoryMap[report.idCategory] || 'Necunoscută',
        statusId: report.idStatus,
        statusName: statusMap[report.idStatus] || 'Necunoscut',
        description: report.description,
        createdAt: report.createdAt,
        officialResponse: report.officialResponse,
        voteCount: report.voteCount || 0,
        attachments: fullAttachments,
        companyName: report.companyName,
        priorityName: report.priorityName,
        history: report.history || [],
    };
}

// ==========================================
// VOT: Toggle vot pe o sesizare
// ==========================================

import Cookies from 'js-cookie';

export async function toggleVote(reportId: number): Promise<{ voted: boolean; totalVotes: number } | null> {
    const token = Cookies.get('auth_token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/Reports/${reportId}/vote`, {
            method: 'POST',
            headers: {
                ...baseHeaders(),
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

// ==========================================
// ABUZ: Raportare spam/duplicat
// ==========================================
export async function reportAbuse(reportId: number, reason: string): Promise<{ success: boolean; message: string }> {
    const token = Cookies.get('auth_token');
    if (!token) return { success: false, message: 'Trebuie să fii autentificat pentru a raporta un abuz.' };

    try {
        const response = await fetch(`${API_URL}/Reports/${reportId}/report-abuse`, {
            method: 'POST',
            headers: {
                ...baseHeaders(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            return { success: false, message: err?.eroare || err?.mesaj || 'Eroare la raportarea abuzului.' };
        }
        
        const data = await response.json().catch(() => null);
        return { success: true, message: data?.mesaj || 'Sesizarea a fost raportată cu succes echipelor.' };
    } catch (err) {
        console.error("Eroare reportAbuse:", err);
        return { success: false, message: 'Eroare de conexiune.' };
    }
}

// ==========================================
// ABUSE STATUS: Verificare dacă userul a raportat deja
// ==========================================
export async function checkAbuseStatus(reportId: number): Promise<boolean> {
    const token = Cookies.get('auth_token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/Reports/${reportId}/abuse-status`, {
            headers: {
                ...baseHeaders(),
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.alreadyReported === true;
    } catch {
        return false;
    }
}

// Culoare pin pe hartă bazată pe status ID (nume din BD)
// Status 1 = Nerezolvat (nu apare pe hartă publică, filtrat de backend)
// Status 2 = În lucru
// Status 3 = Rezolvat
// Status 4 = Respins
export const STATUS_PIN_MAP: Record<number, string> = {
    1: '/icons/pin_blue.svg',      // Nerezolvat
    2: '/icons/pin_marigold.svg',  // În lucru
    3: '/icons/pin_green.svg',     // Rezolvat
    4: '/icons/pin_red.svg',       // Respins
};

export function getPinIcon(statusId: number): string {
    return STATUS_PIN_MAP[statusId] || '/icons/pin_blue.svg';
}

// Culoare badge status
export function getStatusStyle(statusId: number): { bg: string; text: string } {
    switch (statusId) {
        case 1: return { bg: 'bg-blue-100', text: 'text-blue-700' };       // Nerezolvat
        case 2: return { bg: 'bg-orange-100', text: 'text-orange-700' };   // În lucru
        case 3: return { bg: 'bg-green-100', text: 'text-green-700' };     // Rezolvat
        case 4: return { bg: 'bg-red-100', text: 'text-red-700' };         // Respins
        default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
}

export type ReportStatus = "rezolvat" | "inlucru" | "respins" | "propus";
export type ReportCategory = "Gropi" | "Iluminat" | "Gunoi" | "Spații Verzi";

export interface Report {
    id: string;
    lat: number;
    lng: number;
    category: ReportCategory;
    status: ReportStatus;
    description: string;
    createdAt: string;
    photos?: string[];
}

export const MOCK_REPORTS: Report[] = [
    {
        id: "1",
        lat: 45.4353,
        lng: 28.0079,
        category: "Gropi",
        status: "inlucru",
        description: "Groapă mare pe stradă, pericol pentru mașini.",
        createdAt: "2024-03-01",
        photos: [
            "https://images.unsplash.com/photo-1774173511915-c1777df1560f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774249890206-081fd2e702d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        ],
    },
    {
        id: "2",
        lat: 45.4400,
        lng: 28.0150,
        category: "Iluminat",
        status: "rezolvat",
        description: "Stâlp de iluminat ars pe strada principală.",
        createdAt: "2024-03-05",
        photos: [
            "https://images.unsplash.com/photo-1774173511915-c1777df1560f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774249890206-081fd2e702d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        ],
    },
    {
        id: "3",
        lat: 45.4300,
        lng: 28.0050,
        category: "Gunoi",
        status: "respins",
        description: "Gunoi aruncat ilegal lângă bloc.",
        createdAt: "2024-03-10",
        photos: [
            "https://images.unsplash.com/photo-1774173511915-c1777df1560f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774249890206-081fd2e702d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        ],
    },
    {
        id: "4",
        lat: 45.4450,
        lng: 28.0200,
        category: "Spații Verzi",
        status: "propus",
        description: "Parc degradat, bănci rupte și vegetație neîngrijită.",
        createdAt: "2024-03-12",
        photos: [
            "https://images.unsplash.com/photo-1774173511915-c1777df1560f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774249890206-081fd2e702d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        ],
    },
    {
        id: "5",
        lat: 45.4280,
        lng: 28.0120,
        category: "Gropi",
        status: "rezolvat",
        description: "Groapă la trotuar în fața școlii.",
        createdAt: "2024-03-15",
        photos: [
            "https://images.unsplash.com/photo-1774173511915-c1777df1560f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774028156717-6b9f92babd2d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1774249890206-081fd2e702d5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        ],
    },
];
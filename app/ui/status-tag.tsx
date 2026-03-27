import { getStatusStyle } from "@/app/lib/api";

interface StatusTagProps {
    statusId: number;
    statusName: string;
}

export default function StatusTag({ statusId, statusName }: StatusTagProps) {
    const style = getStatusStyle(statusId);

    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
            {statusName}
        </span>
    );
}
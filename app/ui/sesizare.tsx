"use client";

import { MapReport, getStatusStyle, toggleVote, reportAbuse, checkAbuseStatus } from "@/app/lib/api";
import Image from "next/image";
import { useState, useEffect } from "react";

interface SesizareProps {
    report: MapReport;
    actionIcon?: 'close' | 'dots';
    onActionClick?: () => void;
    onVoteUpdate?: (reportId: number, newVoteCount: number) => void;
}

// Culoare badge prioritate
function getPriorityStyle(name?: string | null): { bg: string; text: string; icon: string } {
    if (!name) return { bg: '', text: '', icon: '' };
    const lower = name.toLowerCase();
    if (lower.includes('urgent') || lower.includes('critic')) return { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' };
    if (lower.includes('ridicat') || lower.includes('mare') || lower.includes('high')) return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🟠' };
    if (lower.includes('mediu') || lower.includes('medium') || lower.includes('normal')) return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡' };
    if (lower.includes('scăzut') || lower.includes('scazut') || lower.includes('low')) return { bg: 'bg-green-100', text: 'text-green-700', icon: '🟢' };
    return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' };
}

export default function Sesizare({ report, actionIcon, onActionClick, onVoteUpdate }: SesizareProps) {
    const statusStyle = getStatusStyle(report.statusId);
    const [voteCount, setVoteCount] = useState(report.voteCount);
    const [hasVoted, setHasVoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const [alreadyReported, setAlreadyReported] = useState(false);

    // Verificare abuse status la mount
    useEffect(() => {
        checkAbuseStatus(report.id).then(reported => {
            if (reported) setAlreadyReported(true);
        });
    }, [report.id]);

    // Formatare dată
    const formattedDate = (() => {
        try {
            return new Date(report.createdAt).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return report.createdAt;
        }
    })();

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVoting) return;
        
        setIsVoting(true);
        const result = await toggleVote(report.id);
        
        if (result) {
            setVoteCount(result.totalVotes);
            setHasVoted(result.voted);
            onVoteUpdate?.(report.id, result.totalVotes);
        } else {
            alert("Trebuie să fii autentificat pentru a vota.");
        }
        setIsVoting(false);
    };

    const priorityStyle = getPriorityStyle(report.priorityName);

    return (
        <div
            className="mb-2 bg-white rounded-2xl border border-gray-200 p-4 w-72 flex flex-col gap-3 cursor-default shadow-lg"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-blue uppercase tracking-widest">
                        {report.categoryName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        #{report.id}
                    </span>
                </div>
                
                {actionIcon && onActionClick && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onActionClick();
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center w-6 h-6"
                    >
                        {actionIcon === 'close' && <span className="text-2xl leading-none">&times;</span>}
                        {actionIcon === 'dots' && (
                            <Image src="/icons/dots-vertical-rounded.svg" alt="Optiuni" width={20} height={20} />
                        )}
                    </button>
                )}
            </div>

            {/* Badge Prioritate (vizibilă pentru toată lumea) */}
            {report.priorityName && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${priorityStyle.bg} ${priorityStyle.text}`}>
                    {priorityStyle.icon} {report.priorityName}
                </span>
            )}

            <p className="text-sm text-gray-700 font-medium line-clamp-3">{report.description}</p>

            {report.attachments && report.attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {report.attachments.map((url, i) => (
                        <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={url} alt={`Atașament ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            {report.officialResponse && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-1">Răspuns oficial</span>
                    <p className="text-xs text-green-700 font-medium line-clamp-2">{report.officialResponse}</p>
                </div>
            )}

            {/* Istoric scurt (Timeline) */}
            {report.history && report.history.length > 0 && (
                <div className="mt-1 border-l-2 border-gray-200 pl-3 ml-1 flex flex-col gap-2 relative">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-[-2px] bg-white pr-1 py-0.5 z-10">
                        Istoric Stări
                    </span>
                    <div className="mt-2 flex flex-col gap-2">
                        {report.history.map((h: any, idx: number) => {
                            const isNewest = idx === 0;
                            const histStatusName = h.statusNew || "Actualizat";
                            const isAssigned = h.statusNew === "În lucru";
                            
                            return (
                                <div key={idx} className="relative flex items-center justify-between">
                                    <div className={`absolute -left-[17px] w-2 h-2 rounded-full ${isNewest ? 'bg-blue scale-110' : 'bg-gray-300'}`} />
                                    
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-bold leading-none ${isNewest ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {histStatusName}
                                            {isAssigned && report.companyName && (
                                                <span className="ml-1 px-1 py-0.5 rounded bg-orange-50 border border-orange-100 text-orange-600 text-[8px] uppercase font-black">
                                                    {report.companyName}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                                            {new Date(h.changedAt).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                    {report.statusName}
                </span>
                
                <div className="flex items-center gap-2">
                    {/* Vote button */}
                    <button
                        onClick={handleVote}
                        disabled={isVoting}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                            hasVoted
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-red-500'
                        } ${isVoting ? 'opacity-50 cursor-wait' : 'cursor-pointer active:scale-90'}`}
                    >
                        <span className={`text-sm transition-transform duration-200 ${hasVoted ? 'scale-110' : ''}`}>
                            {hasVoted ? '❤️' : '🤍'}
                        </span>
                        <span>{voteCount}</span>
                    </button>
                    
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">{formattedDate}</span>
                        {/* Buton raportare — dezactivat dacă a raportat deja */}
                        {alreadyReported ? (
                            <span
                                className="text-gray-300 text-xs ml-1 cursor-not-allowed"
                                title="Ai raportat deja această sesizare"
                            >
                                🚩
                            </span>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsReporting(!isReporting); }}
                                className="text-gray-400 hover:text-red-500 text-xs ml-1 transition-colors"
                                title="Raportează sesizare">
                                🚩
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Fereastră Raportare Abuz */}
            {isReporting && !alreadyReported && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Motiv Raportare:</span>
                    <select 
                        value={reportReason} 
                        onChange={e => setReportReason(e.target.value)}
                        className="text-xs p-1 border border-red-200 rounded text-gray-700 bg-white focus:outline-none"
                    >
                        <option value="">Alege motivul...</option>
                        <option value="Conținut Inadecvat / Limbaj">Limbaj / Poze Neadecvate</option>
                        <option value="Dublură">Este o dublură</option>
                        <option value="Spam / Fals">Problemă falsă (Spam)</option>
                    </select>
                    <div className="flex gap-2">
                        <button 
                            disabled={!reportReason || submittingReport}
                            onClick={async (e) => {
                                e.stopPropagation();
                                setSubmittingReport(true);
                                const res = await reportAbuse(report.id, reportReason);
                                alert(res.message);
                                setSubmittingReport(false);
                                if(res.success) {
                                    setIsReporting(false);
                                    setAlreadyReported(true);
                                }
                            }}
                            className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold disabled:opacity-50 hover:bg-red-600 transition-colors"
                        >
                            {submittingReport ? "Trimite..." : "Trimite"}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsReporting(false); }}
                            className="text-gray-500 text-[10px] px-2 py-1 hover:underline"
                        >
                            Anulează
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
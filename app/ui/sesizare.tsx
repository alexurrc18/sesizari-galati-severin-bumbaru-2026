"use client";

import { Report } from "@/app/config/sesizari";
import Image from "next/image";
import { useState } from "react";
import StatusTag from "./status-tag";

interface props {
    report: Report;
    actionIcon?: 'close' | 'dots';
    onActionClick?: () => void;
}

export default function Sesizare({ report, actionIcon, onActionClick }: props) {
    const [votes, setVotes] = useState(0);
    const [voted, setVoted] = useState(false);

    const handleVote = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (voted) {
            setVotes((v) => v - 1);
            setVoted(false);
        } else {
            setVotes((v) => v + 1);
            setVoted(true);
        }
    };

    return (
        <div
            className="mb-2 bg-white rounded-2xl border border-gray-200 p-4 w-72 flex flex-col gap-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-start">
                <span className="text-xs font-black text-blue uppercase tracking-widest mt-1">
                    {report.category}
                </span>
                
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

            {report.photos && report.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {report.photos.map((photo, i) => (
                        <div key={i} className="relative w-20 shrink-0 aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            <Image src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" />
                        </div>
                    ))}
                </div>
            )}

            <p className="text-sm text-gray-700 font-medium">{report.description}</p>

            <div className="flex items-center justify-between">
                <StatusTag status={report.status} />
                <span className="text-xs text-gray-400">{report.createdAt}</span>
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                <button
                    onClick={handleVote}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95  cursor-pointer ${
                        voted ? "bg-blue text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                    <Image
                        src="/icons/thumb-up.svg"
                        alt="Upvote"
                        width={14}
                        height={14}
                        className={voted ? "brightness-0 invert" : ""}
                    />
                    <span>{votes}</span>
                </button>
                <span className="text-xs text-gray-400">
                    {votes === 1 ? "persoană susține" : "persoane susțin"}
                </span>
            </div>
        </div>
    );
}
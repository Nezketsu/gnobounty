import Link from "next/link";
import { Clock, Coins, User, CheckCircle, ArrowRight } from "lucide-react";

interface BountyCardProps {
    id: string;
    title: string;
    issueUrl: string;
    description: string;
    amount: string;
    isClaimed: boolean;
    createdAt: string;
    creator: string;
    claimer: string;
    claimedAt: string;
    onApply: (id: string) => void;
}

export default function BountyCard({
    id,
    title,
    issueUrl,
    description,
    amount,
    isClaimed,
    createdAt,
    creator,
    onApply,
}: BountyCardProps) {
    const formatAmount = (ugnot: string) => {
        if (!ugnot || ugnot === "" || ugnot === "0") return "0";
        const val = parseInt(ugnot);
        return isNaN(val) ? "0" : (val / 1000000).toLocaleString();
    };

    return (
        <Link
            href={`/bounty/${id}`}
            className="group relative bg-[#0a0a1f] border border-cyan-900/30 hover:border-cyan-500/50 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer"
        >
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col h-full p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold border ${isClaimed
                            ? "bg-red-950/30 text-red-500 border-red-900"
                            : "bg-cyan-950/30 text-cyan-400 border-cyan-900"
                            }`}>
                            {isClaimed ? "STATUS::CLAIMED" : "STATUS::OPEN"}
                        </span>
                        <span className="text-cyan-800 text-xs font-mono">ID::{id.padStart(3, '0')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold bg-cyan-950/20 px-2 py-1 border border-cyan-900/30">
                        <Coins className="w-3 h-3" />
                        <span>{formatAmount(amount)} GNOT</span>
                    </div>
                </div>

                <div className="block mb-3 group-hover:translate-x-1 transition-transform">
                    <h3 className="text-lg font-bold text-cyan-100 group-hover:text-cyan-400 transition-colors line-clamp-1 font-mono">
                        {title || (issueUrl ? issueUrl.split('/').slice(-2).join('/') : `BOUNTY_REF_${id}`)}
                    </h3>
                </div>

                <p className="text-cyan-200/60 text-xs mb-6 line-clamp-3 flex-grow font-mono leading-relaxed border-l-2 border-cyan-900/30 pl-3">
                    {description || "NO_DATA_AVAILABLE"}
                </p>

                <div className="mt-auto pt-4 border-t border-cyan-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-cyan-700 font-mono">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{creator ? creator : "UNKNOWN_USER"}</span>
                    </div>

                    <div className="flex gap-2">
                        {!isClaimed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onApply(id);
                                }}
                                className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold uppercase tracking-wider transition-all z-10"
                            >
                                Apply
                            </button>
                        )}
                        <span
                            className="px-3 py-1 bg-black group-hover:bg-cyan-950/30 text-cyan-600 group-hover:text-cyan-400 border border-cyan-900 group-hover:border-cyan-500/50 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                        >
                            View <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

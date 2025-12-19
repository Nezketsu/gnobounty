"use client";

import { useState } from "react";
import { X, Loader2, GitPullRequest } from "lucide-react";

interface ApplyBountyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prLink: string) => Promise<void>;
    bountyTitle?: string;
}

export default function ApplyBountyModal({ isOpen, onClose, onSubmit, bountyTitle }: ApplyBountyModalProps) {
    const [loading, setLoading] = useState(false);
    const [prLink, setPrLink] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSubmit(prLink);
            onClose();
            setPrLink("");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-[#0a0a1f] border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden animate-in zoom-in-95 duration-200 font-mono"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-cyan-950/10">
                    <div>
                        <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                            SUBMIT_APPLICATION
                        </h2>
                        {bountyTitle && <p className="text-xs text-cyan-700 truncate max-w-[250px] font-bold mt-1">REF: {bountyTitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* PR Link Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-2 tracking-wider">
                            <GitPullRequest className="w-3 h-3" />
                            Solution_Link (PR URL)
                        </label>
                        <input
                            type="url"
                            required
                            placeholder="https://github.com/..."
                            className="w-full px-4 py-3 bg-[#050510] border border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
                            value={prLink}
                            onChange={(e) => setPrLink(e.target.value)}
                        />
                        <p className="text-xs text-cyan-800 font-bold">
                            // SUBMIT_PROOF_OF_WORK
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-transparent border border-cyan-900 text-cyan-700 hover:text-cyan-500 hover:border-cyan-500 font-bold uppercase transition-all tracking-wider text-sm"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider text-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    TRANSMITTING...
                                </>
                            ) : (
                                "CONFIRM_SUBMISSION"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

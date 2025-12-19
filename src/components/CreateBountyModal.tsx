"use client";

import { useState } from "react";
import { X, Loader2, Coins, Type, Link as LinkIcon, AlignLeft } from "lucide-react";

interface CreateBountyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; issueUrl: string; description: string; amount: string }) => Promise<void>;
}

export default function CreateBountyModal({ isOpen, onClose, onSubmit }: CreateBountyModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        issueUrl: "",
        description: "",
        amount: ""
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSubmit(formData);
            onClose();
            // Reset form
            setFormData({ title: "", issueUrl: "", description: "", amount: "" });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg bg-[#0a0a1f] border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden animate-in zoom-in-95 duration-200 font-mono"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-cyan-950/10">
                    <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                        INIT_NEW_BOUNTY
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Title Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-2 tracking-wider">
                            <Type className="w-3 h-3" />
                            Target_Identifier (Title)
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. FIX_CRITICAL_BUG_0x1"
                            className="w-full px-4 py-3 bg-[#050510] border border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Issue URL Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-2 tracking-wider">
                            <LinkIcon className="w-3 h-3" />
                            Source_Link (Issue URL)
                        </label>
                        <input
                            type="url"
                            required
                            placeholder="https://github.com/..."
                            className="w-full px-4 py-3 bg-[#050510] border border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
                            value={formData.issueUrl}
                            onChange={(e) => setFormData({ ...formData, issueUrl: e.target.value })}
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-2 tracking-wider">
                            <Coins className="w-3 h-3" />
                            Bounty_Value (GNOT)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-[#050510] border border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-700 text-xs font-bold pointer-events-none">
                                GNOT
                            </div>
                        </div>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-2 tracking-wider">
                            <AlignLeft className="w-3 h-3" />
                            Mission_Brief (Description)
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="ENTER_MISSION_DETAILS..."
                            className="w-full px-4 py-3 bg-[#050510] border border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all resize-none font-mono text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
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
                                    INITIALIZING...
                                </>
                            ) : (
                                "DEPLOY_BOUNTY"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

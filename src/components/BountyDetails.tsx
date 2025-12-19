"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Clock, Coins, User, CheckCircle, XCircle, FileText, Users } from "lucide-react";
import { getBountyDetails, getBountyApplications, Bounty, BountyApplication } from "@/lib/gno";

interface BountyDetailsProps {
    bountyId: string;
    onBack: () => void;
    onApply: (id: string) => void;
}

export default function BountyDetails({ bountyId, onBack, onApply }: BountyDetailsProps) {
    const [bounty, setBounty] = useState<Bounty | null>(null);
    const [applications, setApplications] = useState<BountyApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(true);

    useEffect(() => {
        loadBountyDetails();
        loadApplications();
    }, [bountyId]);

    async function loadBountyDetails() {
        try {
            setLoading(true);
            const data = await getBountyDetails(bountyId);
            setBounty(data);
        } catch (error) {
            console.error("Failed to load bounty details:", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadApplications() {
        try {
            setLoadingApplications(true);
            const apps = await getBountyApplications(bountyId);
            setApplications(apps);
        } catch (error) {
            console.error("Failed to load applications:", error);
        } finally {
            setLoadingApplications(false);
        }
    }

    const formatAmount = (ugnot: string) => {
        if (!ugnot || ugnot === "" || ugnot === "0") return "0";
        const val = parseInt(ugnot);
        return isNaN(val) ? "0" : (val / 1000000).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!bounty) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Bounty Not Found</h2>
                <p className="text-slate-400 mb-6">The bounty you're looking for doesn't exist.</p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="container mx-auto px-4 py-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Bounties
                </button>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${bounty.isClaimed
                                            ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                            : "bg-green-500/10 text-green-400 border-green-500/20"
                                        }`}>
                                        {bounty.isClaimed ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Claimed
                                            </span>
                                        ) : (
                                            "Open"
                                        )}
                                    </span>
                                    <span className="text-slate-500 text-sm">Bounty #{bounty.id}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                                    {bounty.title || (bounty.issueUrl ? bounty.issueUrl.split('/').slice(-2).join('/') : `Bounty #${bounty.id}`)}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3 text-slate-200 font-bold text-2xl">
                                <Coins className="w-8 h-8 text-yellow-500" />
                                <span>{formatAmount(bounty.amount)} GNOT</span>
                            </div>
                        </div>

                        {/* Issue URL */}
                        {bounty.issueUrl && bounty.issueUrl !== "" && (
                            <a
                                href={bounty.issueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
                            >
                                View Issue <ExternalLink className="w-4 h-4" />
                            </a>
                        )}

                        {/* Description */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-slate-300 mb-3">Description</h2>
                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {bounty.description || "No description provided"}
                            </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 bg-slate-900 rounded-xl border border-slate-800">
                            <div>
                                <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Creator</h3>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <code className="text-sm break-all">{bounty.creator || "Unknown"}</code>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Created</h3>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm">{bounty.createdAt || "Unknown"}</span>
                                </div>
                            </div>

                            {bounty.isClaimed && (
                                <>
                                    <div>
                                        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Claimed By</h3>
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <User className="w-4 h-4 text-slate-500" />
                                            <code className="text-sm break-all">{bounty.claimer || "Unknown"}</code>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Claimed At</h3>
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm">{bounty.claimedAt || "Unknown"}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        {!bounty.isClaimed && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onApply(bounty.id)}
                                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                >
                                    Apply for this Bounty
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Applications Section */}
                    <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h2 className="text-xl font-bold text-slate-200">Applications</h2>
                            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full">
                                {applications.length}
                            </span>
                        </div>

                        {loadingApplications ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
                                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">No applications yet</p>
                                <p className="text-slate-500 text-xs mt-1">Be the first to apply for this bounty!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${app.status === "Pending"
                                                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                            : app.status === "Approved"
                                                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                    <span className="text-slate-500 text-xs">Application #{app.id}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                    <code className="text-xs">{app.applicant}</code>
                                                </div>
                                            </div>
                                            {app.prLink && app.prLink !== "" && (
                                                <a
                                                    href={app.prLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg text-sm transition-colors"
                                                >
                                                    View PR <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

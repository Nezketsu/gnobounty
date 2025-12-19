"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ExternalLink, Clock, Coins, User, CheckCircle, XCircle, GitPullRequest } from "lucide-react";
import { getBountyDetails, getBountyApplications, Bounty, BountyApplication, connectWallet, applyForBounty, voteOnApplication } from "@/lib/gno";
import ApplyBountyModal from "@/components/ApplyBountyModal";

export default function BountyPage() {
    const params = useParams();
    const router = useRouter();
    const bountyId = params.id as string;

    const [bounty, setBounty] = useState<Bounty | null>(null);
    const [applications, setApplications] = useState<BountyApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(true);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [votingOnApp, setVotingOnApp] = useState<string | null>(null);

    useEffect(() => {
        if (bountyId) {
            loadBountyDetails();
            loadApplications();
        }
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
            console.log("Loaded applications:", apps);
            setApplications(apps);
        } catch (error) {
            console.error("Failed to load applications:", error);
        } finally {
            setLoadingApplications(false);
        }
    }

    async function handleApplySubmit(prLink: string) {
        try {
            const account = await connectWallet();
            await applyForBounty(bountyId, prLink, account.address);
            alert("Application submitted successfully!");
            // Optionally reload to show new application if we were displaying them
        } catch (error) {
            console.error(error);
            alert("Failed to apply: " + (error as Error).message);
            throw error;
        }
    }

    async function handleVote(applicationId: string, approve: boolean) {
        try {
            setVotingOnApp(applicationId);
            const account = await connectWallet();
            await voteOnApplication(applicationId, approve, account.address);
            alert(`Vote ${approve ? 'approved' : 'rejected'} successfully!`);
            // Reload applications to show updated status
            await loadApplications();
        } catch (error) {
            console.error(error);
            alert("Failed to vote: " + (error as Error).message);
        } finally {
            setVotingOnApp(null);
        }
    }

    const formatAmount = (ugnot: string) => {
        if (!ugnot || ugnot === "" || ugnot === "0") return "0";
        const val = parseInt(ugnot);
        return isNaN(val) ? "0" : (val / 1000000).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent font-mono">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                    <span className="text-cyan-400 font-bold animate-pulse">ACCESSING_MAINFRAME...</span>
                </div>
            </div>
        );
    }

    if (!bounty) {
        return (
            <div className="min-h-screen bg-transparent font-mono">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
                    <XCircle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-red-500 mb-2 uppercase tracking-widest">ERROR_404</h2>
                    <p className="text-cyan-700 mb-6 font-bold">// TARGET_NOT_LOCATED</p>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-black border border-cyan-900 hover:border-cyan-500 text-cyan-500 font-bold uppercase transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        RETURN_TO_BASE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-mono selection:bg-cyan-500/30 selection:text-cyan-100">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-cyan-600 hover:text-cyan-400 mb-6 transition-colors font-bold uppercase text-xs tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    // RETURN_TO_LIST
                </button>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-[#0a0a1f] border border-cyan-900/50 p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-50"></div>

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 border-b border-cyan-900/30 pb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wider ${bounty.isClaimed
                                        ? "bg-red-950/30 text-red-500 border-red-900"
                                        : "bg-cyan-950/30 text-cyan-400 border-cyan-900"
                                        }`}>
                                        {bounty.isClaimed ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                [ STATUS::CLAIMED ]
                                            </span>
                                        ) : (
                                            "[ STATUS::OPEN ]"
                                        )}
                                    </span>
                                    <span className="text-cyan-700 text-sm font-bold">ID::{bounty.id.padStart(3, '0')}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-cyan-100 mb-2 uppercase tracking-tight break-all">
                                    &gt; {bounty.title || (bounty.issueUrl ? bounty.issueUrl.split('/').slice(-2).join('/') : `BOUNTY_${bounty.id}`)}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3 text-cyan-400 font-bold text-2xl bg-cyan-950/20 px-4 py-2 border border-cyan-900/50">
                                <Coins className="w-6 h-6" />
                                <span>{formatAmount(bounty.amount)} GNOT</span>
                            </div>
                        </div>

                        {/* Issue URL */}
                        {bounty.issueUrl && bounty.issueUrl !== "" && (
                            <a
                                href={bounty.issueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-300 mb-8 transition-colors font-bold text-sm uppercase group"
                            >
                                [ ACCESS_SOURCE_INTEL ] <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        )}

                        {/* Description */}
                        <div className="mb-8">
                            <h2 className="text-sm font-bold text-cyan-700 mb-3 uppercase tracking-widest border-b border-cyan-900/30 pb-1 inline-block">
                                // MISSION_PARAMETERS
                            </h2>
                            <p className="text-cyan-100/80 leading-relaxed whitespace-pre-wrap font-mono text-sm border-l-2 border-cyan-900/30 pl-4">
                                {bounty.description || "NO_DATA_AVAILABLE"}
                            </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 bg-cyan-950/10 border border-cyan-900/30">
                            <div>
                                <h3 className="text-xs text-cyan-800 font-bold uppercase tracking-wider mb-2">INITIATOR</h3>
                                <div className="flex items-center gap-2 text-cyan-600">
                                    <User className="w-4 h-4" />
                                    <code className="text-sm">{bounty.creator || "UNKNOWN"}</code>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs text-cyan-800 font-bold uppercase tracking-wider mb-2">TIMESTAMP</h3>
                                <div className="flex items-center gap-2 text-cyan-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{bounty.createdAt || "UNKNOWN"}</span>
                                </div>
                            </div>

                            {bounty.isClaimed && (
                                <>
                                    <div>
                                        <h3 className="text-xs text-cyan-800 font-bold uppercase tracking-wider mb-2">OPERATIVE</h3>
                                        <div className="flex items-center gap-2 text-cyan-600">
                                            <User className="w-4 h-4" />
                                            <code className="text-sm">{bounty.claimer || "UNKNOWN"}</code>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs text-cyan-800 font-bold uppercase tracking-wider mb-2">COMPLETION_TIME</h3>
                                        <div className="flex items-center gap-2 text-cyan-600">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{bounty.claimedAt || "UNKNOWN"}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        {!bounty.isClaimed && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsApplyModalOpen(true)}
                                    className="px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 font-bold uppercase transition-all tracking-wider"
                                >
                                    ENGAGE_CONTRACT
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Applications Section */}
                    <div className="bg-[#0a0a1f] border border-cyan-900/30 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-cyan-500 flex items-center gap-2 uppercase tracking-wider">
                                <GitPullRequest className="w-5 h-5" />
                                &gt; PENDING_TRANSMISSIONS
                            </h2>
                            <span className="px-3 py-1 bg-cyan-950/30 border border-cyan-900 text-cyan-500 text-xs font-bold uppercase">
                                [{applications.length}]
                            </span>
                        </div>

                        {loadingApplications ? (
                            <div className="text-center py-8 border border-dashed border-cyan-900/30">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                                <span className="text-cyan-700 font-bold text-sm uppercase">ACCESSING_DATABASE...</span>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-cyan-900/30">
                                <GitPullRequest className="w-12 h-12 text-cyan-900 mx-auto mb-3" />
                                <p className="text-cyan-800 font-bold text-sm uppercase tracking-wider">NO_DATA_RECEIVED</p>
                                <p className="text-cyan-950 text-xs mt-2">// Awaiting first transmission</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="bg-cyan-950/10 border border-cyan-900/30 p-5 hover:border-cyan-700/50 transition-colors"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-2 py-1 text-xs font-bold border uppercase ${app.status === "Pending"
                                                                ? "bg-yellow-950/30 text-yellow-500 border-yellow-900"
                                                                : app.status === "Approved"
                                                                    ? "bg-green-950/30 text-green-500 border-green-900"
                                                                    : "bg-red-950/30 text-red-500 border-red-900"
                                                            }`}>
                                                            [{app.status}]
                                                        </span>
                                                        <span className="text-cyan-800 text-xs font-bold">TRANS_ID::{app.id.padStart(3, '0')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-cyan-600 font-mono">
                                                        <User className="w-4 h-4 text-cyan-800" />
                                                        <code className="text-xs">{app.applicant}</code>
                                                    </div>

                                                    {/* Display validators for pending applications */}
                                                    {app.status === "Pending" && app.validators && app.validators.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-cyan-900/20">
                                                            <div className="text-cyan-700 text-xs font-bold uppercase mb-2">
                                                                Assigned Validators [{app.validators.length}]:
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                {app.validators.map((validator, idx) => (
                                                                    <code key={idx} className="text-[10px] text-cyan-600/80 font-mono">
                                                                        {idx + 1}. {validator}
                                                                    </code>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {app.prLink && app.prLink !== "" && (
                                                    <a
                                                        href={app.prLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-900 hover:border-cyan-700 text-cyan-500 hover:text-cyan-400 text-xs font-bold uppercase transition-all group"
                                                    >
                                                        [ ACCESS_PR ] <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Validation Controls - Only show for pending applications */}
                                            {app.status === "Pending" && (
                                                <div className="flex items-center gap-3 pt-3 border-t border-cyan-900/20">
                                                    <span className="text-cyan-700 text-xs font-bold uppercase mr-2">// Validator_Action:</span>
                                                    <button
                                                        onClick={() => handleVote(app.id, true)}
                                                        disabled={votingOnApp === app.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-950/20 hover:bg-green-950/40 border border-green-900 hover:border-green-700 text-green-500 hover:text-green-400 text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle className="w-3 h-3" />
                                                        {votingOnApp === app.id ? "PROCESSING..." : "[ APPROVE ]"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(app.id, false)}
                                                        disabled={votingOnApp === app.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900 hover:border-red-700 text-red-500 hover:text-red-400 text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        {votingOnApp === app.id ? "PROCESSING..." : "[ REJECT ]"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ApplyBountyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSubmit={handleApplySubmit}
                bountyTitle={bounty.title}
            />
        </div>
    );
}

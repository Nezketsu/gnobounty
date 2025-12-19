"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BountyCard from "@/components/BountyCard";
import ApplyBountyModal from "@/components/ApplyBountyModal";
import { Loader2, ArrowLeft } from "lucide-react";
import { getBounties, Bounty, connectWallet, applyForBounty } from "@/lib/gno";
import Link from "next/link";

export default function AllBounties() {
    const [bounties, setBounties] = useState<Bounty[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Apply Modal State
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [applyingBountyId, setApplyingBountyId] = useState<string | null>(null);

    useEffect(() => {
        loadBounties();

        // Auto-reload every 10 seconds
        const interval = setInterval(() => {
            loadBounties();
        }, 10000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    async function loadBounties() {
        try {
            // Only show loading spinner on initial load
            if (bounties.length === 0) {
                setLoading(true);
            }
            const data = await getBounties();
            setBounties(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function handleApplyClick(bountyId: string) {
        setApplyingBountyId(bountyId);
        setIsApplyModalOpen(true);
    }

    async function handleApplySubmit(prLink: string) {
        if (!applyingBountyId) return;

        try {
            const account = await connectWallet();
            await applyForBounty(applyingBountyId, prLink, account.address);
            alert("Application submitted successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to apply: " + (error as Error).message);
            throw error;
        }
    }

    return (
        <div className="min-h-screen bg-transparent font-sans selection:bg-purple-500 selection:text-white flex flex-col">
            <Navbar />

            {/* Header Section */}
            <div className="border-b border-cyan-900/30 pt-20 pb-8 bg-linear-to-b from-black/60 to-transparent">
                <div className="container mx-auto px-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm mb-8 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back_to_Home
                    </Link>

                    <div className="text-center">
                        <div className="inline-block mb-4 px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-400 text-xs font-mono uppercase tracking-widest">
                            All Active Contracts
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white font-mono uppercase tracking-tighter">
                            All_Bounties<span className="text-cyan-500 animate-pulse">_</span>
                        </h1>

                        <p className="text-cyan-200/60 font-mono text-sm max-w-2xl mx-auto">
              // Browse all available bounties on the Gno.land network. Connect your wallet and apply to start earning GNOT.
                        </p>
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 grow">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                        <span className="text-cyan-400/80 font-mono animate-pulse">SYNCING_WITH_CHAIN...</span>
                    </div>
                ) : bounties.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-cyan-900/30 rounded-lg bg-cyan-950/10">
                        <p className="text-cyan-100/80 font-bold text-xl mb-2 font-mono">NO_ACTIVE_CONTRACTS</p>
                        <p className="text-cyan-500/40 font-mono text-sm">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 border-b border-cyan-900/30 pb-4">
                            <div>
                                <p className="text-cyan-200/60 font-mono text-sm">
                  // Found <span className="text-cyan-400 font-bold">{bounties.length}</span> active contract{bounties.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-cyan-400/60 text-xs font-mono">
                                    Auto-sync: {lastUpdate.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bounties.map((bounty) => (
                                <BountyCard
                                    key={bounty.id}
                                    id={bounty.id}
                                    title={bounty.title}
                                    issueUrl={bounty.issueUrl}
                                    description={bounty.description}
                                    amount={bounty.amount}
                                    isClaimed={bounty.isClaimed}
                                    createdAt={bounty.createdAt}
                                    creator={bounty.creator}
                                    claimer={bounty.claimer}
                                    claimedAt={bounty.claimedAt}
                                    onApply={handleApplyClick}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            <Footer />

            <ApplyBountyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSubmit={handleApplySubmit}
                bountyTitle={bounties.find(b => b.id === applyingBountyId)?.title}
            />
        </div>
    );
}

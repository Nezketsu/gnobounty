"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Trophy, Coins, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import { getLeaderboard, LeaderboardEntry } from "@/lib/gno";
import Link from "next/link";

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        loadLeaderboard();

        // Auto-reload every 30 seconds
        const interval = setInterval(() => {
            loadLeaderboard();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    async function loadLeaderboard() {
        try {
            if (entries.length === 0) {
                setLoading(true);
            }
            const data = await getLeaderboard();
            setEntries(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const getRankDisplay = (index: number) => {
        switch (index) {
            case 0:
                return "🥇";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return `#${index + 1}`;
        }
    };

    const formatAddress = (address: string) => {
        if (!address) return "UNKNOWN";
        return `${address.slice(0, 10)}...${address.slice(-6)}`;
    };

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
                            Community Rankings
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white font-mono uppercase tracking-tighter flex items-center justify-center gap-3">
                            <Trophy className="w-10 h-10 text-cyan-500" />
                            Leaderboard<span className="text-cyan-500 animate-pulse">_</span>
                        </h1>

                        <p className="text-cyan-200/60 font-mono text-sm max-w-2xl mx-auto mb-6">
                            // Top contributors to the GnoBounty ecosystem. Earn points by creating bounties, getting applications approved, and validating submissions.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-xs font-mono">
                            <div className="flex items-center gap-2 text-cyan-400/80">
                                <Coins className="w-4 h-4" />
                                <span>Bounty Creation: <span className="text-cyan-300 font-bold">10pts</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-green-400/80">
                                <FileText className="w-4 h-4" />
                                <span>Approved Application: <span className="text-green-300 font-bold">20pts</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-400/80">
                                <CheckCircle className="w-4 h-4" />
                                <span>Validation: <span className="text-purple-300 font-bold">5pts</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 grow">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                        <span className="text-cyan-400/80 font-mono animate-pulse">SYNCING_LEADERBOARD...</span>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-cyan-900/30 rounded-lg bg-cyan-950/10">
                        <Trophy className="w-16 h-16 text-cyan-700 mx-auto mb-4" />
                        <p className="text-cyan-100/80 font-bold text-xl mb-2 font-mono">NO_ACTIVITY_RECORDED</p>
                        <p className="text-cyan-500/40 font-mono text-sm">Be the first to contribute and claim the top spot!</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 border-b border-cyan-900/30 pb-4">
                            <div>
                                <p className="text-cyan-200/60 font-mono text-sm">
                                    // <span className="text-cyan-400 font-bold">{entries.length}</span> active contributor{entries.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-cyan-400/60 text-xs font-mono">
                                    Last sync: {lastUpdate.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-cyan-900/30">
                                        <th className="text-left py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">Rank</th>
                                        <th className="text-left py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">User</th>
                                        <th className="text-center py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">Score</th>
                                        <th className="text-center py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">💰 Bounties</th>
                                        <th className="text-center py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">📝 Applications</th>
                                        <th className="text-center py-4 px-4 text-cyan-400 font-mono text-xs uppercase tracking-wider">⚖️ Validations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry, index) => (
                                        <tr
                                            key={entry.address}
                                            className="border-b border-cyan-900/20 hover:bg-cyan-950/20 transition-colors group"
                                        >
                                            <td className="py-4 px-4">
                                                <span className="text-2xl">{getRankDisplay(index)}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <code className="text-cyan-300 font-mono text-sm group-hover:text-cyan-200 transition-colors">
                                                    {formatAddress(entry.address)}
                                                </code>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold font-mono text-lg">
                                                    {entry.score}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-cyan-200/80 font-mono">{entry.bountiesCreated}</span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-cyan-200/80 font-mono">{entry.bountiesApplied}</span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-cyan-200/80 font-mono">{entry.validationsPerformed}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

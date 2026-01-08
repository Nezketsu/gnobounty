"use client";

import Image from "next/image";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { connectWallet } from "@/lib/gno";

export default function Navbar() {
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        // Check if already connected on page load
        const storedAddress = localStorage.getItem('walletAddress');
        if (storedAddress) {
            setAddress(storedAddress);
        }
    }, []);

    async function handleConnect() {
        if (address) {
            // If already connected, do nothing (will be handled by the button click)
            return;
        }

        try {
            const account = await connectWallet();
            setAddress(account.address);
            // Store address in localStorage for persistence
            localStorage.setItem('walletAddress', account.address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("Failed to connect wallet. Make sure Adena is installed.");
        }
    }

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-cyan-900/30 bg-[#050510]/90 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/gnobounty_logo.png"
                        alt="GNO_BOUNTY"
                        width={180}
                        height={40}
                        className="h-8 w-auto object-contain brightness-200 contrast-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                    />
                </Link>

                {/* Navigation Links - Centered */}
                <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-cyan-400/60 hover:text-cyan-400 font-mono text-sm uppercase tracking-wider transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href="/bounties"
                        className="text-cyan-400/60 hover:text-cyan-400 font-mono text-sm uppercase tracking-wider transition-colors"
                    >
                        All_Bounties
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="text-cyan-400/60 hover:text-cyan-400 font-mono text-sm uppercase tracking-wider transition-colors"
                    >
                        Leaderboard
                    </Link>
                </div>

                {address ? (
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 transition-all text-xs font-mono text-cyan-400 uppercase tracking-wider"
                    >
                        <Wallet className="w-3 h-3" />
                        <span>[ {address.slice(0, 6)}...{address.slice(-4)} ]</span>
                    </Link>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 transition-all text-xs font-mono text-cyan-400 uppercase tracking-wider"
                    >
                        <Wallet className="w-3 h-3" />
                        <span>CONNECT_WALLET</span>
                    </button>
                )}
            </div>
        </nav>
    );
}

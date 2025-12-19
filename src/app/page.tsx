"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BountyCard from "@/components/BountyCard";
import CreateBountyModal from "@/components/CreateBountyModal";
import ApplyBountyModal from "@/components/ApplyBountyModal";
import { Loader2, ArrowRight } from "lucide-react";
import { getBounties, Bounty, connectWallet, createBounty, applyForBounty } from "@/lib/gno";
import Hero3D from "@/components/Hero3D";
import Typewriter from "@/components/Typewriter";
import Link from "next/link";

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyingBountyId, setApplyingBountyId] = useState<string | null>(null);

  useEffect(() => {
    loadBounties();
  }, []);

  async function loadBounties() {
    try {
      setLoading(true);
      const data = await getBounties();
      setBounties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBountySubmit(data: { title: string; issueUrl: string; description: string; amount: string }) {
    try {
      const account = await connectWallet();

      // Convert GNOT to ugnot
      const amountUgnot = (parseFloat(data.amount) * 1000000).toString();

      await createBounty(data.title, data.issueUrl, data.description, amountUgnot, account.address);

      alert("Bounty created! Refreshing list...");
      loadBounties();
    } catch (error) {
      console.error(error);
      alert("Failed to create bounty: " + (error as Error).message);
      throw error;
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

      {/* Hero Section with 3D */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-cyan-900/30 pt-20">
        <Hero3D />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-400 text-xs font-mono uppercase tracking-widest animate-pulse">
            System Online :: v1.0.4
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter text-white font-mono">
            GNO_BOUNTY<span className="text-cyan-500 animate-pulse">_</span>
          </h1>

          <Typewriter
            speed={40}
            className="text-xl md:text-2xl text-cyan-200/60 mb-8 max-w-2xl mx-auto font-mono leading-relaxed min-h-[64px]"
            segments={[
              { text: "> Decentralized Task Force. " },
              { text: "Earn GNOT", className: "text-cyan-400" },
              { text: " by contributing to the network." }
            ]}
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.4)] font-mono uppercase tracking-wider"
            >
              Init_Bounty
            </button>
            <a href="#bounties" className="px-8 py-4 bg-cyan-950/30 text-cyan-400 font-bold text-lg border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-400 backdrop-blur-md transition-all font-mono uppercase tracking-wider">
              View_Tasks
            </a>
          </div>
        </div>
      </div>

      <main id="bounties" className="container mx-auto px-4 py-20 grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-cyan-900/30 pb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-3 font-mono uppercase">
              <span className="w-2 h-6 bg-cyan-500"></span>
              Active_Bounties
            </h2>
            <p className="text-cyan-200/40 ml-5 font-mono text-sm">// Discover top opportunities to contribute.</p>
          </div>
          <Link
            href="/bounties"
            className="px-6 py-3 bg-cyan-950/30 text-cyan-400 font-mono text-sm border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all flex items-center gap-2 group"
          >
            <span className="uppercase tracking-wider">View_All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <span className="text-cyan-400/80 font-mono animate-pulse">SYNCING_WITH_CHAIN...</span>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-cyan-900/30 rounded-lg bg-cyan-950/10">
            <p className="text-cyan-100/80 font-bold text-xl mb-2 font-mono">NO_ACTIVE_CONTRACTS</p>
            <p className="text-cyan-500/40 font-mono text-sm">Be the first to initiate a contract.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.slice(0, 4).map((bounty) => (
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
        )}
      </main>

      <CreateBountyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBountySubmit}
      />

      <ApplyBountyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplySubmit}
        bountyTitle={bounties.find(b => b.id === applyingBountyId)?.title}
      />

      <Footer />
    </div>
  );
}

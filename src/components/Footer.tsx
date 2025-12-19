import Link from "next/link";
import { ExternalLink, Github, Twitter } from "lucide-react";

export default function Footer() {
    const realmUrl = "https://gno.land/r/greg007/gnobounty_v2";

    return (
        <footer className="border-t border-cyan-900/30 bg-black/40 backdrop-blur-md mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-cyan-500"></span>
                            GNO_BOUNTY
                        </h3>
                        <p className="text-cyan-200/60 text-sm font-mono leading-relaxed">
              // Decentralized bounty platform<br />
              // Built on Gno.land blockchain<br />
              // Earn GNOT for contributions
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wider">
                            Quick_Access
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/"
                                    className="text-cyan-200/60 hover:text-cyan-400 text-sm font-mono transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-0 group-hover:w-2 h-px bg-cyan-500 transition-all"></span>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/bounties"
                                    className="text-cyan-200/60 hover:text-cyan-400 text-sm font-mono transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-0 group-hover:w-2 h-px bg-cyan-500 transition-all"></span>
                                    All Bounties
                                </Link>
                            </li>
                            <li>
                                <a
                                    href={realmUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-200/60 hover:text-cyan-400 text-sm font-mono transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-0 group-hover:w-2 h-px bg-cyan-500 transition-all"></span>
                                    Smart Contract
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Gnoweb Realm Link */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wider">
                            Blockchain_Info
                        </h4>
                        <div className="space-y-3">
                            <a
                                href={realmUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all font-mono text-sm group"
                            >
                                <span className="tracking-wider">View on Gnoweb</span>
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>
                            <p className="text-cyan-200/40 text-xs font-mono break-all">
                                {realmUrl}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-cyan-900/20">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-cyan-200/40 text-xs font-mono">
                            © 2025 GnoBounty // Built on Gno.land // v1.0.4
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-cyan-200/40 text-xs font-mono">Network Status:</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-cyan-400 text-xs font-mono">ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

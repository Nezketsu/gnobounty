'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

interface Bounty {
  id: string;
  title: string;
  issueUrl: string;
  description: string;
  amount: string;
  creator: string;
  createdAt: string;
  isClaimed: boolean;
  claimer: string;
  claimedAt: string;
}

interface BountyApplication {
  id: string;
  bountyId: string;
  applicant: string;
  prLink: string;
  appliedAt: string;
  status: string;
  validators?: string[];
  bountyTitle?: string;
  bountyAmount?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [createdBounties, setCreatedBounties] = useState<Bounty[]>([]);
  const [applications, setApplications] = useState<BountyApplication[]>([]);

  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (!storedAddress) {
      router.push('/');
      return;
    }
    setAddress(storedAddress);
    loadUserData(storedAddress);
  }, [router]);

  const loadUserData = async (userAddress: string) => {
    setLoading(true);
    console.log('Loading data for address:', userAddress);
    try {
      const [bountiesRes, applicationsRes] = await Promise.all([
        fetch(`/api/user/${userAddress}/bounties`),
        fetch(`/api/user/${userAddress}/applications`)
      ]);

      console.log('Bounties response status:', bountiesRes.status);
      console.log('Applications response status:', applicationsRes.status);

      if (bountiesRes.ok) {
        const bountiesData = await bountiesRes.json();
        console.log('Bounties data:', bountiesData);
        setCreatedBounties(bountiesData);
      } else {
        console.error('Failed to fetch bounties:', await bountiesRes.text());
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        console.log('Applications data:', applicationsData);
        setApplications(applicationsData);
      } else {
        console.error('Failed to fetch applications:', await applicationsRes.text());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('walletAddress');
    router.push('/');
  };

  const formatAmount = (amount: string) => {
    const gnot = parseInt(amount) / 1000000;
    return gnot.toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'rejected':
        return 'text-red-500 border-red-500/30 bg-red-500/10';
      default:
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-cyan-400 font-mono">LOADING_DASHBOARD...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              BACK
            </Link>

            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border border-red-500/30 hover:border-red-400 hover:bg-red-950/50 transition-all text-xs font-mono text-red-400 hover:text-red-300 uppercase tracking-wider"
            >
              <LogOut className="w-3 h-3" />
              DISCONNECT
            </button>
          </div>

          <div className="border-l-4 border-cyan-400 pl-4">
            <h1 className="text-3xl font-bold font-mono mb-2">USER_DASHBOARD</h1>
            <p className="text-gray-400 font-mono text-sm">
              {address.slice(0, 10)}...{address.slice(-8)}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1f3a] border border-cyan-500/30 rounded-lg p-6">
            <div className="text-cyan-400 font-mono text-sm mb-2">BOUNTIES_CREATED</div>
            <div className="text-4xl font-bold">{createdBounties.length}</div>
          </div>

          <div className="bg-[#1a1f3a] border border-cyan-500/30 rounded-lg p-6">
            <div className="text-cyan-400 font-mono text-sm mb-2">APPLICATIONS_SUBMITTED</div>
            <div className="text-4xl font-bold">{applications.length}</div>
          </div>

          <div className="bg-[#1a1f3a] border border-cyan-500/30 rounded-lg p-6">
            <div className="text-cyan-400 font-mono text-sm mb-2">APPROVED_APPLICATIONS</div>
            <div className="text-4xl font-bold">
              {applications.filter(app => app.status.toLowerCase() === 'approved').length}
            </div>
          </div>
        </div>

        {/* Created Bounties Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-mono mb-6 flex items-center">
            <span className="text-cyan-400 mr-2">&gt;</span>
            CREATED_BOUNTIES
          </h2>

          {createdBounties.length === 0 ? (
            <div className="bg-[#1a1f3a]/50 border border-cyan-500/20 rounded-lg p-8 text-center">
              <p className="text-gray-400 font-mono">NO_BOUNTIES_CREATED_YET</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {createdBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="bg-[#1a1f3a] border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/bounty/${bounty.id}`}
                        className="text-xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {bounty.title}
                      </Link>
                      <p className="text-gray-400 mt-2 line-clamp-2">{bounty.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {formatAmount(bounty.amount)} GNOT
                      </div>
                      {bounty.isClaimed && (
                        <div className="text-xs text-green-500 font-mono mt-1">
                          CLAIMED
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400 font-mono">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(bounty.createdAt)}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={bounty.issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors font-mono text-xs"
                      >
                        ISSUE <ExternalLink className="w-3 h-3" />
                      </a>
                      <Link
                        href={`/bounty/${bounty.id}`}
                        className="px-3 py-1 bg-cyan-500 text-black rounded hover:bg-cyan-400 transition-colors font-mono font-bold text-xs"
                      >
                        VIEW_DETAILS
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications Section */}
        <div>
          <h2 className="text-2xl font-bold font-mono mb-6 flex items-center">
            <span className="text-cyan-400 mr-2">&gt;</span>
            MY_APPLICATIONS
          </h2>

          {applications.length === 0 ? (
            <div className="bg-[#1a1f3a]/50 border border-cyan-500/20 rounded-lg p-8 text-center">
              <p className="text-gray-400 font-mono">NO_APPLICATIONS_SUBMITTED_YET</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#1a1f3a] border border-cyan-500/30 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/bounty/${app.bountyId}`}
                          className="text-lg font-bold text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {app.bountyTitle || `Bounty #${app.bountyId}`}
                        </Link>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-xs ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status.toUpperCase()}
                        </div>
                      </div>

                      <a
                        href={app.prLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        Pull Request <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {app.bountyAmount && (
                      <div className="ml-4 text-right">
                        <div className="text-xl font-bold text-green-400">
                          {formatAmount(app.bountyAmount)} GNOT
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400 font-mono">
                      <Clock className="w-4 h-4 mr-2" />
                      Applied: {formatDate(app.appliedAt)}
                    </div>

                    {app.validators && app.validators.length > 0 && (
                      <div className="text-gray-400 font-mono text-xs">
                        {app.validators.length} VALIDATOR{app.validators.length > 1 ? 'S' : ''}
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
  );
}

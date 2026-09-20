import React from 'react';
import { 
  FolderCheck, 
  CheckCircle2, 
  Clock, 
  Layers, 
  UploadCloud, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { RegisteredContent, ActivityItem, UserProfile, LicenseRecord } from '../types';
import { StatCard } from './StatCard';
import { shortenHash } from '../utils/crypto';
import { ContentTypeDonutChart } from './ContentTypeDonutChart';
import { VerificationTrendChart } from './VerificationTrendChart';

interface DashboardViewProps {
  user: UserProfile;
  contentList: RegisteredContent[];
  activities: ActivityItem[];
  currentBlock: number;
  onNavigate: (page: string) => void;
  onSelectContent: (content: RegisteredContent) => void;
  licenses?: LicenseRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  contentList = [],
  activities = [],
  currentBlock,
  onNavigate,
  onSelectContent,
  licenses = []
}) => {
  const safeList = Array.isArray(contentList) ? contentList : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeLicenses = Array.isArray(licenses) ? licenses : [];
  
  const totalRegistered = safeList.length;
  const verifiedCount = safeList.filter(c => c.status === 'Verified').length;
  const activeLicensesCount = safeLicenses.filter(l => l.status === 'Active').length;
  // For zero-state new users, records count is 0. If user has content, include their verified and licensed blocks.
  const blockchainRecordsCount = totalRegistered === 0 ? 0 : totalRegistered + activeLicensesCount;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Image': return <ImageIcon className="w-4 h-4 text-pink-500" />;
      case 'Audio': return <Music className="w-4 h-4 text-purple-500" />;
      case 'Video': return <Video className="w-4 h-4 text-blue-500" />;
      case 'Document': return <FileText className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Verified
          </span>
        );
      case 'Verification Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Hash Mismatch
          </span>
        );
      case 'Pending Audit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            In Mempool
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
            <ShieldCheck className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            Registered
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Immutable Ledger Live & Synced</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name} 👋
            </h2>
            <p className="mt-1.5 text-sm text-slate-300 max-w-xl leading-relaxed">
              Your intellectual property is secured across cryptographic blocks. Generate SHA-256 proofs or verify file integrity against on-chain records anytime.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-register-action-btn"
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Register Content</span>
            </button>
            <button
              id="dashboard-verify-action-btn"
              onClick={() => onNavigate('verify')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verify Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          id="stat-total-registered"
          title="Total Content Registered"
          value={totalRegistered}
          subtitle={totalRegistered > 0 ? "Unique digital master assets" : "No registered content yet"}
          icon={FolderCheck}
          trend={totalRegistered > 0 ? "+3 this week" : "Zero records"}
          trendPositive={totalRegistered > 0}
          colorScheme="purple"
        />
        <StatCard
          id="stat-verified-content"
          title="Verified Content"
          value={verifiedCount}
          subtitle={totalRegistered > 0 ? `${Math.round((verifiedCount / totalRegistered) * 100)}% proof integrity` : "0% verified"}
          icon={CheckCircle2}
          trend={verifiedCount > 0 ? "100% Tamper Free" : "No verifications"}
          trendPositive={verifiedCount > 0}
          colorScheme="emerald"
        />
        <StatCard
          id="stat-active-licenses"
          title="Active Licenses"
          value={activeLicensesCount}
          subtitle={activeLicensesCount > 0 ? "Commercial & editorial grants" : "No active licenses"}
          icon={FileCheck}
          trend={activeLicensesCount > 0 ? "Active IP Grants" : "0 licenses issued"}
          trendPositive={activeLicensesCount > 0}
          colorScheme="amber"
        />
        <StatCard
          id="stat-blockchain-records"
          title="Blockchain Records"
          value={blockchainRecordsCount}
          subtitle={blockchainRecordsCount > 0 ? `Current Block #${currentBlock}` : "0 on-chain records"}
          icon={Layers}
          trend="Polygon PoS"
          trendPositive={blockchainRecordsCount > 0}
          colorScheme="blue"
        />
      </div>

      {/* Main Grid: Recent Activity & Content Type Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Ledger Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest file registrations, audits, and hash checks</p>
            </div>
            <button
              onClick={() => onNavigate('my-content')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-x-auto">
            {safeActivities.length === 0 ? (
              <div className="p-8 text-center">
                <FolderCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No ledger transactions yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Your registered assets and cryptographic integrity checks will appear here on the immutable ledger.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Register First Asset</span>
                </button>
              </div>
            ) : (
              safeActivities.map((act) => {
                const matchedContent = safeList.find(c => c.id === act.contentId);
                return (
                  <div
                    key={act.id}
                    onClick={() => matchedContent && onSelectContent(matchedContent)}
                    className="p-4 sm:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                        {getTypeIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {act.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-slate-400 dark:text-slate-500 font-medium">
                            {shortenHash(act.txHash, 6, 4)}
                          </span>
                          <span>•</span>
                          <span>{act.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getActionBadge(act.action)}
                      <button
                        className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg cursor-pointer"
                        title="Inspect record"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing recent 5 transactions</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">Polygon Network Gas: 32 Gwei</span>
          </div>
        </div>

        {/* Content Type Donut Chart (1 Column) */}
        <div className="lg:col-span-1">
          <ContentTypeDonutChart
            contentList={safeList}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Protocol Architecture & Quick Audit Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* How CreatorProof Works Card (2 Columns) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-violet-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Protocol</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">How It Protects Your IP</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-full bg-violet-800/80 border border-violet-500/60 flex items-center justify-center text-xs font-bold text-violet-200">
                  1
                </div>
                <p className="text-xs font-bold text-white">SHA-256 Digest</p>
                <p className="text-xs text-violet-200/80 leading-relaxed">
                  Generates an immutable 64-character mathematical fingerprint in your browser sandbox without exposing raw files.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-full bg-violet-800/80 border border-violet-500/60 flex items-center justify-center text-xs font-bold text-violet-200">
                  2
                </div>
                <p className="text-xs font-bold text-white">On-Chain Timestamp</p>
                <p className="text-xs text-violet-200/80 leading-relaxed">
                  Anchors the digest with creator identity into Polygon PoS block state for tamper-proof chronological priority.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-full bg-violet-800/80 border border-violet-500/60 flex items-center justify-center text-xs font-bold text-violet-200">
                  3
                </div>
                <p className="text-xs font-bold text-white">Zero-Knowledge Audit</p>
                <p className="text-xs text-violet-200/80 leading-relaxed">
                  Anyone can verify authenticity and check for single-byte alterations by matching live computed hashes against the block record.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-violet-800/80 flex items-center justify-between">
            <span className="text-xs text-violet-300">Ready to register new intellectual property?</span>
            <button
              onClick={() => onNavigate('register')}
              className="px-4 py-2 bg-white hover:bg-violet-50 text-violet-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Upload & Anchor Now
            </button>
          </div>
        </div>

        {/* 7-Day Verification Checks Trend Chart (1 Column) */}
        <div className="lg:col-span-1">
          <VerificationTrendChart
            contentList={safeList}
            activities={safeActivities}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
};

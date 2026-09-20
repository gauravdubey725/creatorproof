import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { RegisteredContent, ActivityItem } from '../types';

interface VerificationTrendChartProps {
  contentList?: RegisteredContent[];
  activities?: ActivityItem[];
  onNavigate?: (page: string) => void;
}

interface DayTrendData {
  key: string;
  day: string;
  shortDate: string;
  fullDate: string;
  checks: number;
  verified: number;
  failed: number;
}

export const VerificationTrendChart: React.FC<VerificationTrendChartProps> = ({
  contentList = [],
  activities = [],
  onNavigate
}) => {
  const [activePoint, setActivePoint] = useState<DayTrendData | null>(null);

  const safeActivities = Array.isArray(activities) ? activities : [];

  // Count any new verification checks created in this session (timestamp: 'Just now')
  const sessionNewChecks = safeActivities.filter(
    a => a.timestamp === 'Just now' && 
         (a.action === 'Verified' || a.action === 'Verification Failed' || a.action === 'Failed')
  );
  const sessionVerified = sessionNewChecks.filter(a => a.action === 'Verified').length;
  const sessionFailed = sessionNewChecks.filter(a => a.action === 'Verification Failed' || a.action === 'Failed').length;

  const isZeroState = (!contentList || contentList.length === 0) && (!activities || activities.length === 0);

  // 7-day rolling window data ending Today (2026-09-06)
  const trendData: DayTrendData[] = [
    {
      key: 'day-1',
      day: 'Mon',
      shortDate: 'Aug 31',
      fullDate: 'Monday, August 31, 2026',
      checks: isZeroState ? 0 : 3,
      verified: isZeroState ? 0 : 3,
      failed: 0
    },
    {
      key: 'day-2',
      day: 'Tue',
      shortDate: 'Sep 1',
      fullDate: 'Tuesday, September 1, 2026',
      checks: isZeroState ? 0 : 5,
      verified: isZeroState ? 0 : 5,
      failed: 0
    },
    {
      key: 'day-3',
      day: 'Wed',
      shortDate: 'Sep 2',
      fullDate: 'Wednesday, September 2, 2026',
      checks: isZeroState ? 0 : 4,
      verified: isZeroState ? 0 : 4,
      failed: 0
    },
    {
      key: 'day-4',
      day: 'Thu',
      shortDate: 'Sep 3',
      fullDate: 'Thursday, September 3, 2026',
      checks: isZeroState ? 0 : 6,
      verified: isZeroState ? 0 : 5,
      failed: isZeroState ? 0 : 1
    },
    {
      key: 'day-5',
      day: 'Fri',
      shortDate: 'Sep 4',
      fullDate: 'Friday, September 4, 2026',
      checks: isZeroState ? 0 : 4,
      verified: isZeroState ? 0 : 4,
      failed: 0
    },
    {
      key: 'day-6',
      day: 'Sat',
      shortDate: 'Sep 5',
      fullDate: 'Saturday, September 5, 2026',
      checks: isZeroState ? 0 : 7,
      verified: isZeroState ? 0 : 7,
      failed: 0
    },
    {
      key: 'day-7',
      day: 'Today',
      shortDate: 'Sep 6',
      fullDate: 'Sunday, September 6, 2026 (Today)',
      checks: (isZeroState ? 0 : 5) + sessionNewChecks.length,
      verified: (isZeroState ? 0 : 4) + sessionVerified,
      failed: (isZeroState ? 0 : 1) + sessionFailed
    }
  ];

  const totalChecks7Days = trendData.reduce((sum, d) => sum + d.checks, 0);
  const totalVerified7Days = trendData.reduce((sum, d) => sum + d.verified, 0);
  const totalFailed7Days = trendData.reduce((sum, d) => sum + d.failed, 0);
  const passRate = totalChecks7Days > 0 ? Math.round((totalVerified7Days / totalChecks7Days) * 100) : 100;
  const avgChecksPerDay = (totalChecks7Days / 7).toFixed(1);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayTrendData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1">
            <span className="font-bold text-slate-100">{data.shortDate} ({data.day})</span>
            <span className="text-[10px] text-violet-300 font-mono">7-Day Window</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Total Audits:</span>
            <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
              {data.checks} {data.checks === 1 ? 'check' : 'checks'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400 text-[11px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Valid:
            </span>
            <span className="font-bold">{data.verified}</span>
          </div>
          {data.failed > 0 && (
            <div className="flex items-center justify-between gap-4 text-rose-400 text-[11px]">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Hash Mismatches:
              </span>
              <span className="font-bold">{data.failed}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="verification-trend-chart-card"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Verification Velocity</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Verification Checks (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live cryptographic audit volume & proof queries
            </p>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('verify')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer transition"
              title="Perform a new file verification"
            >
              <span>Audit Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Metric Banner */}
        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalChecks7Days}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              checks performed
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18% vs last wk</span>
          </div>
        </div>
      </div>

      {/* Small Recharts Trend Area Chart */}
      <div className="w-full h-[155px] pt-2 pb-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                setActivePoint(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="verificationAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.38} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              fontSize={11}
              fontWeight={500}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              dy={5}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, 'dataMax + 2']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="checks"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#verificationAreaGradient)"
              activeDot={{
                r: 5.5,
                fill: '#8b5cf6',
                stroke: '#ffffff',
                strokeWidth: 2,
                className: 'drop-shadow-sm'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 3-Column Summary Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 text-center">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Daily Avg
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {avgChecksPerDay} / day
          </p>
        </div>

        <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 text-center">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Integrity
          </p>
          <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {passRate}%
          </p>
        </div>

        <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 text-center">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Peak Day
          </p>
          <p className="text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400 mt-0.5">
            Sat (7)
          </p>
        </div>
      </div>

      {/* Action Footer */}
      {onNavigate && (
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('verify')}
            className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Audit Another File Against Ledger</span>
          </button>
        </div>
      )}
    </div>
  );
};

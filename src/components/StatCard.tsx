import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme: 'purple' | 'emerald' | 'amber' | 'blue';
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  colorScheme
}) => {
  const schemeStyles = {
    purple: {
      bg: 'bg-violet-50 dark:bg-violet-950/50',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-800/40',
      badge: 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800/40',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-800/40',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-800/40',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
    }
  }[colorScheme];

  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${schemeStyles.bg} ${schemeStyles.text} border ${schemeStyles.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            {value}
          </span>
          {trend && (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                trendPositive
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

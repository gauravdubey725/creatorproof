import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText, 
  PieChart as PieChartIcon,
  ArrowRight
} from 'lucide-react';
import { RegisteredContent, ContentType } from '../types';

interface ContentTypeDonutChartProps {
  contentList: RegisteredContent[];
  onNavigate?: (page: string) => void;
}

interface FormatMeta {
  type: ContentType;
  label: string;
  count: number;
  percentage: number;
  color: string;
  darkColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ContentTypeDonutChart: React.FC<ContentTypeDonutChartProps> = ({
  contentList = [],
  onNavigate
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const safeList = Array.isArray(contentList) ? contentList : [];
  const total = safeList.length;

  // Counts for each of the 4 defined content types
  const imageCount = safeList.filter(c => c.type === 'Image').length;
  const audioCount = safeList.filter(c => c.type === 'Audio').length;
  const videoCount = safeList.filter(c => c.type === 'Video').length;
  const documentCount = safeList.filter(c => c.type === 'Document').length;

  const formats: FormatMeta[] = [
    {
      type: 'Image',
      label: 'Images & Art',
      count: imageCount,
      percentage: total > 0 ? Math.round((imageCount / total) * 100) : 0,
      color: '#ec4899', // pink-500
      darkColor: '#f472b6',
      bgClass: 'bg-pink-50 dark:bg-pink-950/40',
      borderClass: 'border-pink-200 dark:border-pink-800/40',
      textClass: 'text-pink-600 dark:text-pink-400',
      icon: ImageIcon
    },
    {
      type: 'Audio',
      label: 'Audio & Music',
      count: audioCount,
      percentage: total > 0 ? Math.round((audioCount / total) * 100) : 0,
      color: '#8b5cf6', // purple-500 / violet-500
      darkColor: '#a78bfa',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40',
      borderClass: 'border-purple-200 dark:border-purple-800/40',
      textClass: 'text-purple-600 dark:text-purple-400',
      icon: Music
    },
    {
      type: 'Video',
      label: 'Video & Film',
      count: videoCount,
      percentage: total > 0 ? Math.round((videoCount / total) * 100) : 0,
      color: '#3b82f6', // blue-500
      darkColor: '#60a5fa',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      borderClass: 'border-blue-200 dark:border-blue-800/40',
      textClass: 'text-blue-600 dark:text-blue-400',
      icon: Video
    },
    {
      type: 'Document',
      label: 'Documents & Reports',
      count: documentCount,
      percentage: total > 0 ? Math.round((documentCount / total) * 100) : 0,
      color: '#f59e0b', // amber-500
      darkColor: '#fbbf24',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-200 dark:border-amber-800/40',
      textClass: 'text-amber-600 dark:text-amber-400',
      icon: FileText
    }
  ];

  // Data for Recharts Pie
  // If there are non-zero items, supply only items with value > 0 to Pie for clean rendering
  // If total is 0, supply a placeholder slice
  const activeSlices = formats.filter(f => f.count > 0);
  const chartData = activeSlices.length > 0
    ? activeSlices.map((f) => ({
        name: f.type,
        label: f.label,
        value: f.count,
        percentage: f.percentage,
        color: f.color,
        icon: f.icon
      }))
    : [{ name: 'None', label: 'No Assets', value: 1, percentage: 0, color: '#94a3b8', icon: FileText }];

  const currentHoveredItem = activeIndex !== null && activeIndex >= 0 && activeIndex < chartData.length && activeSlices.length > 0
    ? chartData[activeIndex]
    : null;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.name === 'None') return null;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-xs text-xs space-y-1 z-50">
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: data.color }} 
            />
            <span className="font-bold text-slate-100">{data.label}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 text-slate-300 font-medium">
            <span>{data.value} {data.value === 1 ? 'asset' : 'assets'}</span>
            <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
              {data.percentage}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="content-types-donut-chart-card"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Format Analytics</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Content Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown across registered file formats
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('my-content')}
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer transition"
            title="Explore all assets"
          >
            <span>Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Donut Chart Container */}
      <div className="relative py-2">
        <div className="w-full h-[200px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={activeSlices.length > 1 ? 4 : 0}
                cornerRadius={activeSlices.length > 1 ? 5 : 0}
                dataKey="value"
                nameKey="name"
                animationDuration={800}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => {
                  const isHovered = activeIndex === index;
                  return (
                    <Cell
                      key={`slice-${entry.name}-${index}`}
                      fill={entry.color}
                      stroke={isHovered ? '#ffffff' : 'transparent'}
                      strokeWidth={isHovered ? 2 : 0}
                      className="cursor-pointer transition-all duration-200 outline-none"
                      style={{
                        filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' : 'none',
                        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: 'center center'
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout inside the Donut hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
            {currentHoveredItem ? (
              <>
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {currentHoveredItem.value}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  {currentHoveredItem.name}
                </span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                  {currentHoveredItem.percentage}%
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {total}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  Total
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Assets
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Legend Grid for all 4 Content Types */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {formats.map((item, idx) => {
          const IconComponent = item.icon;
          const isSelected = currentHoveredItem?.name === item.type;
          
          return (
            <div
              key={item.type}
              onMouseEnter={() => {
                const chartIdx = chartData.findIndex(d => d.name === item.type);
                if (chartIdx !== -1) setActiveIndex(chartIdx);
              }}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? `${item.bgClass} ${item.borderClass} ring-2 ring-violet-500/20 scale-[1.02]`
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-md ${item.bgClass} ${item.borderClass} border`}>
                    <IconComponent className={`w-3.5 h-3.5 ${item.textClass}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.type}
                  </span>
                </div>
                <span className={`text-xs font-bold ${item.textClass}`}>
                  {item.percentage}%
                </span>
              </div>

              {/* Progress bar and count */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.count} {item.count === 1 ? 'record' : 'records'}</span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                    {item.count > 0 ? 'Active' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

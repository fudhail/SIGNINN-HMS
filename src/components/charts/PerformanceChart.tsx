import React, { useState } from 'react';
import { TrendingUp, Calendar, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export type TimeRange = '7D' | '30D' | '90D';
export type MetricType = 'revenue' | 'occupancy' | 'revpar';

interface DataPoint {
  date: string;
  label: string;
  revenue: number;
  occupancy: number;
  revpar: number;
  directShare: number;
  otaShare: number;
}

const MOCK_SERIES: Record<TimeRange, DataPoint[]> = {
  '7D': [
    { date: '2026-09-10', label: 'Thu, Sep 10', revenue: 72000, occupancy: 76, revpar: 3450, directShare: 42, otaShare: 58 },
    { date: '2026-09-11', label: 'Fri, Sep 11', revenue: 98500, occupancy: 92, revpar: 4800, directShare: 38, otaShare: 62 },
    { date: '2026-09-12', label: 'Sat, Sep 12', revenue: 114000, occupancy: 96, revpar: 5400, directShare: 45, otaShare: 55 },
    { date: '2026-09-13', label: 'Sun, Sep 13', revenue: 89000, occupancy: 82, revpar: 4200, directShare: 40, otaShare: 60 },
    { date: '2026-09-14', label: 'Mon, Sep 14', revenue: 64000, occupancy: 68, revpar: 3100, directShare: 50, otaShare: 50 },
    { date: '2026-09-15', label: 'Tue, Sep 15', revenue: 78500, occupancy: 78, revpar: 3800, directShare: 48, otaShare: 52 },
    { date: '2026-09-16', label: 'Wed, Sep 16 (Today)', revenue: 84500, occupancy: 84, revpar: 3977, directShare: 44, otaShare: 56 },
  ],
  '30D': [
    { date: 'Week 1', label: 'Aug 18 - Aug 24', revenue: 490000, occupancy: 74, revpar: 3300, directShare: 35, otaShare: 65 },
    { date: 'Week 2', label: 'Aug 25 - Aug 31', revenue: 535000, occupancy: 81, revpar: 3650, directShare: 40, otaShare: 60 },
    { date: 'Week 3', label: 'Sep 01 - Sep 07', revenue: 582000, occupancy: 86, revpar: 4100, directShare: 43, otaShare: 57 },
    { date: 'Week 4', label: 'Sep 08 - Sep 14', revenue: 610000, occupancy: 88, revpar: 4350, directShare: 46, otaShare: 54 },
    { date: 'Current', label: 'Sep 15 - Sep 16', revenue: 163000, occupancy: 84, revpar: 3977, directShare: 45, otaShare: 55 },
  ],
  '90D': [
    { date: 'Month 1', label: 'July 2026', revenue: 2150000, occupancy: 72, revpar: 3200, directShare: 34, otaShare: 66 },
    { date: 'Month 2', label: 'August 2026', revenue: 2480000, occupancy: 80, revpar: 3750, directShare: 39, otaShare: 61 },
    { date: 'Month 3', label: 'September 2026 (MTD)', revenue: 1380000, occupancy: 84, revpar: 4100, directShare: 44, otaShare: 56 },
  ],
};

export const PerformanceChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = MOCK_SERIES[timeRange];
  const activePoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  // Calculate SVG coordinates
  const values = data.map((d) => d[metric]);
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.08;
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 180;
  const paddingX = 30;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d[metric] - minVal) / range) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Performance & Revenue Yield
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              Live Engine
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              {metric === 'revenue'
                ? formatCurrency(activePoint.revenue)
                : metric === 'occupancy'
                ? `${activePoint.occupancy}%`
                : formatCurrency(activePoint.revpar)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {activePoint.label}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> +14.2%
            </span>
          </div>
        </div>

        {/* Metric & Time Range Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Selector */}
          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/70">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric('occupancy')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'occupancy'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Occupancy
            </button>
            <button
              onClick={() => setMetric('revpar')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'revpar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RevPAR
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/70">
            {(['7D', '30D', '90D'] as TimeRange[]).map((tr) => (
              <button
                key={tr}
                onClick={() => {
                  setTimeRange(tr);
                  setHoverIndex(null);
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === tr
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full h-48 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="performanceStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0.2, 0.5, 0.8].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#performanceGradient)" />

          {/* Main Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#performanceStroke)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & Hover Targets */}
          {points.map((pt, i) => {
            const isHovered = hoverIndex === i || (hoverIndex === null && i === points.length - 1);
            return (
              <g key={i}>
                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={height - paddingY}
                    stroke="#818cf8"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                )}
                {/* Visual Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#4338ca' : '#ffffff'}
                  stroke="#4f46e5"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
                {/* Invisible large hover hit area */}
                <rect
                  x={pt.x - 20}
                  y={0}
                  width={40}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Axis Labels & Channel Breakdown Pill */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-6">
          {data.map((d, i) => (
            <span
              key={i}
              className={`text-[11px] ${
                hoverIndex === i ? 'text-indigo-600 font-bold' : 'text-gray-400'
              }`}
            >
              {d.date}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 font-medium">Direct: {activePoint.directShare}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-gray-600 font-medium">OTA Channels: {activePoint.otaShare}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

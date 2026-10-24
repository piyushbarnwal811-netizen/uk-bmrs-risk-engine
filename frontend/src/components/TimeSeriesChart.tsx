import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
} from 'recharts';
import { Wind } from 'lucide-react';
import type { WindRecord } from '../types';

interface TimeSeriesChartProps {
  data: WindRecord[];
  resolution: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, resolution }) => {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showErrorArea, setShowErrorArea] = useState(true);

  // Format chart data for smooth Recharts rendering
  const chartData = useMemo(() => {
    return data.map((d) => {
      const dt = new Date(d.startTime);
      const timeStr = dt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      const dateStr = dt.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });

      return {
        ...d,
        displayLabel: `${dateStr} ${timeStr}`,
        // Split error into positive (over-forecast) and negative (under-forecast)
        overForecastDelta: d.errorMW > 0 ? d.errorMW : 0,
        underForecastDelta: d.errorMW < 0 ? Math.abs(d.errorMW) : 0,
      };
    });
  }, [data]);

  // Custom high-information trader tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rec: WindRecord = payload[0].payload;
      const isShort = rec.errorMW > 0;
      
      return (
        <div className="bg-trading-card/95 border border-trading-borderLight p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans min-w-[260px]">
          <div className="flex items-center justify-between border-b border-trading-border pb-2 mb-2.5">
            <div>
              <div className="font-bold text-white text-sm font-mono">{label}</div>
              <div className="text-[11px] text-trading-muted font-mono">
                {resolution === 'half-hourly' ? `Settlement Period ${rec.settlementPeriod} of 48` : `Hour ${rec.settlementPeriod} of 24`}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                isShort 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isShort ? 'Shortage (Over-FC)' : 'Surplus (Under-FC)'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Actual Generation:
              </span>
              <span className="font-bold text-white text-sm">
                {rec.actualGenerationMW.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-indigo-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Day-Ahead Forecast:
              </span>
              <span className="font-bold text-white text-sm">
                {rec.forecastGenerationMW.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-trading-border/60">
              <span className="text-trading-muted">Forecast Error (F - A):</span>
              <span className={`font-bold ${isShort ? 'text-rose-400' : 'text-amber-400'}`}>
                {rec.errorMW > 0 ? `+${rec.errorMW.toLocaleString()}` : rec.errorMW.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-trading-muted">Error Percentage:</span>
              <span className="font-semibold text-slate-200">
                {rec.errorPercentage ? `${rec.errorPercentage.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-trading-border/60 text-[10px] text-slate-400 font-sans flex flex-col gap-0.5">
              <div>
                <span className="text-trading-muted">Forecast Published: </span>
                <span className="font-mono text-slate-300">
                  {new Date(rec.publishTime).toUTCString().slice(5, 22)} UTC
                </span>
              </div>
              <div>
                <span className="text-trading-muted">Lead Time to Delivery: </span>
                <span className="font-mono text-sky-300">{rec.leadTimeHours} hours</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-lg flex flex-col">
      {/* Chart Title & Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            UK Actual vs. Day-Ahead Wind Forecast (January 2026)
          </h2>
          <span className="text-xs font-mono text-trading-muted bg-trading-bg px-2 py-0.5 rounded border border-trading-border">
            {chartData.length} Intervals
          </span>
        </div>

        {/* Legend Series Visibility Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showActual
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-trading-bg border-trading-border text-trading-muted line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-medium">Actual MW</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showForecast
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                : 'bg-trading-bg border-trading-border text-trading-muted line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="font-medium">Forecast MW</span>
          </button>

          <button
            onClick={() => setShowErrorArea(!showErrorArea)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showErrorArea
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : 'bg-trading-bg border-trading-border text-trading-muted line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400/80" />
            <span className="font-medium">Error Delta</span>
          </button>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="h-[420px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <defs>
              {/* Actual generation gradient */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>

              {/* Forecast generation gradient */}
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>

              {/* Error delta area gradient */}
              <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />

            <XAxis
              dataKey="displayLabel"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={{ stroke: '#1F293D' }}
              minTickGap={45}
            />

            <YAxis
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={{ stroke: '#1F293D' }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              unit=" MW"
              domain={[0, 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Error delta fill between curves */}
            {showErrorArea && (
              <Area
                type="monotone"
                dataKey="absErrorMW"
                fill="url(#errorGradient)"
                stroke="#F43F5E"
                strokeWidth={1}
                strokeDasharray="2 2"
                name="Abs Error MW"
                isAnimationActive={false}
              />
            )}

            {/* Actual Wind Generation Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actualGenerationMW"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 1.5 }}
                name="Actual Wind MW"
                isAnimationActive={false}
              />
            )}

            {/* Forecasted Wind Generation Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecastGenerationMW"
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 1.5 }}
                name="Forecast Wind MW"
                isAnimationActive={false}
              />
            )}

            {/* Interactive Brush Slider for effortless zooming */}
            <Brush
              dataKey="displayLabel"
              height={32}
              stroke="#38BDF8"
              fill="#0B0F17"
              travellerWidth={10}
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-trading-muted pt-3 border-t border-trading-border mt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400" /> Metered Outturn (Elexon FUELHH)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-400 border-dashed" /> Locked Day-Ahead Forecast (Elexon WINDFOR)
          </span>
        </div>
        <span className="italic hidden md:block">
          Use the brush slider at the bottom to zoom into high-ramp storm days or settlement period windows
        </span>
      </div>
    </div>
  );
};

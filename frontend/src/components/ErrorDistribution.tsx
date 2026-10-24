import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { ErrorDistributionResponse } from '../types';

interface ErrorDistributionProps {
  distribution: ErrorDistributionResponse | null;
}

export const ErrorDistribution: React.FC<ErrorDistributionProps> = ({ distribution }) => {
  if (!distribution || !distribution.bins.length) {
    return (
      <div className="bg-trading-card border border-trading-border rounded-xl p-5 text-center text-trading-muted text-xs">
        Loading error distribution...
      </div>
    );
  }

  const { bins, p10, p50, p90, mean, stdDev, skewness } = distribution;

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-lg flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Forecast Error Distribution (MW Histogram)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-trading-muted">
          <span>
            Mean: <strong className="text-white">{mean > 0 ? `+${mean}` : mean} MW</strong>
          </span>
          <span>•</span>
          <span>
            Std Dev: <strong className="text-white">&plusmn;{stdDev} MW</strong>
          </span>
          <span>•</span>
          <span>
            Skew: <strong className="text-sky-300">{skewness}</strong>
          </span>
        </div>
      </div>

      {/* Histogram Bar Chart */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
            <XAxis
              dataKey="binCenter"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              unit=" MW"
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              unit=" intervals"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const b = payload[0].payload;
                  const isOver = b.binCenter > 0;
                  return (
                    <div className="bg-trading-card border border-trading-borderLight p-3 rounded-lg shadow-xl text-xs font-mono">
                      <div className="text-white font-bold mb-1">
                        Range: {b.binStart.toLocaleString()} to {b.binEnd.toLocaleString()} MW
                      </div>
                      <div className="text-sky-300">
                        Occurrences: <strong>{b.count}</strong> intervals ({b.frequencyPct}%)
                      </div>
                      <div className={`mt-1 text-[11px] ${isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                        {isOver ? 'Over-Forecast (Shortage Risk)' : 'Under-Forecast (Surplus Spill)'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={1.5} label={{ value: 'Zero Error', fill: '#94A3B8', fontSize: 10 }} />
            <ReferenceLine x={p50} stroke="#38BDF8" strokeDasharray="3 3" label={{ value: `Median (${p50} MW)`, fill: '#38BDF8', fontSize: 10 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {bins.map((entry, index) => {
                const color = entry.binCenter > 0 ? '#F43F5E' : '#F59E0B';
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quantile Summary Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-3 border-t border-trading-border mt-auto">
        <div className="bg-trading-bg p-2 rounded-lg text-center border border-trading-border">
          <div className="text-[10px] text-trading-muted font-medium">p10 (Worst Under)</div>
          <div className="font-mono text-xs font-bold text-amber-400">{p10.toLocaleString()} MW</div>
        </div>
        <div className="bg-trading-bg p-2 rounded-lg text-center border border-trading-border">
          <div className="text-[10px] text-trading-muted font-medium">p25 (1st Quartile)</div>
          <div className="font-mono text-xs font-bold text-slate-300">{distribution.p25.toLocaleString()} MW</div>
        </div>
        <div className="bg-trading-bg p-2 rounded-lg text-center border border-trading-border">
          <div className="text-[10px] text-sky-400 font-medium">p50 (Median)</div>
          <div className="font-mono text-xs font-bold text-white">{p50.toLocaleString()} MW</div>
        </div>
        <div className="bg-trading-bg p-2 rounded-lg text-center border border-trading-border">
          <div className="text-[10px] text-trading-muted font-medium">p75 (3rd Quartile)</div>
          <div className="font-mono text-xs font-bold text-slate-300">{distribution.p75.toLocaleString()} MW</div>
        </div>
        <div className="bg-trading-bg p-2 rounded-lg text-center border border-trading-border">
          <div className="text-[10px] text-trading-muted font-medium">p90 (Worst Over)</div>
          <div className="font-mono text-xs font-bold text-rose-400">{p90.toLocaleString()} MW</div>
        </div>
      </div>
    </div>
  );
};

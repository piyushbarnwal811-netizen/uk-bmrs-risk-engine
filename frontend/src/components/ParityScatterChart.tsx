import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Target } from 'lucide-react';
import type { WindRecord } from '../types';

interface ParityScatterChartProps {
  data: WindRecord[];
}

export const ParityScatterChart: React.FC<ParityScatterChartProps> = ({ data }) => {
  // Sample every nth item if data is large for high-performance fluid rendering
  const scatterData = React.useMemo(() => {
    const step = data.length > 500 ? 2 : 1;
    return data
      .filter((_, idx) => idx % step === 0)
      .map((d) => ({
        x: d.actualGenerationMW,
        y: d.forecastGenerationMW,
        error: d.errorMW,
        time: d.startTime,
        period: d.settlementPeriod,
      }));
  }, [data]);

  const maxVal = React.useMemo(() => {
    let maxG = 0;
    for (const d of scatterData) {
      if (d.x > maxG) maxG = d.x;
      if (d.y > maxG) maxG = d.y;
    }
    return Math.ceil((maxG + 1000) / 5000) * 5000;
  }, [scatterData]);

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-lg flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Actual vs. Forecast Parity (45&deg; Parity Line)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-trading-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Above line: Over-Forecast (Short)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Below line: Under-Forecast (Long)
          </span>
        </div>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: -5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
            <XAxis
              type="number"
              dataKey="x"
              name="Actual MW"
              domain={[0, maxVal]}
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
              label={{ value: 'Actual Outturn (MW)', position: 'insideBottom', offset: -12, fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Forecast MW"
              domain={[0, maxVal]}
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
              label={{ value: 'Day-Ahead Forecast (MW)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-trading-card border border-trading-borderLight p-3 rounded-lg shadow-xl text-xs font-mono">
                      <div className="text-white font-bold mb-1">
                        Settlement Period {pt.period} ({new Date(pt.time).toUTCString().slice(5, 22)})
                      </div>
                      <div className="text-emerald-400">Actual Outturn: {pt.x.toLocaleString()} MW</div>
                      <div className="text-indigo-400">Forecast Gen: {pt.y.toLocaleString()} MW</div>
                      <div className={`mt-1 font-bold ${pt.error > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        Delta: {pt.error > 0 ? `+${pt.error.toLocaleString()}` : pt.error.toLocaleString()} MW
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* 45 degree line: Y = X */}
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: maxVal, y: maxVal }]}
              stroke="#38BDF8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Scatter data={scatterData} fill="#8884d8">
              {scatterData.map((entry, index) => (
                <Cell
                  key={`scatter-cell-${index}`}
                  fill={entry.error > 0 ? '#F43F5E' : '#F59E0B'}
                  fillOpacity={0.65}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-trading-muted pt-2 border-t border-trading-border mt-auto flex items-center justify-between">
        <span>Diagonal dashed line indicates zero forecast error (1:1 perfect forecast parity).</span>
        <span className="font-mono text-slate-400 text-[10px]">{scatterData.length} Data Points</span>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Clock } from 'lucide-react';
import type { SettlementProfileResponse } from '../types';

interface SettlementPeriodProfileProps {
  profile: SettlementProfileResponse | null;
}

export const SettlementPeriodProfile: React.FC<SettlementPeriodProfileProps> = ({ profile }) => {
  if (!profile || !profile.settlementPeriods.length) {
    return (
      <div className="bg-trading-card border border-trading-border rounded-xl p-5 text-center text-trading-muted text-xs">
        Loading settlement period profile...
      </div>
    );
  }

  const { settlementPeriods, peakHoursMAE, offPeakHoursMAE } = profile;

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-lg flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Diurnal Profile: UK Settlement Periods (SP 1 to 48)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Evening Peak MAE (SP 33-38): <strong>{peakHoursMAE} MW</strong>
          </span>
          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Off-Peak MAE: <strong>{offPeakHoursMAE} MW</strong>
          </span>
        </div>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={settlementPeriods} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
            <XAxis
              dataKey="settlementPeriod"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              label={{ value: 'Settlement Period (1 - 48)', position: 'insideBottom', offset: -12, fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const sp = payload[0].payload;
                  const isPeak = sp.settlementPeriod >= 33 && sp.settlementPeriod <= 38;
                  return (
                    <div className="bg-trading-card border border-trading-borderLight p-3 rounded-lg shadow-xl text-xs font-mono">
                      <div className="text-white font-bold mb-1 flex items-center justify-between">
                        <span>SP {sp.settlementPeriod} ({sp.timeLabel} UTC)</span>
                        {isPeak && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">Peak Hours</span>}
                      </div>
                      <div className="text-emerald-400">Mean Actual: {sp.meanActualMW.toLocaleString()} MW</div>
                      <div className="text-indigo-400">Mean Forecast: {sp.meanForecastMW.toLocaleString()} MW</div>
                      <div className="text-rose-400">MAE: {sp.maeMW.toLocaleString()} MW</div>
                      <div className="text-sky-300">Mean Bias: {sp.meanErrorMW > 0 ? `+${sp.meanErrorMW}` : sp.meanErrorMW} MW</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              iconType="circle"
            />
            <Bar
              dataKey="maeMW"
              name="Period MAE (MW)"
              fill="#F43F5E"
              fillOpacity={0.4}
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="meanActualMW"
              name="Mean Actual (MW)"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="meanForecastMW"
              name="Mean Forecast (MW)"
              stroke="#6366F1"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-trading-muted pt-2 border-t border-trading-border mt-auto flex items-center justify-between">
        <span>Evaluates whether wind forecast inaccuracy worsens during evening winter peak ramp (SP 33-38).</span>
        <span className="font-mono text-amber-400 text-[10px]">Peak vs Off-Peak Ratio: {(peakHoursMAE / (offPeakHoursMAE || 1)).toFixed(2)}x</span>
      </div>
    </div>
  );
};

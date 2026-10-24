import { Sliders, Clock } from 'lucide-react';

interface CutoffSelectorProps {
  cutoffHour: number;
  onCutoffChange: (hour: number) => void;
  cutoffMode: string;
  onModeChange: (mode: string) => void;
}

export const GATES = [
  {
    hour: 11,
    mode: 'day_ahead',
    name: '11:00 UTC (D-1)',
    badge: 'EPEX Auction Gate',
    desc: 'UK EPEX SPOT Day-Ahead wholesale auction order book closure.',
  },
  {
    hour: 12,
    mode: 'day_ahead',
    name: '12:00 UTC (D-1)',
    badge: 'Utility Primary Benchmark',
    desc: 'Standard UK utility day-ahead thermal hedge procurement cut-off.',
  },
  {
    hour: 14,
    mode: 'day_ahead',
    name: '14:00 UTC (D-1)',
    badge: 'Post-Auction Review',
    desc: 'Afternoon post-auction balancing review window.',
  },
  {
    hour: 17,
    mode: 'day_ahead',
    name: '17:00 UTC (D-1)',
    badge: 'Evening Gate',
    desc: 'Final evening Day-Ahead schedule submission to National Grid.',
  },
  {
    hour: 4,
    mode: 'rolling_intraday',
    name: 'Rolling 4h Intraday',
    badge: 'Intraday Horizon',
    desc: 'Rolling 4 hours prior to each settlement period delivery.',
  },
];

export const CutoffSelector: React.FC<CutoffSelectorProps> = ({
  cutoffHour,
  onCutoffChange,
  cutoffMode,
  onModeChange,
}) => {
  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Trader Decision Horizon & Forecast Cut-off Selector
          </h2>
        </div>
        <div className="text-[11px] text-trading-muted flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Cut-off:</span>
          <span className="text-white font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {cutoffMode === 'rolling_intraday' ? 'T - 4h Rolling' : `${cutoffHour.toString().padStart(2, '0')}:00 UTC (D-1)`}
          </span>
        </div>
      </div>

      {/* Preset Trading Gate Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3.5">
        {GATES.map((g) => {
          const isSelected = cutoffMode === g.mode && (g.mode === 'rolling_intraday' || cutoffHour === g.hour);
          return (
            <button
              key={g.name}
              onClick={() => {
                onModeChange(g.mode);
                if (g.mode === 'day_ahead') {
                  onCutoffChange(g.hour);
                }
              }}
              className={`p-2.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/30'
                  : 'bg-trading-bg hover:bg-trading-cardHover border-trading-border text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono">{g.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {g.badge}
                </span>
              </div>
              <p className="text-[11px] text-trading-muted leading-tight line-clamp-2">{g.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Cut-off Slider */}
      {cutoffMode === 'day_ahead' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-trading-bg/60 p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-trading-muted font-medium">Custom D-1 Decision Hour:</span>
            <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              {cutoffHour.toString().padStart(2, '0')}:00 UTC
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-[10px] text-slate-500 font-mono">00:00</span>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={cutoffHour}
              onChange={(e) => onCutoffChange(parseInt(e.target.value, 10))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-mono">23:00</span>
          </div>
          <div className="text-[11px] text-trading-muted hidden md:block">
            Only forecasts published <span className="text-sky-300 font-semibold">&le; {cutoffHour}:00 UTC D-1</span> are evaluated.
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Calendar, Clock, Zap } from 'lucide-react';

interface TimeframeSelectorProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  resolution: string;
  onResolutionChange: (res: string) => void;
}

export const PRESETS = [
  { label: 'Full Month', start: '2026-01-01', end: '2026-01-31', badge: '31 Days' },
  { label: 'Week 1', start: '2026-01-01', end: '2026-01-07', badge: 'W1' },
  { label: 'Week 2', start: '2026-01-08', end: '2026-01-14', badge: 'W2' },
  { label: 'Week 3', start: '2026-01-15', end: '2026-01-21', badge: 'W3' },
  { label: 'Week 4', start: '2026-01-22', end: '2026-01-28', badge: 'W4' },
  { label: 'Storm Isha Ramp', start: '2026-01-21', end: '2026-01-24', badge: 'High Wind' },
  { label: 'Anticyclone Lull', start: '2026-01-08', end: '2026-01-11', badge: 'Low Wind' },
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  startDate,
  endDate,
  onDateChange,
  resolution,
  onResolutionChange,
}) => {
  const isPresetActive = (start: string, end: string) => startDate === start && endDate === end;

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md">
      {/* Quick Select Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          Timeframe:
        </span>
        {PRESETS.map((p) => {
          const active = isPresetActive(p.start, p.end);
          return (
            <button
              key={p.label}
              onClick={() => onDateChange(p.start, p.end)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'bg-trading-bg hover:bg-trading-cardHover text-slate-300 border border-trading-border'
              }`}
            >
              <span>{p.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  active ? 'bg-sky-700/60 text-sky-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {p.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers & Resolution */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-trading-border">
        {/* Custom Start & End */}
        <div className="flex items-center gap-1 bg-trading-bg px-2.5 py-1 rounded-lg border border-trading-border text-xs">
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="bg-transparent text-slate-200 font-mono focus:outline-none cursor-pointer"
          />
          <span className="text-trading-muted">to</span>
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="bg-transparent text-slate-200 font-mono focus:outline-none cursor-pointer"
          />
        </div>

        {/* Resolution Toggle */}
        <div className="flex items-center bg-trading-bg p-1 rounded-lg border border-trading-border text-xs">
          <button
            onClick={() => onResolutionChange('half-hourly')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
              resolution === 'half-hourly'
                ? 'bg-trading-card text-sky-400 font-semibold shadow-sm'
                : 'text-trading-muted hover:text-slate-300'
            }`}
            title="48 half-hour settlement periods per day (Elexon standard)"
          >
            <Clock className="w-3 h-3" />
            <span>30m SP</span>
          </button>
          <button
            onClick={() => onResolutionChange('hourly')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
              resolution === 'hourly'
                ? 'bg-trading-card text-sky-400 font-semibold shadow-sm'
                : 'text-trading-muted hover:text-slate-300'
            }`}
            title="24 clock hours per day (hourly average)"
          >
            <Zap className="w-3 h-3" />
            <span>1h Clock</span>
          </button>
        </div>
      </div>
    </div>
  );
};

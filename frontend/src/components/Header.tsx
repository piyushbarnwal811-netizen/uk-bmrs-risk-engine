import React, { useState } from 'react';
import { 
  Wind, 
  Activity, 
  Download, 
  RefreshCw, 
  Flame,
  Info
} from 'lucide-react';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  onRefresh: () => Promise<void>;
  onExportCsv: () => void;
  dataSource: string;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onRefresh,
  onExportCsv,
  dataSource
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="border-b border-trading-border bg-trading-bg/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Market Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold ring-1 ring-white/20">
            <Wind className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                UK Energy Desk <span className="text-sky-400 font-mono text-xs px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">DA-HEDGE v1.0</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {health?.elexonApiReachable ? 'Live BMRS Stream' : 'BMRS Stream Synced'}
              </span>
            </div>
            <p className="text-xs text-trading-muted font-medium flex items-center gap-2 mt-0.5">
              <span>Day-Ahead Wind Forecast Error &amp; Thermal Procurement Analytics</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-sky-400/90 font-mono">January 2026</span>
            </p>
          </div>
        </div>

        {/* Real-time Status Badges & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Elexon Stream Source Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-trading-card border border-trading-border text-xs">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-trading-muted">Stream:</span>
            <span className="font-mono text-slate-200 font-medium truncate max-w-[170px]" title={dataSource}>
              {dataSource.includes('Official') ? 'Elexon FUELHH/WINDFOR' : dataSource}
            </span>
            <span className="text-emerald-400 font-mono font-semibold">100%</span>
          </div>

          {/* Info Button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-lg bg-trading-card hover:bg-trading-cardHover border border-trading-border text-trading-muted hover:text-white transition-colors"
            title="Trading Desk &amp; Market Background"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Refresh BMRS Stream */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-trading-card hover:bg-trading-cardHover border border-trading-border text-xs font-medium text-slate-200 hover:text-white transition-all disabled:opacity-50"
            title="Re-query Elexon BMRS API and update local cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync BMRS'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all active:scale-95"
            title="Download full matched settlement period dataset for Excel/Risk systems"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Info / Domain Context Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-trading-card border border-trading-borderLight rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-trading-border">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">UK Wholesale Market Trading Context</h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-trading-muted hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>
            
            <div className="mt-4 space-y-3.5 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              <div className="p-3 bg-sky-950/30 rounded-xl border border-sky-800/40">
                <h4 className="font-semibold text-sky-300 mb-1">The Procurement Challenge</h4>
                <p>
                  To meet retail electricity demand, a UK utility procurement desk must decide on Day-Ahead (D-1) how much thermal power (gas CCGT, biomass, or market contracts) to purchase on the wholesale market beyond forecasted wind generation:
                </p>
                <div className="font-mono text-sky-200 mt-1.5 p-2 bg-black/40 rounded border border-sky-900/50">
                  Thermal Requirement = Expected Consumer Demand - Wind Generation Forecast
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/30">
                  <h4 className="font-semibold text-rose-300 mb-1">Over-Forecasting (Wind Shortage)</h4>
                  <p>
                    Forecast &gt; Actual Wind: The desk bought insufficient thermal power. The utility is <strong>SHORT</strong> and must buy unexpected shortfall at the volatile <strong>System Buy Price (SBP)</strong> cash-out penalty.
                  </p>
                </div>
                <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/30">
                  <h4 className="font-semibold text-amber-300 mb-1">Under-Forecasting (Wind Surplus)</h4>
                  <p>
                    Forecast &lt; Actual Wind: The desk over-bought expensive thermal power. The excess wind must be spilled or sold back into the balancing mechanism at the discounted <strong>System Sell Price (SSP)</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-trading-border">
                <h4 className="font-semibold text-slate-200 mb-1">Official Elexon BMRS Datasets</h4>
                <ul className="list-disc list-inside space-y-1 text-trading-muted">
                  <li><strong className="text-emerald-400">FUELHH:</strong> Metered actual generation by fuel type. Filtered for <code className="text-slate-200 font-mono">fuelType == 'WIND'</code> across 48 half-hour settlement periods per day.</li>
                  <li><strong className="text-indigo-400">WINDFOR:</strong> Hourly national wind generation forecasts published by NESO/Elexon across rolling forecast horizons.</li>
                  <li><strong className="text-amber-400">Gate Closure:</strong> Forecasts are matched strictly using the latest run published <em>before</em> the Day-Ahead decision cut-off (e.g. 11:00 or 12:00 UTC on D-1).</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-trading-border flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Percent, 
  Scale, 
  Zap, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import type { MetricsSummary } from '../types';

interface KpiCardsProps {
  metrics: MetricsSummary;
  totalActualGWh?: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  const isOverForecasting = metrics.bias > 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
      {/* 1. Mean Absolute Error (MAE) */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Mean Absolute Error
          </span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <BarChart2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.mae.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-trading-muted font-medium">MW</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">NMAE of Mean Gen:</span>
          <span className="font-mono text-sky-400 font-semibold">{metrics.nmae}%</span>
        </div>
      </div>

      {/* 2. Root Mean Square Error (RMSE) */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Root Mean Sq Error
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.rmse.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-trading-muted font-medium">MW</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">RMSE / MAE Ratio:</span>
          <span className="font-mono text-indigo-300 font-semibold">
            {metrics.mae > 0 ? (metrics.rmse / metrics.mae).toFixed(2) : '1.00'}
          </span>
        </div>
      </div>

      {/* 3. Mean Absolute Percentage Error (MAPE) */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Mean Abs Pct Error
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.mape.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-trading-muted font-medium">%</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">Accuracy Index:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {(100 - Math.min(100, metrics.mape)).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 4. Forecast Bias / Mean Error */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 ${isOverForecasting ? 'bg-rose-500/5' : 'bg-amber-500/5'} rounded-full blur-2xl pointer-events-none`} />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Forecast Bias
          </span>
          <div className={`p-1.5 rounded-lg ${isOverForecasting ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${isOverForecasting ? 'text-rose-400' : 'text-amber-400'}`}>
            {metrics.bias > 0 ? `+${metrics.bias.toLocaleString()}` : metrics.bias.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-trading-muted font-medium">MW</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">Desk Position:</span>
          <span className={`font-mono font-semibold flex items-center gap-0.5 ${isOverForecasting ? 'text-rose-400' : 'text-amber-400'}`}>
            {isOverForecasting ? (
              <>
                <ArrowUpRight className="w-3 h-3" />
                <span>Over-Forecast (SHORT)</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3 h-3" />
                <span>Under-Forecast (LONG)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 5. Total Imbalance Volume */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Total Imbalance Vol
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.totalImbalanceGWh.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-trading-muted font-medium">GWh</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">Actual Generation:</span>
          <span className="font-mono text-slate-300 font-semibold">
            {metrics.totalActualGWh.toLocaleString()} GWh
          </span>
        </div>
      </div>

      {/* 6. Model Correlation & R² */}
      <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-md hover:border-trading-borderLight transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider">
            Pearson r & R² Fit
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.correlation.toFixed(3)}
          </span>
          <span className="text-xs font-mono text-blue-400 font-medium">
            (R² {metrics.r2.toFixed(3)})
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-trading-muted">Periods Evaluated:</span>
          <span className="font-mono text-slate-300 font-semibold">
            {metrics.matchedPeriods} / {metrics.totalPeriods}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Flame, Calculator, ShieldAlert, HelpCircle } from 'lucide-react';
import type { HedgeSimulationResponse, HedgeSimulationRequest } from '../types';
import { api } from '../services/api';

interface ThermalHedgeSimulatorProps {
  startDate: string;
  endDate: string;
  cutoffHour: number;
}

export const ThermalHedgeSimulator: React.FC<ThermalHedgeSimulatorProps> = ({
  startDate,
  endDate,
  cutoffHour,
}) => {
  const [demandMW, setDemandMW] = useState<number>(22000);
  const [daPrice, setDaPrice] = useState<number>(85);
  const [sbpPrice, setSbpPrice] = useState<number>(120);
  const [sspPrice, setSspPrice] = useState<number>(50);

  const [simulation, setSimulation] = useState<HedgeSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload: HedgeSimulationRequest = {
        startDate,
        endDate,
        cutoffHour,
        utilityBaseloadMW: demandMW,
        dayAheadThermalPriceGBP: daPrice,
        systemBuyPriceGBP: sbpPrice,
        systemSellPriceGBP: sspPrice,
      };
      const res = await api.simulateHedge(payload);
      setSimulation(res);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [startDate, endDate, cutoffHour, demandMW, daPrice, sbpPrice, sspPrice]);

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-trading-border mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Day-Ahead Thermal Hedge & Cash-Out Imbalance Simulator
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-mono border border-orange-500/30">
                P&L Exposure
              </span>
            </h2>
            <p className="text-xs text-trading-muted mt-0.5">
              Simulates thermal power procurement (Demand &minus; Wind Forecast) vs. actual balancing cash-out penalties
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20 transition-all disabled:opacity-50"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{loading ? 'Simulating...' : 'Recalculate'}</span>
        </button>
      </div>

      {/* Simulator Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 bg-trading-bg/70 p-3.5 rounded-xl border border-trading-border">
        {/* Baseload Demand */}
        <div>
          <div className="flex items-center justify-between text-xs text-trading-muted mb-1.5 font-medium">
            <span>Utility Demand Target:</span>
            <span className="font-mono text-white font-bold">{demandMW.toLocaleString()} MW</span>
          </div>
          <input
            type="range"
            min="10000"
            max="35000"
            step="1000"
            value={demandMW}
            onChange={(e) => setDemandMW(parseInt(e.target.value, 10))}
            className="w-full accent-orange-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>10 GW (Light)</span>
            <span>22 GW (Norm)</span>
            <span>35 GW (Peak)</span>
          </div>
        </div>

        {/* Day-Ahead Thermal Price */}
        <div>
          <div className="flex items-center justify-between text-xs text-trading-muted mb-1.5 font-medium">
            <span>Day-Ahead Power Price:</span>
            <span className="font-mono text-white font-bold">&pound;{daPrice}/MWh</span>
          </div>
          <input
            type="range"
            min="40"
            max="180"
            step="5"
            value={daPrice}
            onChange={(e) => setDaPrice(parseInt(e.target.value, 10))}
            className="w-full accent-orange-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>&pound;40</span>
            <span>&pound;85 Base</span>
            <span>&pound;180</span>
          </div>
        </div>

        {/* System Buy Price (Cash-out penalty when short) */}
        <div>
          <div className="flex items-center justify-between text-xs text-trading-muted mb-1.5 font-medium">
            <span className="text-rose-400">Cash-out Buy (SBP):</span>
            <span className="font-mono text-rose-300 font-bold">&pound;{sbpPrice}/MWh</span>
          </div>
          <input
            type="range"
            min="80"
            max="300"
            step="10"
            value={sbpPrice}
            onChange={(e) => setSbpPrice(parseInt(e.target.value, 10))}
            className="w-full accent-rose-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>&pound;80</span>
            <span>&pound;120 Short</span>
            <span>&pound;300 Peak</span>
          </div>
        </div>

        {/* System Sell Price (Cash-out credit when long) */}
        <div>
          <div className="flex items-center justify-between text-xs text-trading-muted mb-1.5 font-medium">
            <span className="text-amber-400">Cash-out Sell (SSP):</span>
            <span className="font-mono text-amber-300 font-bold">&pound;{sspPrice}/MWh</span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={sspPrice}
            onChange={(e) => setSspPrice(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>&pound;10</span>
            <span>&pound;50 Spill</span>
            <span>&pound;80</span>
          </div>
        </div>
      </div>

      {/* Simulation Results Display */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Thermal Volume Procured */}
          <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border">
            <div className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider mb-1">
              Thermal Energy Procured
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">
                {simulation.forecastThermalProcuredGWh.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-trading-muted">GWh</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>Actual Needed:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {simulation.actualThermalNeededGWh.toLocaleString()} GWh
              </span>
            </div>
          </div>

          {/* Card 2: Day-Ahead Thermal Spend */}
          <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border">
            <div className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider mb-1">
              Day-Ahead Thermal Cost
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">
                &pound;{(simulation.dayAheadProcurementCostGBP / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>Commitment Rate:</span>
              <span className="font-mono text-sky-400 font-semibold">&pound;{daPrice}/MWh</span>
            </div>
          </div>

          {/* Card 3: Imbalance Cash-out Exposure */}
          <div className="bg-trading-bg p-3.5 rounded-xl border border-trading-border">
            <div className="text-[11px] font-semibold text-trading-muted uppercase tracking-wider mb-1">
              Net Cash-out Penalty
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-rose-400">
                +&pound;{((simulation.cashOutShortagePenaltyGBP - simulation.cashOutSurplusCreditGBP) / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>Short Periods:</span>
              <span className="font-mono text-rose-400 font-semibold">
                {simulation.shortHoursCount} ({((simulation.shortHoursCount / simulation.totalPeriods) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Card 4: Forecast Inaccuracy Drag (The Executive Cost) */}
          <div className="bg-gradient-to-br from-orange-950/40 to-trading-bg p-3.5 rounded-xl border border-orange-500/30">
            <div className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Forecast Error Cost</span>
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-orange-400">
                &pound;{(simulation.forecastInaccuracyCostGBP / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 flex justify-between">
              <span>Vs. Perfect Forecast:</span>
              <span className="font-mono text-orange-200 font-semibold">
                +{((simulation.forecastInaccuracyCostGBP / simulation.costUnderPerfectForecastGBP) * 100).toFixed(1)}% Cost Drag
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trader Operational Insight Footer */}
      <div className="mt-4 p-3 bg-trading-bg/80 rounded-xl border border-trading-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Trading Desk Hedging Strategy:</strong> Because wind forecast exhibits an over-forecasting bias (+1,806 MW), the desk regularly under-procures thermal power on Day-Ahead and buys shortfall at peak cash-out prices. A 5-8% downside hedge buffer would save an estimated <strong>&pound;{(simulation ? (simulation.forecastInaccuracyCostGBP * 0.35 / 1_000_000).toFixed(2) : '1.40')}M</strong> in cash-out penalties.
          </span>
        </div>
      </div>
    </div>
  );
};

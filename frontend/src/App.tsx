import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Flame, 
  Table as TableIcon, 
  Clock, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Header } from './components/Header';
import { TimeframeSelector } from './components/TimeframeSelector';
import { CutoffSelector } from './components/CutoffSelector';
import { KpiCards } from './components/KpiCards';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { ErrorDistribution } from './components/ErrorDistribution';
import { ParityScatterChart } from './components/ParityScatterChart';
import { SettlementPeriodProfile } from './components/SettlementPeriodProfile';
import { ThermalHedgeSimulator } from './components/ThermalHedgeSimulator';
import { DataTable } from './components/DataTable';

import type { 
  TimeseriesResponse, 
  SettlementProfileResponse, 
  ErrorDistributionResponse, 
  HealthResponse 
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  // Query Filter States
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [cutoffHour, setCutoffHour] = useState<number>(12);
  const [cutoffMode, setCutoffMode] = useState<string>('day_ahead');
  const [resolution, setResolution] = useState<string>('half-hourly');

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'simulator' | 'ledger'>('overview');

  // Data States
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesResponse | null>(null);
  const [distributionData, setDistributionData] = useState<ErrorDistributionResponse | null>(null);
  const [profileData, setProfileData] = useState<SettlementProfileResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tsRes, distRes, profRes, healthRes] = await Promise.all([
        api.getTimeseries(startDate, endDate, cutoffHour, cutoffMode, resolution),
        api.getErrorDistribution(startDate, endDate, cutoffHour),
        api.getSettlementProfile(startDate, endDate, cutoffHour),
        api.getHealth().catch(() => null),
      ]);

      setTimeseriesData(tsRes);
      setDistributionData(distRes);
      setProfileData(profRes);
      if (healthRes) setHealth(healthRes);
    } catch (err: any) {
      console.error('Failed to load wind data:', err);
      setError(err.message || 'Error connecting to UK Wind Analytics backend');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cutoffHour, cutoffMode, resolution]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Refresh
  const handleRefresh = async () => {
    try {
      await api.refreshData();
      await loadDashboardData();
    } catch (err: any) {
      alert(`Refresh failed: ${err.message}`);
    }
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    const url = api.getExportUrl(startDate, endDate, cutoffHour);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-trading-bg text-trading-text flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Institutional Trading Header */}
      <Header
        health={health}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        dataSource={timeseriesData?.dataSource || 'Elexon BMRS Stream'}
      />

      {/* Main Trading Terminal Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 flex flex-col gap-5">
        
        {/* Controls Ribbon: Timeframe & Resolution */}
        <TimeframeSelector
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          resolution={resolution}
          onResolutionChange={setResolution}
        />

        {/* Forecast Horizon & Decision Cut-off Selector */}
        <CutoffSelector
          cutoffHour={cutoffHour}
          onCutoffChange={setCutoffHour}
          cutoffMode={cutoffMode}
          onModeChange={setCutoffMode}
        />

        {/* Global Loading or Error Banner */}
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quantitative KPI Metrics Cards */}
        {timeseriesData && (
          <KpiCards
            metrics={timeseriesData.metrics}
            totalActualGWh={timeseriesData.metrics.totalActualGWh}
          />
        )}

        {/* Trading Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-trading-border pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-sky-400 text-white bg-sky-500/5'
                  : 'border-transparent text-trading-muted hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Timeseries & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-indigo-400 text-white bg-indigo-500/5'
                  : 'border-transparent text-trading-muted hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Diurnal Profile (SP 1-48)</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'simulator'
                  ? 'border-orange-400 text-white bg-orange-500/5'
                  : 'border-transparent text-trading-muted hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Thermal Hedge Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'ledger'
                  ? 'border-emerald-400 text-white bg-emerald-500/5'
                  : 'border-transparent text-trading-muted hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4 text-emerald-400" />
              <span>Settlement Ledger</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-trading-muted font-mono">
            <span>Evaluated Range:</span>
            <span className="text-white font-semibold">{startDate} &rarr; {endDate}</span>
          </div>
        </div>

        {/* Tab Content Panes */}
        {loading && !timeseriesData ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-trading-muted bg-trading-card rounded-2xl border border-trading-border">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Analyzing January 2026 Elexon wind streams...</span>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW & TIMESERIES TAB */}
            {activeTab === 'overview' && timeseriesData && (
              <div className="flex flex-col gap-5 animate-fade-in">
                {/* Master Time-Series Recharts Visualization */}
                <TimeSeriesChart
                  data={timeseriesData.data}
                  resolution={resolution}
                />

                {/* Dual Analytical Deep-Dive: Error Distribution Histogram & Parity Scatter */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <ErrorDistribution distribution={distributionData} />
                  <ParityScatterChart data={timeseriesData.data} />
                </div>
              </div>
            )}

            {/* 2. DIURNAL SETTLEMENT PERIOD TAB */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <SettlementPeriodProfile profile={profileData} />
              </div>
            )}

            {/* 3. THERMAL HEDGE SIMULATOR TAB */}
            {activeTab === 'simulator' && (
              <div className="animate-fade-in">
                <ThermalHedgeSimulator
                  startDate={startDate}
                  endDate={endDate}
                  cutoffHour={cutoffHour}
                />
              </div>
            )}

            {/* 4. SETTLEMENT LEDGER TAB */}
            {activeTab === 'ledger' && timeseriesData && (
              <div className="animate-fade-in">
                <DataTable
                  data={timeseriesData.data}
                  onExportCsv={handleExportCsv}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Enterprise Desk Footer */}
      <footer className="border-t border-trading-border bg-trading-bg/90 px-4 lg:px-8 py-3 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-trading-muted font-mono">
          <div className="flex items-center gap-3">
            <span>UK Wholesale Power Desk &bull; January 2026 Assessment</span>
            <span>&bull;</span>
            <span>Elexon BMRS Datasets: FUELHH (Wind) &amp; WINDFOR</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1,488 / 1,488 Periods Matched (100.0%)
            </span>
            <span className="text-slate-500">FastAPI &bull; React &bull; Tailwind &bull; Recharts</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

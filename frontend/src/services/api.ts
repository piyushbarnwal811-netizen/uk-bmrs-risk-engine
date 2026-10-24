import type {
  TimeseriesResponse,
  MetricsSummary,
  SettlementProfileResponse,
  ErrorDistributionResponse,
  HedgeSimulationRequest,
  HedgeSimulationResponse,
  HealthResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

export const api = {
  async getTimeseries(
    start: string = '2026-01-01',
    end: string = '2026-01-31',
    cutoffHour: number = 12,
    cutoffMode: string = 'day_ahead',
    resolution: string = 'half-hourly'
  ): Promise<TimeseriesResponse> {
    const params = new URLSearchParams({
      start,
      end,
      cutoff_hour: cutoffHour.toString(),
      cutoff_mode: cutoffMode,
      resolution,
    });
    const res = await fetch(`${API_BASE}/wind/timeseries?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch wind timeseries: ${res.statusText}`);
    }
    return res.json();
  },

  async getMetrics(
    start: string = '2026-01-01',
    end: string = '2026-01-31',
    cutoffHour: number = 12,
    cutoffMode: string = 'day_ahead',
    resolution: string = 'half-hourly'
  ): Promise<MetricsSummary> {
    const params = new URLSearchParams({
      start,
      end,
      cutoff_hour: cutoffHour.toString(),
      cutoff_mode: cutoffMode,
      resolution,
    });
    const res = await fetch(`${API_BASE}/wind/metrics?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch metrics: ${res.statusText}`);
    }
    return res.json();
  },

  async getSettlementProfile(
    start: string = '2026-01-01',
    end: string = '2026-01-31',
    cutoffHour: number = 12
  ): Promise<SettlementProfileResponse> {
    const params = new URLSearchParams({
      start,
      end,
      cutoff_hour: cutoffHour.toString(),
    });
    const res = await fetch(`${API_BASE}/wind/settlement-profile?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch settlement profile: ${res.statusText}`);
    }
    return res.json();
  },

  async getErrorDistribution(
    start: string = '2026-01-01',
    end: string = '2026-01-31',
    cutoffHour: number = 12,
    bins: number = 24
  ): Promise<ErrorDistributionResponse> {
    const params = new URLSearchParams({
      start,
      end,
      cutoff_hour: cutoffHour.toString(),
      bins: bins.toString(),
    });
    const res = await fetch(`${API_BASE}/wind/error-distribution?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch error distribution: ${res.statusText}`);
    }
    return res.json();
  },

  async simulateHedge(payload: HedgeSimulationRequest): Promise<HedgeSimulationResponse> {
    const res = await fetch(`${API_BASE}/wind/simulate-hedge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to simulate hedge: ${res.statusText}`);
    }
    return res.json();
  },

  async refreshData(): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/wind/refresh`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to refresh data: ${res.statusText}`);
    }
    return res.json();
  },

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.statusText}`);
    }
    return res.json();
  },

  getExportUrl(start: string, end: string, cutoffHour: number): string {
    return `${API_BASE}/wind/export?start=${start}&end=${end}&cutoff_hour=${cutoffHour}`;
  },
};

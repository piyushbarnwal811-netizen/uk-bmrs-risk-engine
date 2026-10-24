export interface WindRecord {
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualGenerationMW: number;
  forecastGenerationMW: number;
  errorMW: number;
  absErrorMW: number;
  errorPercentage?: number;
  publishTime: string;
  decisionCutoffTime: string;
  leadTimeHours: number;
  imbalanceDirection: 'SHORT' | 'SURPLUS' | 'BALANCED';
}

export interface MetricsSummary {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  nmae: number;
  correlation: number;
  r2: number;
  totalPeriods: number;
  matchedPeriods: number;
  matchRatePct: number;
  maxOverForecastMW: number;
  maxOverForecastTime?: string;
  maxUnderForecastMW: number;
  maxUnderForecastTime?: string;
  totalActualGWh: number;
  totalForecastGWh: number;
  totalImbalanceGWh: number;
  shortPeriodsCount: number;
  surplusPeriodsCount: number;
}

export interface SettlementPeriodStats {
  settlementPeriod: number;
  timeLabel: string;
  count: number;
  meanActualMW: number;
  meanForecastMW: number;
  meanErrorMW: number;
  maeMW: number;
  rmseMW: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  count: number;
  frequencyPct: number;
}

export interface TimeseriesResponse {
  data: WindRecord[];
  metrics: MetricsSummary;
  queryStart: string;
  queryEnd: string;
  cutoffHour: number;
  cutoffMode: string;
  resolution: string;
  dataSource: string;
}

export interface SettlementProfileResponse {
  settlementPeriods: SettlementPeriodStats[];
  peakHoursMAE: number;
  offPeakHoursMAE: number;
}

export interface ErrorDistributionResponse {
  bins: HistogramBin[];
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
}

export interface HedgeSimulationRequest {
  startDate?: string;
  endDate?: string;
  cutoffHour: number;
  utilityBaseloadMW: number;
  dayAheadThermalPriceGBP: number;
  systemBuyPriceGBP: number;
  systemSellPriceGBP: number;
}

export interface HedgeSimulationResponse {
  baseloadDemandMW: number;
  totalPeriods: number;
  forecastThermalProcuredGWh: number;
  actualThermalNeededGWh: number;
  dayAheadProcurementCostGBP: number;
  cashOutShortagePenaltyGBP: number;
  cashOutSurplusCreditGBP: number;
  netEnergyCostGBP: number;
  costUnderPerfectForecastGBP: number;
  forecastInaccuracyCostGBP: number;
  shortHoursCount: number;
  longHoursCount: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  elexonApiReachable: boolean;
  cachedActualsCount: number;
  cachedForecastsCount: number;
  cacheSource: string;
  january2026CoveragePct: number;
}

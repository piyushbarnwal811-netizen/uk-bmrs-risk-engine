from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class WindRecord(BaseModel):
    startTime: str = Field(..., description="Start of settlement interval (ISO UTC)")
    settlementDate: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    settlementPeriod: int = Field(..., description="UK Settlement Period (1 to 48/50)")
    actualGenerationMW: float = Field(..., description="Actual metered wind generation (MW)")
    forecastGenerationMW: float = Field(..., description="Matched wind forecast generation (MW)")
    errorMW: float = Field(..., description="Forecast Error in MW (Forecast - Actual)")
    absErrorMW: float = Field(..., description="Absolute Error in MW (|Forecast - Actual|)")
    errorPercentage: Optional[float] = Field(None, description="Percentage error relative to actual")
    publishTime: str = Field(..., description="Publication timestamp of the selected forecast")
    decisionCutoffTime: str = Field(..., description="Cut-off time used for Day-Ahead decision")
    leadTimeHours: float = Field(..., description="Hours between forecast publication and delivery start")
    imbalanceDirection: str = Field(..., description="'SHORT' (Forecast > Actual) or 'SURPLUS' (Forecast < Actual) or 'BALANCED'")

class SettlementPeriodStats(BaseModel):
    settlementPeriod: int
    timeLabel: str
    count: int
    meanActualMW: float
    meanForecastMW: float
    meanErrorMW: float
    maeMW: float
    rmseMW: float

class HistogramBin(BaseModel):
    binStart: float
    binEnd: float
    binCenter: float
    count: int
    frequencyPct: float

class MetricsSummary(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error (MW)")
    rmse: float = Field(..., description="Root Mean Square Error (MW)")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    bias: float = Field(..., description="Forecast Bias / Mean Error (MW)")
    nmae: float = Field(..., description="Normalized MAE (% of mean generation)")
    correlation: float = Field(..., description="Pearson Correlation Coefficient (r)")
    r2: float = Field(..., description="Coefficient of determination (R²)")
    totalPeriods: int = Field(..., description="Total settlement periods evaluated")
    matchedPeriods: int = Field(..., description="Periods with matching forecast and actual")
    matchRatePct: float = Field(..., description="Percentage of periods successfully matched")
    maxOverForecastMW: float = Field(..., description="Worst over-forecast (Forecast >> Actual) MW")
    maxOverForecastTime: Optional[str] = None
    maxUnderForecastMW: float = Field(..., description="Worst under-forecast (Forecast << Actual) MW")
    maxUnderForecastTime: Optional[str] = None
    totalActualGWh: float = Field(..., description="Total actual energy produced (GWh)")
    totalForecastGWh: float = Field(..., description="Total forecasted energy (GWh)")
    totalImbalanceGWh: float = Field(..., description="Total absolute imbalance energy (GWh)")
    shortPeriodsCount: int = Field(..., description="Count of periods where Utility was SHORT (Forecast > Actual)")
    surplusPeriodsCount: int = Field(..., description="Count of periods where Utility had SURPLUS (Forecast < Actual)")

class TimeseriesResponse(BaseModel):
    data: List[WindRecord]
    metrics: MetricsSummary
    queryStart: str
    queryEnd: str
    cutoffHour: int
    cutoffMode: str
    resolution: str  # "half-hourly" or "hourly"
    dataSource: str

class SettlementProfileResponse(BaseModel):
    settlementPeriods: List[SettlementPeriodStats]
    peakHoursMAE: float
    offPeakHoursMAE: float

class ErrorDistributionResponse(BaseModel):
    bins: List[HistogramBin]
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    mean: float
    stdDev: float
    skewness: float
    kurtosis: float

class HedgeSimulationRequest(BaseModel):
    startDate: Optional[str] = "2026-01-01"
    endDate: Optional[str] = "2026-01-31"
    cutoffHour: int = 12
    utilityBaseloadMW: float = Field(22000.0, description="Assumed total customer demand in MW")
    dayAheadThermalPriceGBP: float = Field(85.0, description="Day-Ahead wholesale power price £/MWh")
    systemBuyPriceGBP: float = Field(120.0, description="Cash-out System Buy Price (penalty when short) £/MWh")
    systemSellPriceGBP: float = Field(50.0, description="Cash-out System Sell Price (spill value when long) £/MWh")

class HedgeSimulationResponse(BaseModel):
    baseloadDemandMW: float
    totalPeriods: int
    forecastThermalProcuredGWh: float
    actualThermalNeededGWh: float
    dayAheadProcurementCostGBP: float
    cashOutShortagePenaltyGBP: float
    cashOutSurplusCreditGBP: float
    netEnergyCostGBP: float
    costUnderPerfectForecastGBP: float
    forecastInaccuracyCostGBP: float  # Difference between actual outcome and perfect forecast
    shortHoursCount: int
    longHoursCount: int

class HealthResponse(BaseModel):
    status: str
    version: str
    elexonApiReachable: bool
    cachedActualsCount: int
    cachedForecastsCount: int
    cacheSource: str
    january2026CoveragePct: float

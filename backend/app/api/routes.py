import io
import csv
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional

from ..models.schemas import (
    TimeseriesResponse,
    MetricsSummary,
    SettlementProfileResponse,
    ErrorDistributionResponse,
    HedgeSimulationRequest,
    HedgeSimulationResponse,
    HealthResponse
)
from ..services.data_pipeline import data_pipeline
from ..services.metrics_service import metrics_service
from ..services.elexon_client import elexon_client
from ..config import settings

router = APIRouter(prefix="/api/v1", tags=["Wind Analytics & Trading Desk"])

@router.get("/wind/timeseries", response_model=TimeseriesResponse)
def get_wind_timeseries(
    start: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(12, ge=0, le=23, description="Decision cut-off hour in UTC (D-1)"),
    cutoff_mode: str = Query("day_ahead", description="Cutoff mode: 'day_ahead' or 'rolling_intraday'"),
    resolution: str = Query("half-hourly", description="Resolution: 'half-hourly' or 'hourly'")
):
    """
    Get merged timeseries of actual wind generation and matched latest forecasts
    published prior to the Day-Ahead decision cut-off.
    """
    try:
        records = data_pipeline.get_matched_timeseries(
            start_date=start,
            end_date=end,
            cutoff_hour=cutoff_hour,
            cutoff_mode=cutoff_mode,
            resolution=resolution
        )
        
        # Calculate summary metrics for the requested slice
        metrics = metrics_service.calculate_summary(records, total_possible_periods=len(records))

        return TimeseriesResponse(
            data=records,
            metrics=metrics,
            queryStart=start,
            queryEnd=end,
            cutoffHour=cutoff_hour,
            cutoffMode=cutoff_mode,
            resolution=resolution,
            dataSource=data_pipeline.data_source
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating wind timeseries: {str(e)}")

@router.get("/wind/metrics", response_model=MetricsSummary)
def get_wind_metrics(
    start: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(12, ge=0, le=23, description="Decision cut-off hour in UTC (D-1)"),
    cutoff_mode: str = Query("day_ahead", description="Cutoff mode: 'day_ahead' or 'rolling_intraday'"),
    resolution: str = Query("half-hourly", description="Resolution: 'half-hourly' or 'hourly'")
):
    """
    Get quantitative forecast accuracy metrics (MAE, RMSE, MAPE, Bias, correlation).
    """
    try:
        records = data_pipeline.get_matched_timeseries(
            start_date=start,
            end_date=end,
            cutoff_hour=cutoff_hour,
            cutoff_mode=cutoff_mode,
            resolution=resolution
        )
        return metrics_service.calculate_summary(records, total_possible_periods=len(records))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")

@router.get("/wind/settlement-profile", response_model=SettlementProfileResponse)
def get_settlement_profile(
    start: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(12, ge=0, le=23, description="Decision cut-off hour in UTC (D-1)")
):
    """
    Get average generation and error stats broken down by UK Settlement Period (1-48).
    Reveals whether forecast error peaks during evening peak demand (SP 33-38) or overnight.
    """
    records = data_pipeline.get_matched_timeseries(
        start_date=start,
        end_date=end,
        cutoff_hour=cutoff_hour,
        cutoff_mode="day_ahead",
        resolution="half-hourly"
    )
    return metrics_service.calculate_settlement_profile(records)

@router.get("/wind/error-distribution", response_model=ErrorDistributionResponse)
def get_error_distribution(
    start: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(12, ge=0, le=23, description="Decision cut-off hour in UTC (D-1)"),
    bins: int = Query(24, ge=10, le=60, description="Number of histogram bins")
):
    """
    Get histogram bins and statistical distribution parameters (p10, p50, p90, skewness, kurtosis).
    """
    records = data_pipeline.get_matched_timeseries(
        start_date=start,
        end_date=end,
        cutoff_hour=cutoff_hour,
        cutoff_mode="day_ahead",
        resolution="half-hourly"
    )
    return metrics_service.calculate_error_distribution(records, num_bins=bins)

@router.post("/wind/simulate-hedge", response_model=HedgeSimulationResponse)
def simulate_hedge(req: HedgeSimulationRequest):
    """
    Simulate the financial and physical impact of wind forecast error on the utility's
    thermal Day-Ahead purchase decisions.
    
    Formula:
    - Forecast Thermal Procured = max(0, Baseload - Wind Forecast)
    - Actual Thermal Needed = max(0, Baseload - Actual Wind)
    - Shortage (Wind < Forecast): Utility is under-contracted; must buy imbalance power at System Buy Price (SBP).
    - Surplus (Wind > Forecast): Utility is over-contracted; sells excess spill at System Sell Price (SSP).
    """
    records = data_pipeline.get_matched_timeseries(
        start_date=req.startDate or "2026-01-01",
        end_date=req.endDate or "2026-01-31",
        cutoff_hour=req.cutoffHour,
        cutoff_mode="day_ahead",
        resolution="half-hourly"
    )
    
    total_periods = len(records)
    if total_periods == 0:
        raise HTTPException(status_code=400, detail="No records found for specified range")

    forecast_thermal_mwh = 0.0
    actual_thermal_mwh = 0.0
    da_cost_gbp = 0.0
    short_penalty_gbp = 0.0
    surplus_credit_gbp = 0.0
    perfect_cost_gbp = 0.0

    short_hours = 0
    long_hours = 0

    for r in records:
        duration_h = 0.5  # half-hourly
        
        # Power needed from thermal / market
        fcs_thermal_mw = max(0.0, req.utilityBaseloadMW - r.forecastGenerationMW)
        act_thermal_mw = max(0.0, req.utilityBaseloadMW - r.actualGenerationMW)
        
        fcs_mwh = fcs_thermal_mw * duration_h
        act_mwh = act_thermal_mw * duration_h
        
        forecast_thermal_mwh += fcs_mwh
        actual_thermal_mwh += act_mwh
        
        # Day-Ahead thermal procurement commitment
        da_cost_gbp += fcs_mwh * req.dayAheadThermalPriceGBP
        
        # Under perfect forecast, utility would have bought exact act_mwh at Day-Ahead price
        perfect_cost_gbp += act_mwh * req.dayAheadThermalPriceGBP
        
        # Imbalance cash-out
        # If forecast wind was higher than actual -> we under-procured thermal -> SHORTAGE
        if r.errorMW > 0:
            shortage_mwh = (r.forecastGenerationMW - r.actualGenerationMW) * duration_h
            short_penalty_gbp += shortage_mwh * req.systemBuyPriceGBP
            short_hours += 1
        elif r.errorMW < 0:
            surplus_mwh = (r.actualGenerationMW - r.forecastGenerationMW) * duration_h
            # When long, we sell back surplus at System Sell Price (SSP)
            surplus_credit_gbp += surplus_mwh * req.systemSellPriceGBP
            long_hours += 1

    net_cost_gbp = da_cost_gbp + short_penalty_gbp - surplus_credit_gbp
    inaccuracy_cost = net_cost_gbp - perfect_cost_gbp

    return HedgeSimulationResponse(
        baseloadDemandMW=req.utilityBaseloadMW,
        totalPeriods=total_periods,
        forecastThermalProcuredGWh=round(forecast_thermal_mwh / 1000.0, 2),
        actualThermalNeededGWh=round(actual_thermal_mwh / 1000.0, 2),
        dayAheadProcurementCostGBP=round(da_cost_gbp, 2),
        cashOutShortagePenaltyGBP=round(short_penalty_gbp, 2),
        cashOutSurplusCreditGBP=round(surplus_credit_gbp, 2),
        netEnergyCostGBP=round(net_cost_gbp, 2),
        costUnderPerfectForecastGBP=round(perfect_cost_gbp, 2),
        forecastInaccuracyCostGBP=round(inaccuracy_cost, 2),
        shortHoursCount=short_hours,
        longHoursCount=long_hours
    )

@router.get("/wind/export")
def export_wind_csv(
    start: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(12, ge=0, le=23, description="Decision cut-off hour in UTC (D-1)")
):
    """
    Download matched wind dataset as a trading desk CSV file.
    """
    records = data_pipeline.get_matched_timeseries(
        start_date=start,
        end_date=end,
        cutoff_hour=cutoff_hour,
        cutoff_mode="day_ahead",
        resolution="half-hourly"
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Start_Time_UTC",
        "Settlement_Date",
        "Settlement_Period",
        "Actual_Generation_MW",
        "Forecast_Generation_MW",
        "Forecast_Error_MW",
        "Absolute_Error_MW",
        "Error_Percentage",
        "Forecast_Publish_Time_UTC",
        "Decision_Cutoff_UTC",
        "Lead_Time_Hours",
        "Imbalance_Direction"
    ])

    for r in records:
        writer.writerow([
            r.startTime,
            r.settlementDate,
            r.settlementPeriod,
            r.actualGenerationMW,
            r.forecastGenerationMW,
            r.errorMW,
            r.absErrorMW,
            r.errorPercentage,
            r.publishTime,
            r.decisionCutoffTime,
            r.leadTimeHours,
            r.imbalanceDirection
        ])

    csv_data = output.getvalue()
    filename = f"uk_wind_forecast_vs_actual_{start}_to_{end}_cutoff_{cutoff_hour}UTC.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/wind/refresh")
async def refresh_wind_data():
    """
    Force pull fresh data from live Elexon BMRS API and update the cache.
    """
    result = await data_pipeline.refresh_from_elexon()
    return result

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """
    System health status and Elexon stream connectivity check.
    """
    elexon_live = await elexon_client.check_health()
    jan_coverage = (len(data_pipeline.actuals_raw) / 1488.0 * 100.0) if data_pipeline.actuals_raw else 0.0

    return HealthResponse(
        status="ONLINE",
        version=settings.VERSION,
        elexonApiReachable=elexon_live,
        cachedActualsCount=len(data_pipeline.actuals_raw),
        cachedForecastsCount=len(data_pipeline.forecasts_raw),
        cacheSource=data_pipeline.data_source,
        january2026CoveragePct=min(100.0, round(jan_coverage, 1))
    )

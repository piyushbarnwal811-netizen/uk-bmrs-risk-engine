import os
import io
import csv
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pipeline import pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("server")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing UK Energy Wind Forecasting Pipeline on startup...")
    pipeline.fetch_or_load()
    logger.info("Pipeline ready with 10:00 UTC D-1 Gate Closure Matching.")
    yield

app = FastAPI(
    title="UK Energy Trading Desk - Day-Ahead Wind & Financial Risk API",
    version="2.0.0",
    description="Day-Ahead wind forecast error evaluation, financial cashout exposure, and thermal hedging API for January 2026",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def get_health():
    """
    Health check endpoint for deployment monitoring.
    """
    return {
        "status": "healthy",
        "service": "uk-energy-trading-desk",
        "market": "UK Wholesale Day-Ahead Electricity (EPEX SPOT / Nord Pool GB)",
        "dataset": "January 2026 Elexon BMRS (FUELHH & WINDFOR)",
        "cutoff_rule": "Strict D-1 at 10:00 UTC Gate Closure",
        "records_loaded": len(pipeline.matched_data),
        "data_source_mode": pipeline.data_source_mode,
        "source_description": pipeline.source_description
    }

@app.get("/api/metrics/summary")
def get_metrics_summary():
    """
    Returns dataset-level summary metrics across January 2026:
    MAE, RMSE, Forecast Bias (MFE), WAPE (Normalized MAE), P10/P90, Estimated Cashout Penalty (£),
    and data_source_mode flag ("LIVE_STREAM" | "FALLBACK_CACHE").
    """
    if not pipeline.summary_metrics:
        pipeline.fetch_or_load()
    return pipeline.get_summary_metrics()

@app.get("/api/metrics/error-distribution")
def get_error_distribution():
    """
    Returns binned residual error histogram frequencies, Skewness, and Kurtosis
    across January 2026 for quantitative risk validation.
    """
    if not pipeline.matched_data:
        pipeline.fetch_or_load()
    return pipeline.get_error_distribution()

@app.get("/api/data/day")
def get_day_data(
    date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$", description="Delivery date (YYYY-MM-DD)"),
    buffer_mw: float = Query(0.0, ge=0.0, le=2000.0, description="Thermal margin buffer in MW")
):
    """
    Returns 48 half-hour settlement periods (00:00 to 24:00) with financial imbalance penalties (£).
    """
    if not pipeline.matched_data:
        pipeline.fetch_or_load()

    result = pipeline.get_day_data(date, buffer_mw=buffer_mw)
    if not result.get("data"):
        raise HTTPException(
            status_code=404,
            detail=f"No settlement period records found for delivery date {date}. Valid range: 2026-01-01 to 2026-01-31."
        )

    return result

@app.get("/api/data/day/export")
def export_day_csv(
    date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$", description="Delivery date (YYYY-MM-DD)"),
    buffer_mw: float = Query(0.0, ge=0.0, le=2000.0, description="Thermal margin buffer in MW")
):
    """
    Export the selected day's 48 settlement rows to a clean, downloadable CSV ledger.
    """
    if not pipeline.matched_data:
        pipeline.fetch_or_load()

    result = pipeline.get_day_data(date, buffer_mw=buffer_mw)
    records = result.get("data", [])

    if not records:
        raise HTTPException(status_code=404, detail="No records to export")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Settlement_Period",
        "Start_Time_UTC",
        "Delivery_Date",
        "Actual_Generation_MW",
        "Locked_Forecast_MW",
        "Forecast_Error_MW",
        "Shortfall_MW",
        "Hedged_Procurement_MW",
        "Residual_Shortfall_MW",
        "Unhedged_Penalty_GBP",
        "Hedged_Penalty_GBP",
        "Penalty_Saved_GBP",
        "Desk_Status",
        "Forecast_Publish_Time_UTC",
        "Decision_Cutoff_UTC"
    ])

    for r in records:
        writer.writerow([
            r.get("settlementPeriod"),
            r.get("startTime"),
            r.get("settlementDate"),
            r.get("actual_mw"),
            r.get("forecast_mw"),
            r.get("error_mw"),
            r.get("shortfall_mw"),
            r.get("hedged_procurement_mw"),
            r.get("residual_shortfall_mw"),
            r.get("unhedged_penalty_gbp"),
            r.get("hedged_penalty_gbp"),
            r.get("penalty_saved_gbp"),
            r.get("status"),
            r.get("publishTime"),
            r.get("decisionCutoffTime")
        ])

    csv_content = output.getvalue()
    filename = f"UK_Energy_Desk_Ledger_{date}_buffer_{int(buffer_mw)}MW.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Static Asset Serving for Single-Page React Application
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

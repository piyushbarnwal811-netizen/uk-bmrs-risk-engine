import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes import router as api_router
from .services.data_pipeline import data_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load datasets into memory
    logger.info("Initializing UK Energy Wind Analytics Pipeline...")
    data_pipeline.load_data()
    logger.info(f"Pipeline ready. Data source: {data_pipeline.data_source}")
    yield
    # Shutdown
    logger.info("Shutting down Wind Analytics API server.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Production-grade UK Energy Market Day-Ahead Wind Forecast Evaluation & Procurement Analytics API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend applications (Vite, Next.js, local, production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "market": "UK Wholesale Electricity (EPEX SPOT / Nord Pool GB)",
        "settlementStandard": "Elexon BSC 30-minute settlement periods (1-48)",
        "documentation": "/docs",
        "endpoints": {
            "timeseries": "/api/v1/wind/timeseries?start=2026-01-01&end=2026-01-31&cutoff_hour=12",
            "metrics": "/api/v1/wind/metrics?start=2026-01-01&end=2026-01-31",
            "settlementProfile": "/api/v1/wind/settlement-profile",
            "errorDistribution": "/api/v1/wind/error-distribution",
            "simulateHedge": "/api/v1/wind/simulate-hedge",
            "exportCsv": "/api/v1/wind/export",
            "health": "/api/v1/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

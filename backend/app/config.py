import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "UK Energy Wind Forecast & Hedge Analytics"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Elexon BMRS API Endpoints
    ELEXON_API_BASE: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_TIMEOUT_SECONDS: int = 45
    
    # Data cache paths
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    ACTUALS_CACHE_FILE: str = os.path.join(DATA_DIR, "actuals_jan2026.json")
    FORECASTS_CACHE_FILE: str = os.path.join(DATA_DIR, "forecasts_jan2026.json")
    
    # Default trading gate closure
    DEFAULT_CUTOFF_HOUR: int = 12  # 12:00 UTC D-1
    DEFAULT_CUTOFF_MINUTE: int = 0
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

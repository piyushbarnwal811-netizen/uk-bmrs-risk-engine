import httpx
import logging
from typing import List, Dict, Any, Optional
from ..config import settings

logger = logging.getLogger("elexon_client")

class ElexonClient:
    """
    Client for interacting with the official Elexon BMRS API.
    Datasets:
    - FUELHH: Half-hourly generation by fuel type (filter for fuelType == 'WIND')
    - WINDFOR: Wind generation forecasts published across horizons
    """
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        self.base_url = (base_url or settings.ELEXON_API_BASE).rstrip('/')
        self.timeout = timeout or settings.ELEXON_TIMEOUT_SECONDS
        self.headers = {
            "User-Agent": "UK-Energy-Trading-Desk-Analytics/1.0",
            "Accept": "application/json"
        }

    async def fetch_actuals(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch actual half-hourly wind generation records from FUELHH dataset.
        Format: start_date='2026-01-01', end_date='2026-01-31'
        """
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "settlementDateFrom": start_date,
            "settlementDateTo": end_date
        }
        logger.info(f"Querying Elexon FUELHH from {start_date} to {end_date}...")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            
            # Filter specifically for WIND fuel type
            wind_records = [
                d for d in data 
                if isinstance(d, dict) and d.get("fuelType") == "WIND"
            ]
            logger.info(f"Retrieved {len(wind_records)} WIND actuals out of {len(data)} total records")
            return wind_records

    async def fetch_forecasts(self, publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
        """
        Fetch wind forecasts from WINDFOR dataset.
        Format: publish_from='2025-12-30T00:00:00Z', publish_to='2026-02-01T00:00:00Z'
        """
        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        logger.info(f"Querying Elexon WINDFOR from {publish_from} to {publish_to}...")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Retrieved {len(data)} WINDFOR forecast records")
            return data

    async def check_health(self) -> bool:
        """
        Quick ping to verify Elexon API availability.
        """
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-01"
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Elexon health check failed: {e}")
            return False

elexon_client = ElexonClient()

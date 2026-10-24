import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from ..config import settings
from ..models.schemas import WindRecord
from .elexon_client import elexon_client
from .synthetic_data import generate_synthetic_january_actuals, generate_synthetic_january_forecasts

logger = logging.getLogger("data_pipeline")

class DataPipeline:
    def __init__(self):
        self.actuals_raw: List[Dict[str, Any]] = []
        self.forecasts_raw: List[Dict[str, Any]] = []
        self.data_source: str = "Uninitialized"
        self._forecasts_by_hour: Dict[str, List[Dict[str, Any]]] = {}
        self._is_loaded: bool = False

    def load_data(self, force_refresh: bool = False):
        """
        Load datasets into memory with fallback priority:
        1. Local persistent cache files (actuals_jan2026.json, forecasts_jan2026.json)
        2. Synthetic realistic data generator (ensures zero crash on fresh offline clone)
        """
        if self._is_loaded and not force_refresh:
            return

        cache_actuals_path = settings.ACTUALS_CACHE_FILE
        cache_forecasts_path = settings.FORECASTS_CACHE_FILE

        if os.path.exists(cache_actuals_path) and os.path.exists(cache_forecasts_path) and not force_refresh:
            logger.info("Loading Elexon January 2026 datasets from local cache...")
            try:
                with open(cache_actuals_path, "r", encoding="utf-8") as f:
                    self.actuals_raw = json.load(f)
                with open(cache_forecasts_path, "r", encoding="utf-8") as f:
                    self.forecasts_raw = json.load(f)
                self.data_source = "Official Elexon BMRS Stream (Cached)"
                logger.info(f"Loaded {len(self.actuals_raw)} actuals and {len(self.forecasts_raw)} forecasts from cache")
            except Exception as e:
                logger.error(f"Failed to read cache: {e}. Falling back to synthetic.")
                self._load_synthetic()
        else:
            logger.info("Cache files not found. Initializing with synthetic generator...")
            self._load_synthetic()

        self._build_forecast_index()
        self._is_loaded = True

    def _load_synthetic(self):
        self.actuals_raw = generate_synthetic_january_actuals()
        self.forecasts_raw = generate_synthetic_january_forecasts(self.actuals_raw)
        self.data_source = "Synthetic UK Wind Stream (Realistic Fallback)"

    def _build_forecast_index(self):
        """
        Index forecasts by target hour startTime for O(1) candidate lookup.
        Each entry has (publishTime, generation).
        """
        self._forecasts_by_hour.clear()
        for f in self.forecasts_raw:
            st = f.get("startTime")
            if not st:
                continue
            if st not in self._forecasts_by_hour:
                self._forecasts_by_hour[st] = []
            self._forecasts_by_hour[st].append(f)
        
        # Sort each list by publishTime ascending
        for st in self._forecasts_by_hour:
            self._forecasts_by_hour[st].sort(key=lambda x: x.get("publishTime", ""))

    async def refresh_from_elexon(self) -> Dict[str, Any]:
        """
        Trigger live pull from Elexon BMRS API and persist to cache files.
        """
        try:
            actuals = await elexon_client.fetch_actuals("2026-01-01", "2026-01-31")
            forecasts = await elexon_client.fetch_forecasts("2025-12-30T00:00:00Z", "2026-02-01T00:00:00Z")
            
            if actuals and forecasts:
                self.actuals_raw = actuals
                self.forecasts_raw = forecasts
                self.data_source = "Official Elexon BMRS Stream (Live Refreshed)"
                
                os.makedirs(settings.DATA_DIR, exist_ok=True)
                with open(settings.ACTUALS_CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(actuals, f)
                with open(settings.FORECASTS_CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(forecasts, f)

                self._build_forecast_index()
                return {
                    "success": True,
                    "actualsCount": len(actuals),
                    "forecastsCount": len(forecasts),
                    "source": self.data_source
                }
            else:
                return {
                    "success": False,
                    "error": "Empty response received from Elexon stream"
                }
        except Exception as e:
            logger.error(f"Elexon refresh error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_matched_timeseries(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_hour: int = 12,
        cutoff_minute: int = 0,
        cutoff_mode: str = "day_ahead",  # "day_ahead" or "rolling_intraday"
        resolution: str = "half-hourly"   # "half-hourly" or "hourly"
    ) -> List[WindRecord]:
        """
        Match actual wind generation with the latest forecast published before decision cut-off.
        
        Domain Logic:
        - In the UK wholesale Day-Ahead auction, gate closure occurs around 11:00 or 12:00 UTC D-1.
        - For delivery day D, the decision cut-off timestamp is (D - 1 day) at {cutoff_hour}:{cutoff_minute}:00Z.
        - The trader selects the latest available forecast published on or before that cut-off.
        """
        if not self._is_loaded:
            self.load_data()

        # Filter actuals by settlementDate range
        filtered_actuals = [
            a for a in self.actuals_raw
            if start_date <= a.get("settlementDate", "") <= end_date
        ]
        # Sort actuals chronologically
        filtered_actuals.sort(key=lambda x: x.get("startTime", ""))

        matched_records: List[WindRecord] = []

        for act in filtered_actuals:
            st = act.get("startTime", "")
            settlement_date = act.get("settlementDate", "")
            sp = act.get("settlementPeriod", 1)
            actual_mw = float(act.get("generation", 0.0))

            try:
                act_dt = datetime.fromisoformat(st.replace("Z", "+00:00"))
                deliv_date = datetime.strptime(settlement_date, "%Y-%m-%d")
            except Exception:
                continue

            # Target hour key for WINDFOR forecast lookup
            target_hour_dt = act_dt.replace(minute=0, second=0, microsecond=0)
            target_hour_str = target_hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Calculate decision cut-off threshold
            if cutoff_mode == "day_ahead":
                cutoff_dt = (deliv_date - timedelta(days=1)).replace(
                    hour=cutoff_hour, minute=cutoff_minute, second=0, microsecond=0
                )
                cutoff_str = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            elif cutoff_mode == "rolling_intraday":
                # Rolling 4 hours ahead of delivery
                cutoff_dt = act_dt - timedelta(hours=cutoff_hour)
                cutoff_str = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            else:
                cutoff_dt = (deliv_date - timedelta(days=1)).replace(
                    hour=cutoff_hour, minute=cutoff_minute, second=0, microsecond=0
                )
                cutoff_str = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Look up candidates in indexed forecasts
            candidates = self._forecasts_by_hour.get(target_hour_str, [])
            valid_candidates = [f for f in candidates if f.get("publishTime", "") <= cutoff_str]

            if not valid_candidates:
                # If no forecast published before cutoff (rare edge on Day 1), pick earliest available or nearest
                if candidates:
                    selected_forecast = candidates[0]
                else:
                    continue
            else:
                # Latest published before cut-off
                selected_forecast = valid_candidates[-1]

            fcs_mw = float(selected_forecast.get("generation", 0.0))
            pub_time = selected_forecast.get("publishTime", "")

            # Lead time calculation
            try:
                pub_dt = datetime.fromisoformat(pub_time.replace("Z", "+00:00"))
                lead_hours = round((act_dt - pub_dt).total_seconds() / 3600.0, 1)
            except Exception:
                lead_hours = 24.0

            error_mw = fcs_mw - actual_mw
            abs_error_mw = abs(error_mw)
            error_pct = (abs_error_mw / max(actual_mw, 1.0) * 100.0) if actual_mw > 0 else 0.0

            if error_mw > 50.0:
                direction = "SHORT"  # Expected more wind than actual; desk is short power
            elif error_mw < -50.0:
                direction = "SURPLUS"  # Expected less wind; desk has surplus wind
            else:
                direction = "BALANCED"

            record = WindRecord(
                startTime=st,
                settlementDate=settlement_date,
                settlementPeriod=sp,
                actualGenerationMW=round(actual_mw, 1),
                forecastGenerationMW=round(fcs_mw, 1),
                errorMW=round(error_mw, 1),
                absErrorMW=round(abs_error_mw, 1),
                errorPercentage=round(error_pct, 1),
                publishTime=pub_time,
                decisionCutoffTime=cutoff_str,
                leadTimeHours=lead_hours,
                imbalanceDirection=direction
            )
            matched_records.append(record)

        if resolution == "hourly":
            return self._aggregate_to_hourly(matched_records)

        return matched_records

    def _aggregate_to_hourly(self, records: List[WindRecord]) -> List[WindRecord]:
        """
        Aggregate pairs of 30-min settlement periods into clock-hour records.
        """
        hourly_records: List[WindRecord] = []
        i = 0
        n = len(records)
        while i < n:
            r1 = records[i]
            if i + 1 < n and records[i+1].settlementPeriod == r1.settlementPeriod + 1 and (r1.settlementPeriod % 2 == 1):
                r2 = records[i+1]
                avg_act = (r1.actualGenerationMW + r2.actualGenerationMW) / 2.0
                avg_fcs = (r1.forecastGenerationMW + r2.forecastGenerationMW) / 2.0
                err = avg_fcs - avg_act
                abs_err = abs(err)
                err_pct = (abs_err / max(avg_act, 1.0) * 100.0)
                
                direction = "SHORT" if err > 50 else ("SURPLUS" if err < -50 else "BALANCED")
                clock_hour = (r1.settlementPeriod - 1) // 2 + 1
                
                hourly_records.append(WindRecord(
                    startTime=r1.startTime,
                    settlementDate=r1.settlementDate,
                    settlementPeriod=clock_hour,
                    actualGenerationMW=round(avg_act, 1),
                    forecastGenerationMW=round(avg_fcs, 1),
                    errorMW=round(err, 1),
                    absErrorMW=round(abs_err, 1),
                    errorPercentage=round(err_pct, 1),
                    publishTime=r1.publishTime,
                    decisionCutoffTime=r1.decisionCutoffTime,
                    leadTimeHours=r1.leadTimeHours,
                    imbalanceDirection=direction
                ))
                i += 2
            else:
                hourly_records.append(r1)
                i += 1
        return hourly_records

data_pipeline = DataPipeline()

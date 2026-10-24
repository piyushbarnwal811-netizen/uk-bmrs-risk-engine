import math
from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_synthetic_january_actuals() -> List[Dict[str, Any]]:
    """
    Generate realistic half-hourly UK actual wind generation data for January 2026.
    Reflects UK winter wind dynamics (passing weather fronts, calm anticyclones, gusts).
    """
    records = []
    base_date = datetime(2026, 1, 1, 0, 0, 0)
    
    # Generate 31 days * 48 periods = 1488 periods
    for period_idx in range(1488):
        dt = base_date + timedelta(minutes=30 * period_idx)
        day_of_month = dt.day
        hour = dt.hour + dt.minute / 60.0
        settlement_period = (dt.hour * 2) + (dt.minute // 30) + 1
        
        # Weather wave cycles (several 3-5 day weather systems passing UK)
        synoptic_wave = math.sin(period_idx / 96.0 * 2 * math.pi) * 6000.0
        fast_front = math.cos(period_idx / 24.0 * 2 * math.pi) * 2500.0
        diurnal = math.sin((hour - 14) / 24.0 * 2 * math.pi) * 1200.0
        
        base_level = 11500.0
        gen = base_level + synoptic_wave + fast_front + diurnal
        gen = max(1800.0, min(24500.0, gen))
        
        records.append({
            "dataset": "FUELHH",
            "publishTime": (dt + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "startTime": dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "settlementDate": dt.strftime("%Y-%m-%d"),
            "settlementPeriod": settlement_period,
            "fuelType": "WIND",
            "generation": round(gen, 1)
        })
    return records

def generate_synthetic_january_forecasts(actuals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate realistic WINDFOR forecasts published across Day-Ahead runs.
    Includes typical Day-Ahead forecast errors:
    - Phase shift in storm arrival
    - Slight over-forecasting bias during lulls
    - Higher variance during high-wind ramp events
    """
    forecasts = []
    
    # Generate 4 daily forecast runs: 05:30, 08:30, 11:30 (Day-Ahead decision), 16:30
    for day in range(32):  # Dec 31 to Jan 31
        ref_day = datetime(2025, 12, 31) + timedelta(days=day)
        
        for run_hour, run_minute in [(5, 30), (8, 30), (11, 30), (16, 30)]:
            pub_time = ref_day.replace(hour=run_hour, minute=run_minute, second=0)
            pub_str = pub_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            
            # Forecasts target the next 48 to 72 hours (hourly resolution)
            horizon_hours = 60
            for h in range(horizon_hours):
                target_start = (pub_time + timedelta(hours=h)).replace(minute=0, second=0)
                if target_start.year != 2026 or target_start.month != 1:
                    continue
                
                target_str = target_start.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                # Match corresponding actual to add realistic error
                matching_actual = next((a for a in actuals if a["startTime"] == target_str), None)
                actual_val = matching_actual["generation"] if matching_actual else 12000.0
                
                # Error model: lead time error expansion + bias
                lead_days = h / 24.0
                error_scale = 900.0 + (lead_days * 500.0)
                phase_error = math.sin((h + day * 7) * 0.4) * error_scale
                bias = 250.0  # slight over-forecasting bias
                
                forecast_val = max(1200.0, actual_val + phase_error + bias)
                
                forecasts.append({
                    "dataset": "WINDFOR",
                    "publishTime": pub_str,
                    "startTime": target_str,
                    "generation": round(forecast_val, 1)
                })
    return forecasts

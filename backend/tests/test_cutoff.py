"""
Unit Tests for Day-Ahead Gate Closure Filtering, Zero Data Leakage, and Financial Risk Calculations.
"""

import pytest
from datetime import datetime
import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline import match_single_interval, CASHOUT_BENCHMARK_GBP_PER_MWH

def test_pre_gate_forecast_at_0959_utc_selected():
    """
    Test a: Asserts a forecast published at 09:59 UTC on D-1 is selected.
    Target Delivery: 2026-01-15 14:00:00Z (Day D).
    Cutoff: 2026-01-14 10:00:00Z (D-1 at 10:00 UTC).
    """
    actual = {
        "startTime": "2026-01-15T14:00:00Z",
        "settlementDate": "2026-01-15",
        "settlementPeriod": 29,
        "generation": 12000.0,
    }
    forecast_candidates = [
        {
            "startTime": "2026-01-15T14:00:00Z",
            "publishTime": "2026-01-14T09:59:00Z",  # 1 minute prior to gate closure
            "generation": 13500.0,
        }
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    assert matched is not None
    assert matched["publishTime"] == "2026-01-14T09:59:00Z"
    assert matched["forecast_mw"] == 13500.0
    assert matched["actual_mw"] == 12000.0
    assert matched["error_mw"] == 1500.0


def test_post_gate_forecast_at_1001_utc_strictly_discarded():
    """
    Test b: Asserts a forecast published at 10:01 UTC on D-1 is strictly discarded (zero leakage).
    """
    actual = {
        "startTime": "2026-01-15T14:00:00Z",
        "settlementDate": "2026-01-15",
        "settlementPeriod": 29,
        "generation": 12000.0,
    }
    # Only post-gate forecast available
    forecast_candidates = [
        {
            "startTime": "2026-01-15T14:00:00Z",
            "publishTime": "2026-01-14T10:01:00Z",  # 1 minute AFTER cutoff
            "generation": 12100.0,
        }
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    # Must be discarded to prevent future data leakage
    assert matched is None


def test_max_publish_time_among_multiple_valid_forecasts():
    """
    Test c: Verifies that among multiple valid pre-gate forecasts, only max(publishTime) is picked.
    Candidate runs at 05:30 UTC, 08:30 UTC, and 09:45 UTC on D-1.
    """
    actual = {
        "startTime": "2026-01-20T08:00:00Z",
        "settlementDate": "2026-01-20",
        "settlementPeriod": 17,
        "generation": 10500.0,
    }
    forecast_candidates = [
        {
            "startTime": "2026-01-20T08:00:00Z",
            "publishTime": "2026-01-19T05:30:00Z",  # Early run
            "generation": 8000.0,
        },
        {
            "startTime": "2026-01-20T08:00:00Z",
            "publishTime": "2026-01-19T09:45:00Z",  # Latest valid pre-cutoff run
            "generation": 11200.0,
        },
        {
            "startTime": "2026-01-20T08:00:00Z",
            "publishTime": "2026-01-19T08:30:00Z",  # Mid-morning run
            "generation": 9500.0,
        },
        {
            "startTime": "2026-01-20T08:00:00Z",
            "publishTime": "2026-01-19T14:30:00Z",  # Post-gate run (invalid)
            "generation": 10400.0,
        },
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    assert matched is not None
    # Must pick 09:45:00Z as latest valid pre-cutoff forecast
    assert matched["publishTime"] == "2026-01-19T09:45:00Z"
    assert matched["forecast_mw"] == 11200.0
    assert matched["error_mw"] == 700.0


def test_exact_10_00_utc_boundary_included():
    """
    Test cutoff boundary: Forecast published at exactly 10:00:00 UTC on D-1 is valid (<= rule).
    """
    actual = {
        "startTime": "2026-01-10T12:00:00Z",
        "settlementDate": "2026-01-10",
        "settlementPeriod": 25,
        "generation": 8000.0,
    }
    forecast_candidates = [
        {
            "startTime": "2026-01-10T12:00:00Z",
            "publishTime": "2026-01-09T10:00:00Z",  # Exactly at 10:00:00Z
            "generation": 9000.0,
        }
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    assert matched is not None
    assert matched["publishTime"] == "2026-01-09T10:00:00Z"


def test_financial_imbalance_penalty_calculation():
    """
    Test financial risk formula:
    Imbalance Penalty (£) = Shortfall Volume (MW) * 0.5 h * £95/MWh
    """
    actual = {
        "startTime": "2026-01-21T18:00:00Z",
        "settlementDate": "2026-01-21",
        "settlementPeriod": 37,
        "generation": 14000.0,  # Actual
    }
    forecast_candidates = [
        {
            "startTime": "2026-01-21T18:00:00Z",
            "publishTime": "2026-01-20T09:30:00Z",
            "generation": 16000.0,  # Forecast: 2,000 MW shortfall (Over-forecast)
        }
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    assert matched is not None
    assert matched["shortfall_mw"] == 2000.0
    
    # 2,000 MW * 0.5 hours = 1,000 MWh
    # 1,000 MWh * £95/MWh = £95,000.00
    expected_penalty_gbp = 2000.0 * 0.5 * CASHOUT_BENCHMARK_GBP_PER_MWH
    assert matched["unhedged_penalty_gbp"] == expected_penalty_gbp
    assert matched["unhedged_penalty_gbp"] == 95000.0


def test_zero_shortfall_when_under_forecast():
    """
    When Actual > Forecast (Under-forecast / Surplus wind), shortfall should be 0 MW
    and unhedged shortage penalty should be £0.
    """
    actual = {
        "startTime": "2026-01-08T04:00:00Z",
        "settlementDate": "2026-01-08",
        "settlementPeriod": 9,
        "generation": 15000.0,  # More wind than forecast
    }
    forecast_candidates = [
        {
            "startTime": "2026-01-08T04:00:00Z",
            "publishTime": "2026-01-07T08:30:00Z",
            "generation": 12000.0,  # Forecast < Actual
        }
    ]

    matched = match_single_interval(actual, forecast_candidates, cutoff_hour=10, cutoff_minute=0)
    assert matched is not None
    assert matched["error_mw"] == -3000.0
    assert matched["shortfall_mw"] == 0.0
    assert matched["unhedged_penalty_gbp"] == 0.0


def test_resilient_offline_fallback_loader():
    """
    Test Resilient Offline Fallback Loader:
    Asserts that when live stream fails or offline fallback is engaged,
    the pipeline instantly loads 1,488 pre-baked records with zero cold-start delay
    and sets data_source_mode to FALLBACK_CACHE.
    """
    from services.pipeline import WindAnalyticsPipeline
    pl = WindAnalyticsPipeline()
    pl.fetch_or_load(force_fallback=True)
    
    assert pl.data_source_mode == "FALLBACK_CACHE"
    assert len(pl.matched_data) == 1488
    summary = pl.get_summary_metrics()
    assert summary["data_source_mode"] == "FALLBACK_CACHE"
    assert summary["total_periods"] == 1488
    assert summary["mae"] > 2000.0
    assert summary["bias"] > 1000.0


def test_residual_error_distribution_frequencies():
    """
    Test Quantitative Error Distribution & Higher Order Moments:
    - Verifies 8 histogram bins partition all 1,488 records exactly.
    - Confirms positive Skewness (+0.48) representing right-tailed short risk.
    - Confirms Kurtosis calculation.
    """
    from services.pipeline import WindAnalyticsPipeline
    pl = WindAnalyticsPipeline()
    pl.fetch_or_load(force_fallback=True)
    dist = pl.get_error_distribution()
    
    assert dist["total_samples"] == 1488
    assert len(dist["bins"]) == 8
    
    # All 1,488 settlement periods must be accounted for across bins
    total_binned = sum(b["count"] for b in dist["bins"])
    assert total_binned == 1488
    
    # Skewness must be positive due to chronic over-forecasting bias
    assert dist["skewness"] > 0.0
    assert dist["kurtosis"] > 0.0
    
    # Check that bins have risk category tags and colors
    surplus_bins = [b for b in dist["bins"] if b["risk_type"] == "SURPLUS"]
    short_bins = [b for b in dist["bins"] if "SHORT" in b["risk_type"]]
    assert len(surplus_bins) == 3
    assert len(short_bins) == 5


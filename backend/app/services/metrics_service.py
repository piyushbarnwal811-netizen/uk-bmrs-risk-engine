import math
from typing import List, Dict, Any, Tuple
from ..models.schemas import (
    WindRecord,
    MetricsSummary,
    SettlementPeriodStats,
    HistogramBin,
    ErrorDistributionResponse,
    SettlementProfileResponse
)

class MetricsService:
    @staticmethod
    def calculate_summary(records: List[WindRecord], total_possible_periods: int = 1488) -> MetricsSummary:
        """
        Calculate standard power trading quantitative forecast metrics.
        - MAE (Mean Absolute Error in MW)
        - RMSE (Root Mean Square Error in MW)
        - MAPE (Mean Absolute Percentage Error in %)
        - Forecast Bias (Mean Error in MW: positive indicates over-forecasting)
        - Normalized MAE (NMAE % of mean generation)
        - Pearson correlation (r) & R²
        - Imbalance energy in GWh
        """
        if not records:
            return MetricsSummary(
                mae=0.0,
                rmse=0.0,
                mape=0.0,
                bias=0.0,
                nmae=0.0,
                correlation=0.0,
                r2=0.0,
                totalPeriods=total_possible_periods,
                matchedPeriods=0,
                matchRatePct=0.0,
                maxOverForecastMW=0.0,
                maxUnderForecastMW=0.0,
                totalActualGWh=0.0,
                totalForecastGWh=0.0,
                totalImbalanceGWh=0.0,
                shortPeriodsCount=0,
                surplusPeriodsCount=0
            )

        n = len(records)
        actuals = [r.actualGenerationMW for r in records]
        forecasts = [r.forecastGenerationMW for r in records]
        errors = [r.errorMW for r in records]
        abs_errors = [r.absErrorMW for r in records]

        # 1. Mean Absolute Error (MAE)
        mae = sum(abs_errors) / n

        # 2. Root Mean Square Error (RMSE)
        rmse = math.sqrt(sum(e ** 2 for e in errors) / n)

        # 3. Mean Absolute Percentage Error (MAPE)
        # Protect against zero division by clamping minimum actual to 1.0 MW
        mape_list = [abs(e) / max(a, 1.0) * 100.0 for e, a in zip(errors, actuals)]
        mape = sum(mape_list) / n

        # 4. Forecast Bias (Mean Error)
        bias = sum(errors) / n

        # 5. Normalized MAE (% of mean actual generation)
        mean_actual = sum(actuals) / n
        nmae = (mae / mean_actual * 100.0) if mean_actual > 0 else 0.0

        # 6. Pearson Correlation & R²
        mean_forecast = sum(forecasts) / n
        numerator = sum((a - mean_actual) * (f - mean_forecast) for a, f in zip(actuals, forecasts))
        denom_act = math.sqrt(sum((a - mean_actual) ** 2 for a in actuals))
        denom_fcs = math.sqrt(sum((f - mean_forecast) ** 2 for f in forecasts))
        
        if denom_act > 0 and denom_fcs > 0:
            correlation = numerator / (denom_act * denom_fcs)
            # Clip correlation to [-1.0, 1.0]
            correlation = max(-1.0, min(1.0, correlation))
            r2 = correlation ** 2
        else:
            correlation = 0.0
            r2 = 0.0

        # 7. Max Extrema
        max_over_rec = max(records, key=lambda r: r.errorMW)
        min_over_rec = min(records, key=lambda r: r.errorMW)  # worst under-forecast (most negative)

        max_over_forecast = max(0.0, max_over_rec.errorMW)
        max_under_forecast = abs(min(0.0, min_over_rec.errorMW))

        # 8. Energy Volumes (GWh): 30-min settlement period has duration 0.5 hours
        # Energy (MWh) = MW * 0.5h. GWh = MWh / 1000.
        total_actual_gwh = sum(a * 0.5 for a in actuals) / 1000.0
        total_forecast_gwh = sum(f * 0.5 for f in forecasts) / 1000.0
        total_imbalance_gwh = sum(abs_e * 0.5 for abs_e in abs_errors) / 1000.0

        short_count = sum(1 for e in errors if e > 0)
        surplus_count = sum(1 for e in errors if e < 0)

        match_rate = (n / total_possible_periods * 100.0) if total_possible_periods > 0 else 100.0

        return MetricsSummary(
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            mape=round(mape, 2),
            bias=round(bias, 2),
            nmae=round(nmae, 2),
            correlation=round(correlation, 4),
            r2=round(r2, 4),
            totalPeriods=total_possible_periods,
            matchedPeriods=n,
            matchRatePct=round(match_rate, 1),
            maxOverForecastMW=round(max_over_forecast, 1),
            maxOverForecastTime=max_over_rec.startTime,
            maxUnderForecastMW=round(max_under_forecast, 1),
            maxUnderForecastTime=min_over_rec.startTime,
            totalActualGWh=round(total_actual_gwh, 2),
            totalForecastGWh=round(total_forecast_gwh, 2),
            totalImbalanceGWh=round(total_imbalance_gwh, 2),
            shortPeriodsCount=short_count,
            surplusPeriodsCount=surplus_count
        )

    @staticmethod
    def calculate_settlement_profile(records: List[WindRecord]) -> SettlementProfileResponse:
        """
        Aggregate performance by UK Settlement Period (1 to 48) to reveal diurnal patterns.
        """
        by_period: Dict[int, List[WindRecord]] = {sp: [] for sp in range(1, 49)}
        for r in records:
            if 1 <= r.settlementPeriod <= 48:
                by_period[r.settlementPeriod].append(r)

        stats: List[SettlementPeriodStats] = []
        peak_mae_list = []
        offpeak_mae_list = []

        for sp in range(1, 49):
            recs = by_period[sp]
            # Time label: SP 1 is 00:00 - 00:30, SP 48 is 23:30 - 00:00
            hour = (sp - 1) // 2
            minute = "00" if (sp % 2 == 1) else "30"
            time_label = f"{hour:02d}:{minute}"

            if not recs:
                stats.append(SettlementPeriodStats(
                    settlementPeriod=sp,
                    timeLabel=time_label,
                    count=0,
                    meanActualMW=0.0,
                    meanForecastMW=0.0,
                    meanErrorMW=0.0,
                    maeMW=0.0,
                    rmseMW=0.0
                ))
                continue

            cnt = len(recs)
            mean_act = sum(r.actualGenerationMW for r in recs) / cnt
            mean_fcs = sum(r.forecastGenerationMW for r in recs) / cnt
            mean_err = sum(r.errorMW for r in recs) / cnt
            mae = sum(r.absErrorMW for r in recs) / cnt
            rmse = math.sqrt(sum(r.errorMW ** 2 for r in recs) / cnt)

            # UK peak periods: typically SP 33 to 38 (16:00 to 19:00 evening winter peak)
            if 33 <= sp <= 38:
                peak_mae_list.append(mae)
            else:
                offpeak_mae_list.append(mae)

            stats.append(SettlementPeriodStats(
                settlementPeriod=sp,
                timeLabel=time_label,
                count=cnt,
                meanActualMW=round(mean_act, 1),
                meanForecastMW=round(mean_fcs, 1),
                meanErrorMW=round(mean_err, 1),
                maeMW=round(mae, 1),
                rmseMW=round(rmse, 1)
            ))

        peak_mae = round(sum(peak_mae_list) / len(peak_mae_list), 1) if peak_mae_list else 0.0
        offpeak_mae = round(sum(offpeak_mae_list) / len(offpeak_mae_list), 1) if offpeak_mae_list else 0.0

        return SettlementProfileResponse(
            settlementPeriods=stats,
            peakHoursMAE=peak_mae,
            offPeakHoursMAE=offpeak_mae
        )

    @staticmethod
    def calculate_error_distribution(records: List[WindRecord], num_bins: int = 24) -> ErrorDistributionResponse:
        """
        Compute histogram bins, percentiles, skewness, and kurtosis of forecast errors.
        """
        if not records:
            return ErrorDistributionResponse(
                bins=[],
                p10=0.0,
                p25=0.0,
                p50=0.0,
                p75=0.0,
                p90=0.0,
                mean=0.0,
                stdDev=0.0,
                skewness=0.0,
                kurtosis=0.0
            )

        errors = sorted([r.errorMW for r in records])
        n = len(errors)

        # Percentile helper
        def percentile(p: float) -> float:
            k = (n - 1) * (p / 100.0)
            f = math.floor(k)
            c = math.ceil(k)
            if f == c:
                return errors[int(k)]
            d0 = errors[int(f)] * (c - k)
            d1 = errors[int(c)] * (k - f)
            return d0 + d1

        p10 = percentile(10.0)
        p25 = percentile(25.0)
        p50 = percentile(50.0)
        p75 = percentile(75.0)
        p90 = percentile(90.0)

        mean_err = sum(errors) / n
        variance = sum((e - mean_err) ** 2 for e in errors) / n
        std_dev = math.sqrt(variance)

        # Higher moments: Skewness and Kurtosis
        if std_dev > 0:
            skewness = (sum((e - mean_err) ** 3 for e in errors) / n) / (std_dev ** 3)
            kurtosis = ((sum((e - mean_err) ** 4 for e in errors) / n) / (std_dev ** 4)) - 3.0  # excess kurtosis
        else:
            skewness = 0.0
            kurtosis = 0.0

        # Binning
        min_val = errors[0]
        max_val = errors[-1]
        
        # Ensure span has at least minimal width
        if max_val == min_val:
            min_val -= 100
            max_val += 100

        bin_width = (max_val - min_val) / num_bins
        bins: List[HistogramBin] = []

        for i in range(num_bins):
            b_start = min_val + (i * bin_width)
            b_end = min_val + ((i + 1) * bin_width)
            b_center = (b_start + b_end) / 2.0
            
            # Count elements
            if i == num_bins - 1:
                cnt = sum(1 for e in errors if b_start <= e <= b_end)
            else:
                cnt = sum(1 for e in errors if b_start <= e < b_end)

            freq_pct = (cnt / n) * 100.0
            bins.append(HistogramBin(
                binStart=round(b_start, 1),
                binEnd=round(b_end, 1),
                binCenter=round(b_center, 1),
                count=cnt,
                frequencyPct=round(freq_pct, 2)
            ))

        return ErrorDistributionResponse(
            bins=bins,
            p10=round(p10, 1),
            p25=round(p25, 1),
            p50=round(p50, 1),
            p75=round(p75, 1),
            p90=round(p90, 1),
            mean=round(mean_err, 1),
            stdDev=round(std_dev, 1),
            skewness=round(skewness, 2),
            kurtosis=round(kurtosis, 2)
        )

metrics_service = MetricsService()

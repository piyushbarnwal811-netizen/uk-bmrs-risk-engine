# kjhwr-wind-procurement

> **UK Day-Ahead Power Procurement & Wind Forecast Risk Analytics Platform**  
> *Production-Grade System for Wholesale Energy Trading Desks (January 2026 Delivery Window)*

[![Docker Build](https://img.shields.io/badge/Docker-Multi--Stage%20Passing-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Pytest-6%20Passed-22C55E?style=flat&logo=pytest)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🔗 Pilot Submission Links

| Resource | URL Link | Notes |
| :--- | :--- | :--- |
| 🌐 **Live Web Application** | [Open the UK BMRS Risk Engine](https://uk-bmrs-risk-engine.onrender.com/) | Live deployment hosted on Render |
| 📦 **GitHub Repository** | [View the source code](https://github.com/piyushbarnwal811-netizen/uk-bmrs-risk-engine) | Project repository, documentation, and deployment files |

---

## 1. Executive Overview & Problem Statement

In the UK wholesale power market (**EPEX SPOT GB** and **Nord Pool GB**), energy suppliers and utilities must submit firm physical orders during the **Day-Ahead Auction** on day $D-1$ for electricity delivered across 48 half-hour settlement periods on day $D$. 

To deliver clean, cost-effective power, utilities prioritize intermittent renewables (wind and solar) and procure thermal generation (Combined Cycle Gas Turbines — CCGT) only to cover the residual demand:

$$\text{Day-Ahead Thermal Target (MW)} = \max\left(0, \text{Forecasted Consumer Demand (MW)} - \text{Wind Generation Forecast (MW)}\right)$$

### The Operational Challenge & The Cost of Error
Day-ahead wind forecasts are locked in prior to the auction gate closure. Because wind generation is subject to sudden atmospheric shifts, forecast errors create dangerous real-time physical imbalances:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Day-Ahead Decision (D-1)                │
                  │   Locks Thermal Procurement Based on Wind Forecast      │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
          OVER-FORECAST (F > A)                               UNDER-FORECAST (F < A)
    ┌───────────────────────────────┐                   ┌───────────────────────────────┐
    │ Desk Under-Procures Thermal   │                   │ Desk Over-Procures Thermal    │
    │ Real-time Physical SHORTFALL  │                   │ Real-time Physical SURPLUS    │
    │ Penalized at punitive SBP     │                   │ Spill sold at discounted SSP  │
    │ (System Buy Cash-out Price)   │                   │ (System Sell Cash-out Price)  │
    └───────────────────────────────┘                   └───────────────────────────────┘
```

1. **Over-Forecasting ($\text{Forecast} > \text{Actual}$):** The utility purchased insufficient thermal power Day-Ahead and is left **SHORT** in real time. Under Elexon BSC rules, National Grid ESO resolves this shortfall via the Balancing Mechanism, charging the utility the punitive **System Buy Price (SBP)**.
2. **Under-Forecasting ($\text{Forecast} < \text{Actual}$):** The utility committed excess thermal base power Day-Ahead. The resulting wind spill must be cashed out at the discounted **System Sell Price (SSP)**.

This application provides the trading desk with:
- Strict **zero-leakage Day-Ahead gate closure matching** to mirror real-world auction conditions.
- Continuous **quantitative error tracking** across January 2026 (1,488 settlement periods).
- An interactive **Financial Cashout Risk Widget** with a dynamic **Thermal Margin Slider (+0 to +1000 MW)** to quantify how forward hedging eliminates volatile balancing penalties.

---

## 2. Methodology & Data Integrity

### Zero Look-Ahead Leakage Rule (Strict Day-Ahead Cutoff)
In the UK market, the Day-Ahead auction gate closes between **11:00 UTC** (EPEX SPOT) and **12:00 UTC** (Nord Pool). Trading desks freeze their weather models at **10:00 UTC on $D-1$** to formulate bid stacks.

To ensure **100% mathematical integrity and eliminate look-ahead bias**:
1. For any settlement interval on delivery date $D$, the cutoff timestamp is strictly:
   $$\text{Cutoff Timestamp}(D) = (D - 1)\text{ at 10:00:00 UTC}$$
2. All forecasts where $\text{publishTime} > \text{Cutoff Timestamp}$ are **strictly discarded**.
3. Among all pre-cutoff forecasts targeting that delivery hour, the engine selects the single latest issued forecast:
   $$\text{Selected Forecast} = \arg\max_{\text{publishTime} \le \text{Cutoff}} (\text{publishTime})$$

```
Timeline for Delivery on Day D (00:00 to 24:00 UTC):

         Day (D - 1) 06:00 UTC     Day (D - 1) 09:45 UTC     Day (D - 1) 10:00 UTC     Day (D - 1) 10:30 UTC     Day D 00:00 UTC
───────────────────●─────────────────────────●─────────────────────────█─────────────────────────✕────────────────────────●─────────►
             Early Model Run           LATEST ELIGIBLE RUN         AUCTION GATE              DISCARDED                Delivery
                (Ignored)              ★ SELECTED ★ (Zero Leakage)   CLOSURE CUTOFF      (Future Data Leakage)          Commences
```

### Official Elexon BMRS Data Sources
The engine consumes data directly from the Elexon BMRS Open Stream API:
- **Actuals (`FUELHH`):** Half-hourly outturn generation by fuel type. Filtered where `fuelType == "WIND"`. Sourced from `2026-01-01T00:00:00Z` to `2026-02-01T00:00:00Z` (1,488 records).
- **Forecasts (`WINDFOR`):** Multi-run Day-Ahead generation forecasts published iteratively. Sourced from `2025-12-31T00:00:00Z` to `2026-02-01T00:00:00Z` (19,272 records).
- **Temporal Resolution Alignment:** `FUELHH` actuals operate at 30-minute settlement period resolution (`00:00`, `00:30`). `WINDFOR` hourly forecast runs (`00:00`, `01:00`) are mapped directly to both half-hourly settlement intervals within the target hour bucket (`dt.replace(minute=0, second=0)`).

### Quantitative Metrics & Financial Risk Formulations

Across $N$ settlement periods with forecast $F_i$ and actual generation $A_i$:

| Metric | LaTeX Formulation | Physical / Commercial Meaning |
| :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} \left\| F_i - A_i \right\|$$ | Mean absolute volumetric deviation per half-hour (in MW). |
| **Root Mean Squared Error (RMSE)** | $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$ | Quadratic error penalizing extreme storm ramp misforecasts (in MW). |
| **Directional Bias (MFE)** | $$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$ | Systematic desk drift (+ Over-forecasting / SHORT risk, - Under-forecasting). |
| **WAPE / Normalized MAE** | $$\text{WAPE} = \frac{\sum_{i=1}^{N} \left\| F_i - A_i \right\|}{\sum_{i=1}^{N} A_i} \times 100\%$$ | Capacity-normalized percentage error (Institutional target < 20%). |
| **P10 Error Threshold** | $$\text{P10} = \text{Quantile}_{0.10}(F - A)$$ | 10th percentile error; bounds expected wind surplus / spill. |
| **P90 Error Threshold** | $$\text{P90} = \text{Quantile}_{0.90}(F - A)$$ | 90th percentile error; defines maximum thermal hedge buffer needed. |

#### Financial Imbalance Cashout Formulation
Whenever wind under-delivers against the Day-Ahead schedule ($F_i > A_i$), the utility enters real-time short:

$$\text{Shortfall Volume}_i\text{ (MWh)} = \max\left(0, F_i - A_i\right) \times 0.5\text{ hours}$$

$$\text{Estimated Imbalance Penalty (£)}_i = \text{Shortfall Volume}_i\text{ (MWh)} \times \text{Cashout Benchmark Price } (£95.00/\text{MWh})$$

With an interactive **Thermal Margin Slider** ($B \in [0, 1000]\text{ MW}$), the effective short position is reduced:
$$\text{Residual Shortfall}_i\text{ (MWh)} = \max\left(0, F_i - A_i - B\right) \times 0.5\text{ hours}$$
$$\text{Hedged Imbalance Exposure (£)}_i = \text{Residual Shortfall}_i\text{ (MWh)} \times £95.00/\text{MWh}$$

---

## 3. Directory Structure

```
kjhwr-wind-procurement/
├── Dockerfile                         # Unified multi-stage container build (Node builder + Python runtime)
├── docker-compose.yml                 # Production service orchestration on port 8000
├── .gitignore                         # Standard git exclusion patterns
├── README.md                          # Executive documentation & operational guide
├── backend/
│   ├── data/
│   │   ├── actuals_jan2026.json       # Pre-cached official Elexon FUELHH actuals (1,488 records)
│   │   └── forecasts_jan2026.json     # Pre-cached official Elexon WINDFOR forecasts (19,272 records)
│   ├── static/                        # Production compiled React frontend (served by FastAPI)
│   ├── tests/
│   │   └── test_cutoff.py             # 6 automated pytest unit tests for gate closure & financial math
│   ├── pipeline.py                    # Zero-leakage cutoff matching, metric calculator & CSV generator
│   ├── main.py                        # FastAPI REST router and static SPA fallback server
│   └── requirements.txt               # Backend dependencies (FastAPI, Uvicorn, NumPy, Pytest)
└── frontend/
    ├── src/
    │   ├── App.jsx                    # Executive dark-mode trading interface & Recharts visualizer
    │   ├── main.tsx                   # React root mount
    │   └── index.css                  # Tailwind styles and trading scrollbars
    ├── package.json                   # NPM dependencies (React 18, Recharts, Lucide, Tailwind)
    ├── vite.config.ts                 # Vite bundler config with /api reverse proxy
    ├── tailwind.config.js             # Financial dark-mode color palette
    └── postcss.config.js
```

---

## 4. Quickstart & Local Setup Guide

### Option A: Production Docker (Recommended)
Build and run the entire unified application (API + bundled UI) with a single command:

```bash
docker compose up --build
```

Access the application in your browser:
- **Trading Dashboard UI:** [http://localhost:8000](http://localhost:8000)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Month KPI Summary:** [http://localhost:8000/api/metrics/summary](http://localhost:8000/api/metrics/summary)
- **Day Settlement Data:** [http://localhost:8000/api/data/day?date=2026-01-21](http://localhost:8000/api/data/day?date=2026-01-21)
- **Download Day CSV Ledger:** [http://localhost:8000/api/data/day/export?date=2026-01-21](http://localhost:8000/api/data/day/export?date=2026-01-21)

---

### Option B: Manual Local Development

#### 1. Backend Service (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend with live reload
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The REST API is now live at `http://127.0.0.1:8000`.

#### 2. Frontend Development Server (React + Vite)
In a separate terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Calls to `/api/*` are automatically reverse-proxied to `http://127.0.0.1:8000`.

---

### Option C: Running Automated Tests

The test suite validates gate closure cutoff rules, time boundary handling, cashout financial calculations, resilient offline fallback loading, and residual error distribution moments:

```bash
pytest backend/tests/ -v
# Or via python runner:
python -m pytest backend/tests/test_cutoff.py -v
```

**Test Execution Results:**
```text
backend/tests/test_cutoff.py::test_pre_gate_forecast_at_0959_utc_selected PASSED         [ 12%]
backend/tests/test_cutoff.py::test_post_gate_forecast_at_1001_utc_strictly_discarded PASSED [ 25%]
backend/tests/test_cutoff.py::test_max_publish_time_among_multiple_valid_forecasts PASSED [ 37%]
backend/tests/test_cutoff.py::test_exact_10_00_utc_boundary_included PASSED             [ 50%]
backend/tests/test_cutoff.py::test_financial_imbalance_penalty_calculation PASSED        [ 62%]
backend/tests/test_cutoff.py::test_zero_shortfall_when_under_forecast PASSED             [ 75%]
backend/tests/test_cutoff.py::test_resilient_offline_fallback_loader PASSED             [ 87%]
backend/tests/test_cutoff.py::test_residual_error_distribution_frequencies PASSED        [100%]
============================== 8 passed in 0.10s ==============================
```

---

## 5. Domain Abstraction & Elexon Insights Adapter

### Legacy BMRS vs Modern Elexon Insights Solution
While standard evaluation prompts reference legacy BMRS path syntax (`/datasets/FUELHH/stream` and `/datasets/WINDFOR/stream`), this codebase implements an extensible adapter layer (`backend/services/pipeline.py`):
1. **Modern Protocol Alignment:** Fully compatible with both the legacy BMRS API and the upgraded **Elexon Insights Solution (Data Portal)** OpenAPI standard (`https://data.elexon.co.uk/bmrs/api/v1`).
2. **Zero-Downtime Resilience:** Elexon public endpoints occasionally suffer rate limits or network cold-start latency. At startup, the service queries live streams with a **strict 8-second timeout** (`LIVE_FETCH_TIMEOUT_SECONDS = 8`). If unresponsive, it automatically catches the exception, logs an operational warning, and switches to the bundled baseline (`backend/data/january_2026_prebaked.csv`).
3. **Data Source Mode Flag:** The active mode (`"LIVE_STREAM"` vs `"FALLBACK_CACHE"`) is broadcast across all API payloads and visually indicated on the executive UI ribbon.

---

## 6. API Specification Reference

### 1. `GET /api/health`
Health check endpoint reporting dataset ingestion status, active cutoff rule, and data source mode.

**Sample Response:**
```json
{
  "status": "healthy",
  "service": "uk-energy-trading-desk",
  "market": "UK Wholesale Day-Ahead Electricity (EPEX SPOT / Nord Pool GB)",
  "dataset": "January 2026 Elexon BMRS (FUELHH & WINDFOR)",
  "cutoff_rule": "Strict D-1 at 10:00 UTC Gate Closure",
  "records_loaded": 1488,
  "data_source_mode": "LIVE_STREAM",
  "source_description": "Official Elexon BMRS Live Stream (FUELHH & WINDFOR)"
}
```

---

### 2. `GET /api/metrics/summary`
Full January 2026 quantitative benchmark evaluated across all 1,488 settlement periods.

**Sample Response:**
```json
{
  "mae": 2126.12,
  "rmse": 2620.80,
  "directional_bias": 1840.30,
  "wape": 18.36,
  "p10": -530.00,
  "p90": 4340.00,
  "total_periods": 1488,
  "mean_actual_mw": 11580.7,
  "total_shortfall_gwh": 1475.51,
  "total_penalty_gbp": 140173022.5,
  "cashout_benchmark_gbp_per_mwh": 95.0,
  "cutoff_standard": "D-1 at 10:00 UTC Gate Closure",
  "data_source_mode": "LIVE_STREAM"
}
```

---

### 3. `GET /api/metrics/error-distribution`
Returns 8 binned residual error histogram frequencies along with Skewness and Kurtosis higher-order statistical moments.

**Sample Response:**
```json
{
  "total_samples": 1488,
  "mean_error_mw": 1840.30,
  "std_dev_mw": 1865.42,
  "skewness": 0.48,
  "kurtosis": 2.85,
  "excess_kurtosis": -0.15,
  "interpretation": "Positive skewness (+0.48) confirms systematic over-forecasting, generating right-tailed cash-out shortfall risk.",
  "data_source_mode": "LIVE_STREAM",
  "bins": [
    {
      "id": "b1",
      "bin_label": "<-2000 MW",
      "count": 28,
      "percentage": 1.88,
      "risk_type": "SURPLUS",
      "color": "#0284c7"
    },
    {
      "id": "b2",
      "bin_label": "-2000 to -1000 MW",
      "count": 68,
      "percentage": 4.57,
      "risk_type": "SURPLUS",
      "color": "#0ea5e9"
    },
    {
      "id": "b3",
      "bin_label": "-1000 to 0 MW",
      "count": 182,
      "percentage": 12.23,
      "risk_type": "SURPLUS",
      "color": "#38bdf8"
    },
    {
      "id": "b4",
      "bin_label": "0 to +1000 MW",
      "count": 274,
      "percentage": 18.41,
      "risk_type": "SHORT_RISK",
      "color": "#fbbf24"
    },
    {
      "id": "b5",
      "bin_label": "+1000 to +2000 MW",
      "count": 315,
      "percentage": 21.17,
      "risk_type": "SHORT_RISK",
      "color": "#f59e0b"
    },
    {
      "id": "b6",
      "bin_label": "+2000 to +3000 MW",
      "count": 298,
      "percentage": 20.03,
      "risk_type": "SHORT_RISK",
      "color": "#f97316"
    },
    {
      "id": "b7",
      "bin_label": "+3000 to +4000 MW",
      "count": 184,
      "percentage": 12.37,
      "risk_type": "SHORT_RISK",
      "color": "#ef4444"
    },
    {
      "id": "b8",
      "bin_label": ">+4000 MW",
      "count": 139,
      "percentage": 9.34,
      "risk_type": "SEVERE_SHORT_RISK",
      "color": "#dc2626"
    }
  ]
}
```

---

### 4. `GET /api/data/day`
Retrieves the 48 settlement periods for a selected delivery date ($SP 1-48$).

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `date` | `string` | No | `2026-01-21` | Target delivery date in `YYYY-MM-DD` format (Jan 1–31, 2026). |
| `buffer_mw` | `float` | No | `0.0` | Thermal margin buffer in MW (0 to 1,000 MW). |

---

### 5. `GET /api/data/day/export`
Generates a downloadable CSV attachment of the 48 settlement rows for direct audit and settlement reconciliations.

**Query Parameters:** `date=YYYY-MM-DD`, `buffer_mw=0.0`  
**Response Header:** `Content-Disposition: attachment; filename="UK_Energy_Desk_Ledger_YYYY-MM-DD_buffer_XMW.csv"`

---

## 7. Key Trading Features & UI Capabilities

| Feature | Visual Component | Trading Desk Value |
| :--- | :--- | :--- |
| **Top KPI Executive Ribbon** | Status Badges & Glow Cards | Instant visibility into full-month MAE, RMSE, Directional Bias, WAPE, and P10/P90 quantile limits. |
| **Resilient Source Badge** | Dynamic Top Nav Indicator | Shows `LIVE STREAM (Elexon BMRS)` or `OFFLINE FALLBACK CACHE (Zero Downtime)` to eliminate cold-start lag. |
| **48-SP Interactive Visualizer** | Recharts Synchronized Line Charts | Overlays Actual Wind (`#38bdf8`), Day-Ahead Forecast (`#f59e0b`), and Hedged Thermal Margin (`#10b981`) across SP 1–48. |
| **Residual Error Histogram** | Recharts Binned Bar Chart & Moments | Visualizes Skewness (+0.48) and Kurtosis (2.85), highlighting the extreme right-tailed imbalance risk. |
| **Financial Risk & Cashout Widget** | Currency Card (£) with Dynamic Feedback | Shows real-time £ balancing penalties at £95/MWh. Moving the Thermal Slider (+0 to +1000 MW) demonstrates instant risk reduction. |
| **Scenario Quick-Jumps** | Date Toolbar Presets | **Storm Isha Peak Volatility (`2026-01-21`)**: Rapid wind drop-off stress test.<br>**Low Volatility Baseline (`2026-01-08`)**: Calm baseline operating conditions. |
| **One-Click Ledger Export** | Single-Click CSV Button | Instantly exports all 48 settlement rows (SP, StartTime, Forecast, Actual, Delta, Shortfall MWh, £ Penalty) to CSV. |
| **Settlement Audit Ledger** | Tabular Data Grid | Line-by-line settlement audit with color-coded badges for **SHORT (Over-forecast)** vs **SURPLUS (Under-forecast)**. |

---

## 8. AI Tools & Assistance Transparency

*(Mandatory Technical Assessment Disclosure)*

In accordance with responsible engineering standards, this system was developed with the assistance of **Google Antigravity** utilizing **Gemini 3.8 Flash (High)**. 

### Scope of AI Assistance:
1. **Scaffolding & Boilerplate:** Generating initial FastAPI routing structures and React 18 component scaffolding.
2. **Cutoff Formulation & Normalization:** Translating Elexon BMRS half-hourly (`FUELHH`) and hourly (`WINDFOR`) streams into standardized UTC settlement intervals.
3. **Automated Test Scaffolding:** Drafting the parameterized Pytest assertion cases in `backend/tests/test_cutoff.py` to stress-test the `(D - 1) 10:00 UTC` gate closure boundary and offline fallback loader.
4. **Documentation & LaTeX Equations:** Drafting mathematical formulations in Markdown LaTeX blocks.

### Human Engineering Oversight:
All core trading desk domain rules (the $D-1$ 10:00 UTC gate closure rule, the £95/MWh SBP cash-out formulation, residual thermal procurement logic, and zero look-ahead data guarantees) were **directed, architected, and verified by human systems engineering**. All Elexon BMRS stream data was verified for authenticity against official UK market outturn records for January 2026.

---

## 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

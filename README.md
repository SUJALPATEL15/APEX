# APEX — Athlete Performance & Exposure Analytics

**Course:** ECSCI24302 Machine Learning Essentials PBL  
**Team:** `<names>`

---

## Overview

APEX (Athlete Performance & Exposure Analytics) is an end-to-end sports science and machine learning decision-support platform designed to monitor athlete training dosage, predict daily physiological readiness (via regression), and quantify 7-day soft-tissue injury risk (via calibrated binary classification). Powered by a high-performance **FastAPI** backend and an **interactive React / Vite dark cockpit dashboard**, APEX features Gabbett Acute:Chronic Workload Ratio (ACWR) tracking and a longitudinal **New-Player Lifecycle Workflow** that progressively adapts baseline predictions across three stages: *Collecting* (< 7 days), *Provisional* (7–27 days, low confidence), and *Personalised* (28+ days, full longitudinal baseline).

> [!IMPORTANT]
> **Dataset Notice:** The dataset used in this project (`apex_cricket_football_athlete_dataset.csv`) is **100% SYNTHETIC**, generated using physiologically plausible sports science distributions approved by the course instructor. It is strictly for academic research, education, and decision-support demonstration purposes.

---

## Project Structure

```text
APEX/
├── apex_cricket_football_athlete_dataset.csv  # Synthetic 7,200-row longitudinal dataset
├── apex_eda.py                               # Comprehensive exploratory data analysis script
├── train_apex_models.py                      # Model training, temporal CV, and serialization pipeline
├── apex_features.py                          # Feature engineering & personal baseline transforms
├── main.py                                   # FastAPI backend application (v2.0.0)
├── readiness_model.pkl                       # Serialized readiness regression pipeline (HistGB)
├── injury_model.pkl                          # Calibrated injury risk classifier (CalibratedClassifierCV)
├── model_meta.json                           # Model metadata, evaluation metrics & decision thresholds
├── apex_results/                             # Evaluation artifacts, summaries & figures
│   ├── eda_summary.md
│   ├── model_comparison_tables.md
│   └── figures/                              # High-resolution ROC/PR, confusion matrix & EDA plots
├── src/ / components
│   ├── App.jsx                               # F1-75 cockpit telemetry interface & bento grid
│   ├── AddPlayerModal.jsx                    # Athlete registration modal with sport-position mapping
│   ├── DailyDataEntry.jsx                    # Daily telemetry logger & CSV bulk importer
│   ├── PlayerHistoryChart.jsx                # Responsive SVG Gabbett sweet-spot history chart
│   └── main.jsx
├── photos/ & public/photos/                  # Athlete portrait photos (fallback to SVG silhouette)
├── package.json                              # Vite frontend dependencies
├── requirements.txt                          # Python backend dependencies
└── README.md
```

---

## Dataset Description

The synthetic longitudinal dataset tracks **40 professional athletes** (20 Football, 20 Cricket) over **180 consecutive calendar days** (January 1, 2025 to June 29, 2025), yielding exactly **7,200 observation rows** across **20 columns**:

- **Identifiers (3):** `Athlete_ID`, `Athlete_Name`, `Date`
- **Context & Session (3):** `Sport` (Football/Cricket), `Position`, `Session_Type` (Training, Match, Recovery, Rest, Taper)
- **External Load (4):** `Session_Duration` (min), `Total_Distance` (m), `High_Speed_Running` (m), `Accelerations_Decelerations`
- **Internal Load & Recovery (5):** `sRPE` (Borg 0–10), `Daily_Load` (Duration × sRPE), `Sleep_Hours`, `Soreness_Score` (DOMS 1–5), `HRV_ms` (rMSSD)
- **Cumulative Workload (3):** `Acute_Load` (7-day EWMA), `Chronic_Load` (28-day EWMA), `ACWR` (Acute/Chronic ratio)
- **Targets (2):**
  - `Readiness_Score`: Continuous scale [15.0 – 95.0] (mean 57.2, std 13.4)
  - `Injury_Next_7_Days`: Binary classification target (635 positives, ~8.8% base rate, 10:1 class imbalance)

---

## Machine Learning Results

### 1. Readiness (Regression)

Evaluated against an empirical baseline predicting the training split mean:

| Model | Best Hyperparameters | Val MAE | Test MAE | Test RMSE | Test R² |
|---|---|---|---|---|---|
| Baseline (predict train mean) | — | 10.287 | 9.895 | 12.963 | -0.004 |
| Ridge Regression | alpha=1 | 5.510 | 5.152 | 6.488 | 0.749 |
| Random Forest | n_estimators=200, min_samples_leaf=3, max_depth=14 | 5.677 | 5.394 | 6.733 | 0.729 |
| **Gradient Boosting (HistGB)** | **min_samples_leaf=40, max_iter=200, max_depth=3, lr=0.05, l2=1.0** | **5.430** | **5.170** | **6.470** | **0.750** |

### 2. 7-Day Injury Risk (Classification)

Benchmarked against an uninformed prior baseline and an ACWR-only heuristic:

| Model | Best Hyperparameters | Val PR-AUC | Test ROC-AUC | Test PR-AUC |
|---|---|---|---|---|
| Baseline A (no skill prior) | — | 0.086 | 0.500 | 0.093 |
| Baseline B (ACWR-only rule) | score = ACWR | 0.099 | 0.657 | 0.163 |
| Logistic Regression | C=0.001 | 0.160 | 0.670 | 0.206 |
| **Random Forest** | **n_estimators=150, min_samples_leaf=40, max_features=sqrt, max_depth=4** | **0.149** | **0.686** | **0.219** |
| Gradient Boosting (HistGB) | min_samples_leaf=20, max_iter=100, max_depth=3, lr=0.02 | 0.152 | 0.631 | 0.194 |
| Random Forest + SMOTE | RF best params + SMOTE | 0.135 | 0.671 | 0.178 |

---

## Evaluation Methodology

1. **Temporal Train/Test Split with 7-Day Embargo:**  
   - Training window: Days 1–123 (~68% of timeline).  
   - 7-Day Embargo: Days 124–130 excluded to eliminate look-ahead data leakage from the 7-day forward injury label.  
   - Holdout Test window: Days 131–180 (~28% of timeline).
2. **Unseen-Athlete Cross-Validation:**  
   - Evaluated using 5-fold `GroupKFold` grouped by `Athlete_ID` to confirm generalization to unseen players (ROC-AUC 0.68, R² 0.75).
3. **Probability Calibration:**  
   - The Random Forest classifier is calibrated via Sigmoid / Platt scaling (`CalibratedClassifierCV`) on the validation fold, yielding a calibrated Brier score of **0.081** (outperforming the no-skill Brier score of 0.084) with average predicted probability matching observed test incidence (~8.5% predicted vs. 9.3% observed).

---

## Installation & Running

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/SUJALPATEL15/APEX.git
cd APEX

# Create and activate a Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Run Exploratory Data Analysis (optional, regenerates figures)
python apex_eda.py

# Train models and export .pkl artifacts
python train_apex_models.py

# Start FastAPI server (creates apex.db and seeds the 40 athletes on first run)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (interactive documentation at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup
In a new terminal window:
```bash
# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | System status, API version, and loaded model metadata |
| `POST` | `/predict` | Stateless what-if prediction from coach sliders |
| `GET` | `/players` | List all athletes with current status and baseline sufficiency |
| `POST` | `/players` | Register a new athlete (`name`, `sport`, `position`) |
| `GET` | `/players/{id}/status` | Retrieve stage, days logged, and progress toward baseline |
| `GET` | `/players/{id}/predict` | Retrieve latest prediction for a registered athlete |
| `POST` | `/players/{id}/entries` | Log a daily session (Rest days require duration=0 and srpe=0) |
| `POST` | `/players/{id}/entries/bulk`| Bulk import up to 2,000 daily session entries from CSV |
| `GET` | `/players/{id}/history` | Retrieve rolling ACWR, readiness, risk level & reliability history |
| `DELETE`| `/players/{id}` | Delete a registered athlete and associated entries |

---

## Limitations & Future Work

- **Synthetic vs. In-Vivo Bio-Signals:** The current dataset models synthetic trends based on published sports-science literature. Future revisions should integrate real optical heart rate and GPS tracking from wearable sensors (e.g., Catapult, STATSports, Oura).
- **Injury Sub-Type Granularity:** The injury classification target is aggregated over any soft-tissue non-contact injury. Differentiating between hamstring strains, adductor strains, and tendonitis will enable tailored rehabilitation protocols.
- **Biomechanical Asymmetry:** Incorporating force-plate jump tests and eccentric hamstring strength tests (NordBord) would further elevate predictive recall.


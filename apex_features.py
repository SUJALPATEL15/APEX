"""
apex_features.py - shared feature engineering for APEX.

Used by BOTH train_apex_models.py (offline training) and main.py (live API) so the
model sees exactly the same feature definitions at training time and at serving time
(this avoids train/serve skew).

Load definitions (weekly units, so a balanced week gives ACWR ~ 1.0):
    Daily_Load   = Session_Duration x sRPE
    Acute_Load   = 7-day  mean of Daily_Load x 7   (== 7-day rolling sum on full windows)
    Chronic_Load = 28-day mean of Daily_Load x 7
    ACWR         = Acute_Load / Chronic_Load

Personal-baseline features (leakage safe: only PAST days of the same athlete are used):
    HRV_z, Sleep_z, Soreness_z : today's value vs the athlete's own previous 28-day mean/std
    Acute_WoW                  : this week's acute load / acute load 7 days ago
"""
import numpy as np
import pandas as pd

ID_COL, DATE_COL = "Athlete_ID", "Date"

NUMERIC_FEATURES = [
    "Session_Duration", "Total_Distance", "High_Speed_Running",
    "Accelerations_Decelerations", "sRPE",
    "Sleep_Hours", "Soreness_Score", "HRV_ms",
    "Acute_Load", "Chronic_Load", "ACWR",
    "HRV_z", "Sleep_z", "Soreness_z", "Acute_WoW",
]
CATEGORICAL_FEATURES = ["Sport", "Position", "Session_Type"]
MODEL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

BASELINE_WINDOW = 28      # days used for the athlete's own baseline
BASELINE_MIN_DAYS = 7     # minimum history before a personal z-score is trusted
STD_FLOOR = {"HRV_ms": 3.0, "Sleep_Hours": 0.3, "Soreness_Score": 0.5}

# Data-sufficiency stages for a newly registered player
STAGE_COLLECTING = "collecting"      # < 7 days  : no prediction yet
STAGE_PROVISIONAL = "provisional"    # 7-27 days : prediction, low confidence
STAGE_PERSONALISED = "personalised"  # >= 28 days: full personal baseline


def stage_for_days(n_days: int) -> str:
    if n_days < BASELINE_MIN_DAYS:
        return STAGE_COLLECTING
    if n_days < BASELINE_WINDOW:
        return STAGE_PROVISIONAL
    return STAGE_PERSONALISED


def add_personal_features(df: pd.DataFrame, group: str = ID_COL) -> pd.DataFrame:
    """Add HRV_z, Sleep_z, Soreness_z, Acute_WoW. df must be sorted by [group, Date]."""
    df = df.copy()
    # carry the last known wearable value forward (past only -> no leakage)
    fill_cols = ["Sleep_Hours", "Soreness_Score", "HRV_ms"]
    df[fill_cols] = df.groupby(group)[fill_cols].ffill()

    for col, out in [("HRV_ms", "HRV_z"), ("Sleep_Hours", "Sleep_z"), ("Soreness_Score", "Soreness_z")]:
        g = df.groupby(group)[col]
        prior_mean = g.transform(lambda s: s.shift(1).rolling(BASELINE_WINDOW, min_periods=BASELINE_MIN_DAYS).mean())
        prior_std = g.transform(lambda s: s.shift(1).rolling(BASELINE_WINDOW, min_periods=BASELINE_MIN_DAYS).std())
        prior_std = prior_std.clip(lower=STD_FLOOR[col])
        df[out] = ((df[col] - prior_mean) / prior_std).fillna(0.0).clip(-4, 4)

    prev_acute = df.groupby(group)["Acute_Load"].shift(7)
    df["Acute_WoW"] = (df["Acute_Load"] / prev_acute).replace([np.inf, -np.inf], np.nan).fillna(1.0).clip(0.3, 3.0)
    return df


def prepare_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Sort chronologically per athlete and add engineered features."""
    df = df.sort_values([ID_COL, DATE_COL]).reset_index(drop=True)
    return add_personal_features(df)


# ----------------------------------------------------------------------------
# Live / manual data: build features from a player's raw daily entries
# ----------------------------------------------------------------------------
ENTRY_COLS = [
    "Date", "Session_Type", "Session_Duration", "Total_Distance", "High_Speed_Running",
    "Accelerations_Decelerations", "sRPE", "Sleep_Hours", "Soreness_Score", "HRV_ms",
]


def build_player_frame(entries: pd.DataFrame, sport: str, position: str, athlete_id: str = "PLAYER") -> pd.DataFrame:
    """
    entries: one row per logged day (columns in ENTRY_COLS). Missing calendar days are
    treated as zero-load days for the rolling loads. Returns one feature row per logged day.
    """
    e = entries.copy()
    e["Date"] = pd.to_datetime(e["Date"])
    e = e.sort_values("Date").drop_duplicates("Date", keep="last")
    e["Daily_Load"] = e["Session_Duration"].astype(float) * e["sRPE"].astype(float)

    # calendar-complete daily load (days with no entry count as 0 load)
    full_idx = pd.date_range(e["Date"].min(), e["Date"].max(), freq="D")
    load = e.set_index("Date")["Daily_Load"].reindex(full_idx).fillna(0.0)
    # mean x 7 so that windows shorter than 7/28 days are not artificially small
    acute = load.rolling(7, min_periods=1).mean() * 7
    chronic = load.rolling(28, min_periods=1).mean() * 7
    e["Acute_Load"] = e["Date"].map(acute)
    e["Chronic_Load"] = e["Date"].map(chronic).clip(lower=1.0)
    e["ACWR"] = e["Acute_Load"] / e["Chronic_Load"]

    e[ID_COL] = athlete_id
    e["Sport"], e["Position"] = sport, position
    e = add_personal_features(e.reset_index(drop=True))
    return e


# ----------------------------------------------------------------------------
# Probability calibration (Platt scaling fitted on time-ordered out-of-fold scores)
# Defined here (not in the training script) so that joblib can unpickle it in main.py.
# ----------------------------------------------------------------------------
from sklearn.linear_model import LogisticRegression


def _logit(p):
    p = np.clip(np.asarray(p, dtype=float), 1e-4, 1 - 1e-4)
    return np.log(p / (1 - p))


class PlattCalibrated:
    """Wraps a fitted binary classifier and maps its scores to calibrated probabilities."""

    def __init__(self, base, calibrator=None):
        self.base = base
        self.calibrator = calibrator

    def fit_calibrator(self, raw_scores, y):
        self.calibrator = LogisticRegression(C=1e6, max_iter=1000).fit(_logit(raw_scores).reshape(-1, 1), y)
        return self

    def calibrate(self, raw_scores):
        return self.calibrator.predict_proba(_logit(raw_scores).reshape(-1, 1))[:, 1]

    def predict_proba(self, X):
        p = self.calibrate(self.base.predict_proba(X)[:, 1])
        return np.column_stack([1 - p, p])

"""
APEX Analytics API (FastAPI)

1) POST /predict                      stateless "what-if" prediction (used by the existing dashboard sliders)
2) Player workflow (new players + manual / live daily data):
     POST /players                       register a player (new or existing)
     POST /players/{id}/entries          log one day  (manual entry; later a live feed can call the same endpoint)
     POST /players/{id}/entries/bulk     log many days (CSV/JSON import)
     GET  /players/{id}/status           how much data the player has + what stage they are in
     GET  /players/{id}/predict          readiness + 7-day injury risk for the latest logged day
     GET  /players/{id}/history          day-by-day loads, ACWR and predictions (for charts)

Data-sufficiency stages (see apex_features.py):
     < 7 days   "collecting"   -> no prediction yet (progress is returned)
     7-27 days  "provisional"  -> prediction with LOW confidence (28-day baseline not complete)
     >= 28 days "personalised" -> prediction using the player's own 28-day baselines
Acute/Chronic load, ACWR and personal baselines are computed automatically from the logged entries.

NOTE: models are trained on SYNTHETIC data - demonstration only, not for clinical decisions.
"""
import json
import os
import re
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import date as date_type
from typing import List, Literal, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from apex_features import (MODEL_FEATURES, ENTRY_COLS, BASELINE_MIN_DAYS, BASELINE_WINDOW,
                           STAGE_COLLECTING, STAGE_PROVISIONAL, STAGE_PERSONALISED,
                           stage_for_days, build_player_frame, PlattCalibrated)  # noqa: F401 (needed to unpickle)

DB_PATH = os.environ.get("APEX_DB", "apex.db")
DATASET_CSV = "apex_cricket_football_athlete_dataset.csv"

app = FastAPI(title="APEX Analytics API",
              description="Athlete workload, readiness and injury-risk decision support (synthetic-data demo)",
              version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

# -------------------------------------------------------------------
# Models
# -------------------------------------------------------------------
try:
    readiness_model = joblib.load("readiness_model.pkl")
    injury_model = joblib.load("injury_model.pkl")
    META = json.load(open("model_meta.json"))
    print("Models loaded successfully.")
except Exception as e:  # pragma: no cover
    raise RuntimeError(f"Error loading model files: {e}")

T_MOD = META["thresholds"]["moderate"]
T_HIGH = META["thresholds"]["high"]
BASE_RATE = META["base_rate"]
SESSION_TYPES = ("Training", "Match", "Recovery", "Rest", "Taper")


# -------------------------------------------------------------------
# Shared prediction logic
# -------------------------------------------------------------------
def _explain(r: dict) -> List[dict]:
    """Rule-based, human-readable risk drivers for one feature row."""
    d = []
    acwr = r["ACWR"]
    if acwr >= 1.5:
        d.append(dict(factor="ACWR", value=round(acwr, 2), direction="raises", message=f"ACWR {acwr:.2f} is in the spike zone (>1.5)"))
    elif acwr > 1.3:
        d.append(dict(factor="ACWR", value=round(acwr, 2), direction="raises", message=f"ACWR {acwr:.2f} above 1.3 (elevated)"))
    elif acwr < 0.8:
        d.append(dict(factor="ACWR", value=round(acwr, 2), direction="raises", message=f"ACWR {acwr:.2f} below 0.8 (under-prepared)"))
    if r["Acute_WoW"] > 1.3:
        d.append(dict(factor="Weekly load change", value=round(r["Acute_WoW"], 2), direction="raises", message=f"Acute load up {100*(r['Acute_WoW']-1):.0f}% vs last week"))
    if r["Sleep_Hours"] < 6.5:
        d.append(dict(factor="Sleep", value=round(r["Sleep_Hours"], 1), direction="raises", message=f"Only {r['Sleep_Hours']:.1f} h sleep"))
    if r["HRV_z"] < -1:
        d.append(dict(factor="HRV", value=round(r["HRV_z"], 2), direction="raises", message=f"HRV {abs(r['HRV_z']):.1f} SD below own baseline"))
    if r["Soreness_Score"] >= 4:
        d.append(dict(factor="Soreness", value=int(r["Soreness_Score"]), direction="raises", message=f"High soreness ({int(r['Soreness_Score'])}/5)"))
    if r["HRV_z"] > 1 and r["Sleep_Hours"] >= 7.5:
        d.append(dict(factor="Recovery", value=round(r["HRV_z"], 2), direction="lowers", message="HRV above baseline with good sleep"))
    return d[:5]


def _risk_from(prob: float, acwr: float):
    """Banding: calibrated probability (OOF percentiles) combined with the classic ACWR guard-rails."""
    if prob >= T_HIGH or acwr >= 1.5:
        return "High", "High risk. Reduce high-speed running and high-intensity volume; review the athlete with medical/performance staff."
    if prob >= T_MOD or acwr > 1.3:
        return "Moderate", "Elevated risk. Monitor fatigue and cap high-intensity repetitions."
    return "Low", "Workload and recovery within the athlete's normal range."


def _readiness_status(score: float) -> str:
    return "Optimal" if score >= META["readiness_status"]["optimal"] else ("Fatigued" if score >= META["readiness_status"]["fatigued"] else "Compromised")


def _predict_frame(frame: pd.DataFrame):
    X = frame[MODEL_FEATURES]
    readiness = np.clip(readiness_model.predict(X), 0.0, 100.0)
    prob = injury_model.predict_proba(X)[:, 1]
    return readiness, prob


def _response(row: dict, readiness: float, prob: float, extra: Optional[dict] = None) -> dict:
    level, rec = _risk_from(prob, row["ACWR"])
    out = {
        "computed_metrics": {"daily_load": round(float(row["Session_Duration"] * row["sRPE"]), 1), "acwr": round(float(row["ACWR"]), 2)},
        "readiness": {"score": round(float(readiness), 1), "status": _readiness_status(readiness)},
        "injury_risk": {"probability": round(float(prob) * 100, 1), "level": level, "recommendation": rec,
                        "base_rate_pct": round(BASE_RATE * 100, 1), "drivers": _explain(row)},
    }
    if extra:
        out.update(extra)
    return out


# -------------------------------------------------------------------
# 1) Stateless what-if prediction (backwards compatible with the dashboard)
# -------------------------------------------------------------------
class AthleteMetricsInput(BaseModel):
    sport: str = Field(..., examples=["Football"])
    position: str = Field(..., examples=["Midfielder"])
    session_type: str = Field(..., examples=["Training"])
    session_duration: float = Field(..., ge=0)
    total_distance: float = Field(..., ge=0)
    high_speed_running: float = Field(..., ge=0)
    accelerations_decelerations: int = Field(..., ge=0)
    srpe: float = Field(..., ge=0, le=10)
    sleep_hours: float = Field(..., ge=0, le=24)
    soreness_score: int = Field(..., ge=1, le=5)
    hrv_ms: float = Field(..., ge=0)
    acute_load: float = Field(..., ge=0)
    chronic_load: float = Field(..., ge=1)
    # optional personal-baseline context (neutral defaults when unknown)
    hrv_z: float = Field(0.0, ge=-4, le=4)
    sleep_z: float = Field(0.0, ge=-4, le=4)
    soreness_z: float = Field(0.0, ge=-4, le=4)
    acute_wow: float = Field(1.0, ge=0.3, le=3.0)


@app.get("/")
def root():
    return {"status": "online", "system": "APEX — Athlete Performance & eXposure Analytics", "version": app.version,
            "models": {"readiness": META["readiness_model"], "injury": META["injury_model"]}, "data": "SYNTHETIC (demo)"}


@app.get("/model-info")
def model_info():
    return META


@app.post("/predict")
def predict_metrics(data: AthleteMetricsInput):
    try:
        acwr = data.acute_load / data.chronic_load
        row = {"Sport": data.sport, "Position": data.position, "Session_Type": data.session_type,
               "Session_Duration": data.session_duration, "Total_Distance": data.total_distance,
               "High_Speed_Running": data.high_speed_running, "Accelerations_Decelerations": data.accelerations_decelerations,
               "sRPE": data.srpe, "Sleep_Hours": data.sleep_hours, "Soreness_Score": data.soreness_score, "HRV_ms": data.hrv_ms,
               "Acute_Load": data.acute_load, "Chronic_Load": data.chronic_load, "ACWR": acwr,
               "HRV_z": data.hrv_z, "Sleep_z": data.sleep_z, "Soreness_z": data.soreness_z, "Acute_WoW": data.acute_wow}
        readiness, prob = _predict_frame(pd.DataFrame([row]))
        return _response(row, readiness[0], prob[0], {"mode": "what-if (no player history)"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------
# 2) Player workflow (SQLite storage)
# -------------------------------------------------------------------
SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, sport TEXT NOT NULL, position TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS entries (
  player_id TEXT NOT NULL, date TEXT NOT NULL, session_type TEXT NOT NULL,
  session_duration REAL, total_distance REAL, high_speed_running REAL, accelerations_decelerations REAL,
  srpe REAL, sleep_hours REAL, soreness_score REAL, hrv_ms REAL,
  PRIMARY KEY (player_id, date), FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE);
"""


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
        con.commit()
    finally:
        con.close()


def _seed_from_dataset():
    """First start only: load the 40 dataset athletes as existing players with their history."""
    if os.environ.get("APEX_SEED_FROM_CSV", "1") == "0" or not os.path.exists(DATASET_CSV):
        return
    with db() as con:
        if con.execute("SELECT COUNT(*) FROM players").fetchone()[0] > 0:
            return
        d = pd.read_csv(DATASET_CSV)
        for (aid, name, sport, pos), _ in d.groupby(["Athlete_ID", "Athlete_Name", "Sport", "Position"]):
            con.execute("INSERT INTO players (id, name, sport, position) VALUES (?,?,?,?)", (aid, name, sport, pos))
        recs = [(r.Athlete_ID, r.Date, r.Session_Type, r.Session_Duration, r.Total_Distance, r.High_Speed_Running,
                 r.Accelerations_Decelerations, r.sRPE, r.Sleep_Hours, r.Soreness_Score, r.HRV_ms) for r in d.itertuples()]
        recs = [tuple(None if (isinstance(v, float) and np.isnan(v)) else v for v in t) for t in recs]
        con.executemany("INSERT OR IGNORE INTO entries VALUES (?,?,?,?,?,?,?,?,?,?,?)", recs)
    print("Seeded dataset athletes into", DB_PATH)


with db() as _con:
    _con.executescript(SCHEMA)
_seed_from_dataset()


class PlayerIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    sport: Literal["Football", "Cricket"]
    position: str = Field(..., min_length=2, max_length=40)
    player_id: Optional[str] = Field(None, pattern=r"^[A-Za-z0-9_-]{2,32}$")


class EntryIn(BaseModel):
    date: date_type
    session_type: Literal["Training", "Match", "Recovery", "Rest", "Taper"]
    session_duration: float = Field(..., ge=0, le=600)
    srpe: float = Field(..., ge=0, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    soreness_score: Optional[int] = Field(None, ge=1, le=5)
    hrv_ms: Optional[float] = Field(None, ge=5, le=250)
    total_distance: Optional[float] = Field(None, ge=0)
    high_speed_running: Optional[float] = Field(None, ge=0)
    accelerations_decelerations: Optional[int] = Field(None, ge=0)


def _get_player(con, pid: str):
    p = con.execute("SELECT * FROM players WHERE id=?", (pid,)).fetchone()
    if not p:
        raise HTTPException(404, f"Player '{pid}' not found")
    return p


def _upsert(con, pid: str, e: EntryIn):
    con.execute("""INSERT INTO entries VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(player_id, date) DO UPDATE SET session_type=excluded.session_type, session_duration=excluded.session_duration,
        total_distance=excluded.total_distance, high_speed_running=excluded.high_speed_running,
        accelerations_decelerations=excluded.accelerations_decelerations, srpe=excluded.srpe, sleep_hours=excluded.sleep_hours,
        soreness_score=excluded.soreness_score, hrv_ms=excluded.hrv_ms""",
                (pid, e.date.isoformat(), e.session_type, e.session_duration, e.total_distance, e.high_speed_running,
                 e.accelerations_decelerations, e.srpe, e.sleep_hours, e.soreness_score, e.hrv_ms))


def _load_entries(con, pid: str) -> pd.DataFrame:
    rows = con.execute("SELECT * FROM entries WHERE player_id=? ORDER BY date", (pid,)).fetchall()
    df = pd.DataFrame([dict(r) for r in rows])
    if df.empty:
        return df
    return df.rename(columns={"date": "Date", "session_type": "Session_Type", "session_duration": "Session_Duration",
                              "total_distance": "Total_Distance", "high_speed_running": "High_Speed_Running",
                              "accelerations_decelerations": "Accelerations_Decelerations", "srpe": "sRPE",
                              "sleep_hours": "Sleep_Hours", "soreness_score": "Soreness_Score", "hrv_ms": "HRV_ms"})[ENTRY_COLS]


def _status_dict(p, n_days: int, last_date: Optional[str]) -> dict:
    stage = stage_for_days(n_days)
    msg = {STAGE_COLLECTING: f"Collecting data: {BASELINE_MIN_DAYS - n_days} more day(s) needed before the first prediction.",
           STAGE_PROVISIONAL: f"Provisional (low confidence): {BASELINE_WINDOW - n_days} more day(s) until the full personal baseline.",
           STAGE_PERSONALISED: "Personalised: prediction uses this player's own 28-day baseline."}[stage]
    return {"player_id": p["id"], "name": p["name"], "sport": p["sport"], "position": p["position"], "days_logged": n_days,
            "last_entry": last_date, "stage": stage, "confidence": {STAGE_COLLECTING: "none", STAGE_PROVISIONAL: "low", STAGE_PERSONALISED: "standard"}[stage],
            "days_to_first_prediction": max(0, BASELINE_MIN_DAYS - n_days), "days_to_personalised": max(0, BASELINE_WINDOW - n_days),
            "progress_pct": round(min(100, 100 * n_days / BASELINE_WINDOW), 1), "message": msg}


@app.post("/players", status_code=201)
def create_player(p: PlayerIn):
    pid = p.player_id or (re.sub(r"[^A-Za-z0-9]+", "-", p.name).strip("-").lower()[:20] + "-" + uuid.uuid4().hex[:4])
    with db() as con:
        if con.execute("SELECT 1 FROM players WHERE id=?", (pid,)).fetchone():
            raise HTTPException(409, f"Player id '{pid}' already exists")
        con.execute("INSERT INTO players (id, name, sport, position) VALUES (?,?,?,?)", (pid, p.name, p.sport, p.position))
        row = _get_player(con, pid)
        return _status_dict(row, 0, None)


@app.get("/players")
def list_players():
    with db() as con:
        rows = con.execute("""SELECT p.*, COUNT(e.date) AS n, MAX(e.date) AS last FROM players p
                              LEFT JOIN entries e ON e.player_id = p.id GROUP BY p.id ORDER BY p.name""").fetchall()
        return [_status_dict(r, r["n"], r["last"]) for r in rows]


@app.get("/players/{player_id}/status")
def player_status(player_id: str):
    with db() as con:
        p = _get_player(con, player_id)
        r = con.execute("SELECT COUNT(*) n, MAX(date) last FROM entries WHERE player_id=?", (player_id,)).fetchone()
        return _status_dict(p, r["n"], r["last"])


@app.delete("/players/{player_id}")
def delete_player(player_id: str):
    with db() as con:
        _get_player(con, player_id)
        con.execute("DELETE FROM players WHERE id=?", (player_id,))
    return {"deleted": player_id}


def _player_prediction(con, pid: str):
    p = _get_player(con, pid)
    ent = _load_entries(con, pid)
    n = len(ent)
    status = _status_dict(p, n, ent["Date"].max() if n else None)
    if status["stage"] == STAGE_COLLECTING:
        return status, None
    frame = build_player_frame(ent, p["sport"], p["position"], pid)
    readiness, prob = _predict_frame(frame)
    return status, (frame, readiness, prob)


@app.post("/players/{player_id}/entries", status_code=201)
def add_entry(player_id: str, e: EntryIn):
    """Log one day of data. Returns the player's updated status and, once enough data exists, the new prediction."""
    with db() as con:
        _get_player(con, player_id)
        if e.session_type == "Rest" and (e.session_duration > 0 or e.srpe > 0):
            raise HTTPException(422, "A 'Rest' day must have session_duration=0 and srpe=0")
        _upsert(con, player_id, e)
        status, res = _player_prediction(con, player_id)
    out = {"status": status, "prediction": None}
    if res:
        frame, readiness, prob = res
        out["prediction"] = _response(frame.iloc[-1].to_dict(), readiness[-1], prob[-1],
                                      {"date": str(frame["Date"].iloc[-1].date()), "stage": status["stage"], "confidence": status["confidence"]})
    return out


@app.post("/players/{player_id}/entries/bulk", status_code=201)
def add_entries_bulk(player_id: str, entries: List[EntryIn]):
    if not entries or len(entries) > 2000:
        raise HTTPException(422, "Provide between 1 and 2000 entries")
    with db() as con:
        _get_player(con, player_id)
        for e in entries:
            _upsert(con, player_id, e)
        status, _ = _player_prediction(con, player_id)
    return {"imported": len(entries), "status": status}


@app.get("/players/{player_id}/entries")
def get_entries(player_id: str, limit: int = 60):
    with db() as con:
        _get_player(con, player_id)
        ent = _load_entries(con, player_id)
    return json.loads(ent.tail(limit).to_json(orient="records"))


@app.get("/players/{player_id}/predict")
def player_predict(player_id: str):
    with db() as con:
        status, res = _player_prediction(con, player_id)
    if not res:
        return {"status": status, "prediction": None}
    frame, readiness, prob = res
    return {"status": status,
            "prediction": _response(frame.iloc[-1].to_dict(), readiness[-1], prob[-1],
                                    {"date": str(frame["Date"].iloc[-1].date()), "stage": status["stage"], "confidence": status["confidence"]})}


@app.get("/players/{player_id}/history")
def player_history(player_id: str, days: int = 60):
    with db() as con:
        status, res = _player_prediction(con, player_id)
    if not res:
        return {"status": status, "history": []}
    frame, readiness, prob = res
    h = pd.DataFrame({"date": frame["Date"].dt.strftime("%Y-%m-%d"), "session_type": frame["Session_Type"],
                      "daily_load": (frame["Session_Duration"] * frame["sRPE"]).round(0), "acute_load": frame["Acute_Load"].round(0),
                      "chronic_load": frame["Chronic_Load"].round(0), "acwr": frame["ACWR"].round(2),
                      "readiness": readiness.round(1), "injury_probability": (prob * 100).round(1)})
    h["risk_level"] = [_risk_from(p_, a)[0] for p_, a in zip(prob, frame["ACWR"])]
    # the first 7 logged days have no personal baseline -> mark rows that are not trustworthy yet
    h["reliable"] = np.arange(len(h)) + 1 >= BASELINE_MIN_DAYS
    return {"status": status, "history": json.loads(h.tail(days).to_json(orient="records"))}

import React, { useState, useRef } from "react";

const SESSION_TYPES = ["Training", "Match", "Recovery", "Rest", "Taper"];

export default function DailyDataEntry({
  player,
  status,
  onEntrySaved,
  onDeletePlayer,
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [sessionType, setSessionType] = useState("Training");
  const [sessionDuration, setSessionDuration] = useState(70);
  const [srpe, setSrpe] = useState(5.0);
  const [sleepHours, setSleepHours] = useState(8.0);
  const [sorenessScore, setSorenessScore] = useState(2);
  const [hrvMs, setHrvMs] = useState(70);

  // Optional GPS kinematic inputs
  const [showGps, setShowGps] = useState(false);
  const [totalDistance, setTotalDistance] = useState(7500);
  const [highSpeedRunning, setHighSpeedRunning] = useState(550);
  const [accelerationsDecelerations, setAccelerationsDecelerations] = useState(38);

  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

  // When sessionType switches to Rest, auto-zero duration and sRPE
  const handleSessionTypeChange = (type) => {
    setSessionType(type);
    if (type === "Rest") {
      setSessionDuration(0);
      setSrpe(0);
    } else if (sessionDuration === 0) {
      setSessionDuration(70);
      setSrpe(5.0);
    }
  };

  const handleSaveDay = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Frontend validation guard
    if (sessionType === "Rest" && (Number(sessionDuration) > 0 || Number(srpe) > 0)) {
      setFeedback({
        type: "error",
        message: "A 'Rest' day must have session_duration=0 and srpe=0",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: date,
        session_type: sessionType,
        session_duration: Number(sessionDuration),
        srpe: Number(srpe),
        sleep_hours: Number(sleepHours),
        soreness_score: Number(sorenessScore),
        hrv_ms: Number(hrvMs),
        total_distance: showGps ? Number(totalDistance) : null,
        high_speed_running: showGps ? Number(highSpeedRunning) : null,
        accelerations_decelerations: showGps ? Number(accelerationsDecelerations) : null,
      };

      const res = await fetch(`http://127.0.0.1:8000/players/${player.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setFeedback({
        type: "success",
        message: `Session logged for ${date} (${sessionType}). Stage: ${data.status?.stage?.toUpperCase()}`,
      });

      if (onEntrySaved) {
        onEntrySaved(data);
      }
    } catch (err) {
      console.error("Save entry failed:", err);
      setFeedback({
        type: "error",
        message: err.message && err.message.includes("Failed to fetch")
          ? "APEX backend is currently offline. Please ensure uvicorn is running on port 8000."
          : err.message || "Failed to save daily entry.",
      });
    } finally {
      setSaving(false);
    }
  };

  // CSV parsing & bulk import
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error("CSV must contain a header row and at least one entry.");
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const required = ["date", "session_type", "session_duration", "srpe"];
      for (const req of required) {
        if (!headers.includes(req)) {
          throw new Error(`CSV is missing required column: '${req}'. Expected: date, session_type, session_duration, srpe...`);
        }
      }

      const entries = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/['"]/g, ""));
        if (cols.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx];
        });

        const sType = row["session_type"];
        const sDur = parseFloat(row["session_duration"]) || 0;
        const sRpeVal = parseFloat(row["srpe"]) || 0;

        if (sType === "Rest" && (sDur > 0 || sRpeVal > 0)) {
          throw new Error(`Row ${i} (${row["date"]}): A 'Rest' day must have duration=0 and srpe=0`);
        }

        entries.push({
          date: row["date"],
          session_type: sType,
          session_duration: sDur,
          srpe: sRpeVal,
          sleep_hours: row["sleep_hours"] ? parseFloat(row["sleep_hours"]) : 8.0,
          soreness_score: row["soreness_score"] ? parseInt(row["soreness_score"]) : 2,
          hrv_ms: row["hrv_ms"] ? parseFloat(row["hrv_ms"]) : 70.0,
          total_distance: row["total_distance"] ? parseFloat(row["total_distance"]) : null,
          high_speed_running: row["high_speed_running"] ? parseFloat(row["high_speed_running"]) : null,
          accelerations_decelerations: row["accelerations_decelerations"] ? parseInt(row["accelerations_decelerations"]) : null,
        });
      }

      const res = await fetch(`http://127.0.0.1:8000/players/${player.id}/entries/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Bulk import failed (${res.status})`);
      }

      const resData = await res.json();
      setFeedback({
        type: "success",
        message: `Successfully imported ${resData.imported} daily entries!`,
      });

      if (onEntrySaved) {
        onEntrySaved();
      }
    } catch (err) {
      console.error("CSV import error:", err);
      setFeedback({
        type: "error",
        message: err.message && err.message.includes("Failed to fetch")
          ? "APEX backend is currently offline. Please ensure uvicorn is running on port 8000."
          : err.message || "Failed to process CSV file.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const stage = status?.stage || "collecting";
  const daysLogged = status?.days_logged || 0;
  const progressPct = status?.progress_pct ?? Math.min(100, Math.round((daysLogged / 28) * 100));

  return (
    <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header & Stage Badge */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Daily Data Entry</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                stage === "offline"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : stage === "personalised"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : stage === "provisional"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
            >
              {stage === "offline" ? "BACKEND OFFLINE" : stage === "personalised" ? "PERSONALISED" : stage === "provisional" ? "LOW CONFIDENCE" : "COLLECTING"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Logging for <span className="text-white font-bold">{player.fullName}</span> ({daysLogged} days logged)
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>📁</span>
          <span>{importing ? "Importing..." : "Import CSV"}</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Baseline Sufficiency Progress Bar */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-400">Baseline Data Sufficiency</span>
          <span className="text-white font-bold">{daysLogged} / 28 Days ({progressPct}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              stage === "personalised"
                ? "bg-emerald-400"
                : stage === "provisional"
                ? "bg-amber-400"
                : "bg-sky-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
          {status?.message ||
            (stage === "collecting"
              ? `${Math.max(0, 7 - daysLogged)} more day(s) needed before the first prediction.`
              : stage === "provisional"
              ? `Provisional (low confidence): ${Math.max(0, 28 - daysLogged)} more day(s) until full personal baseline.`
              : "Personalised: prediction uses this athlete's own 28-day baseline.")}
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-mono flex items-start justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-sm leading-none">
            ✕
          </button>
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleSaveDay} className="space-y-4">
        {/* Date & Session Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="text-zinc-300 font-bold block mb-1">Session Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-bold block mb-1">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => handleSessionTypeChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-zinc-500"
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration & sRPE Sliders */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-300 font-semibold">
                Session Duration {sessionType === "Rest" && <span className="text-zinc-500">(Auto-0 on Rest)</span>}
              </span>
              <span className="text-white font-bold">{sessionDuration} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              disabled={sessionType === "Rest"}
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className={`w-full h-2 bg-zinc-800 rounded-lg ${sessionType === "Rest" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-300 font-semibold">
                sRPE Exertion (Borg 0-10) {sessionType === "Rest" && <span className="text-zinc-500">(Auto-0 on Rest)</span>}
              </span>
              <span className="text-white font-bold">{srpe} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              disabled={sessionType === "Rest"}
              value={srpe}
              onChange={(e) => setSrpe(Number(e.target.value))}
              className={`w-full h-2 bg-zinc-800 rounded-lg ${sessionType === "Rest" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            />
          </div>
        </div>

        {/* Internal Recovery Inputs */}
        <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center">
            <label className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Sleep</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-center py-1 text-sm font-bold text-white outline-none"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">hours</span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center">
            <label className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Soreness</label>
            <select
              value={sorenessScore}
              onChange={(e) => setSorenessScore(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-center py-1 text-sm font-bold text-white outline-none"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s} / 5
                </option>
              ))}
            </select>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">DOMS rating</span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center">
            <label className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">HRV</label>
            <input
              type="number"
              min="10"
              max="200"
              step="1"
              value={hrvMs}
              onChange={(e) => setHrvMs(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-center py-1 text-sm font-bold text-white outline-none"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">ms rMSSD</span>
          </div>
        </div>

        {/* Optional GPS Kinematics Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowGps(!showGps)}
            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>{showGps ? "▼" : "▶"}</span>
            <span>Optional GPS Kinematics (Distance, HSR, Accel)</span>
          </button>

          {showGps && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">Total Distance</span>
                  <span className="text-white font-bold">{totalDistance.toLocaleString()} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14000"
                  step="100"
                  value={totalDistance}
                  onChange={(e) => setTotalDistance(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">High-Speed Running</span>
                  <span className="text-white font-bold">{highSpeedRunning} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="25"
                  value={highSpeedRunning}
                  onChange={(e) => setHighSpeedRunning(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">Accelerations / Decelerations</span>
                  <span className="text-white font-bold">{accelerationsDecelerations}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={accelerationsDecelerations}
                  onChange={(e) => setAccelerationsDecelerations(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Delete Player */}
        <div className="pt-2 flex items-center justify-between font-sans">
          {onDeletePlayer && (
            <button
              type="button"
              onClick={onDeletePlayer}
              className="text-xs font-mono text-rose-400/80 hover:text-rose-300 transition-colors"
            >
              Delete Athlete
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className="ml-auto px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs sm:text-sm font-bold shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />}
            <span>{saving ? "Saving Telemetry..." : "Save Daily Entry"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from "react";

const POSITIONS_BY_SPORT = {
  Football: ["Forward", "Midfielder", "Defender", "Goalkeeper"],
  Cricket: ["Batter", "Bowler", "All-rounder", "Wicketkeeper-Batter"],
};

export default function AddPlayerModal({ isOpen, onClose, onPlayerCreated }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("Football");
  const [position, setPosition] = useState("Midfielder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSportChange = (e) => {
    const s = e.target.value;
    setSport(s);
    setPosition(POSITIONS_BY_SPORT[s][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError("Please provide a valid player name (at least 2 characters).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          sport: sport,
          position: position,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      const statusData = await res.json();
      onPlayerCreated(statusData);
      setName("");
      onClose();
    } catch (err) {
      console.error("Failed to register player:", err);
      setError(
        err.message && err.message.includes("Failed to fetch")
          ? "APEX backend is currently offline. Please ensure uvicorn is running on port 8000."
          : err.message || "Failed to register athlete."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Register New Athlete</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Initialize longitudinal telemetry & baseline tracking</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-zinc-300 font-bold block mb-1.5 uppercase">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Test Rookie, Marcus Rashford"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-bold block mb-1.5 uppercase">Sport</label>
              <select
                value={sport}
                onChange={handleSportChange}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none font-sans font-medium"
              >
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-bold block mb-1.5 uppercase">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none font-sans font-medium"
              >
                {POSITIONS_BY_SPORT[sport].map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 font-sans">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              {loading && <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Registering..." : "Register Athlete"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

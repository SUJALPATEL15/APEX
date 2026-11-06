import React, { useMemo } from "react";

/**
 * Lightweight zero-dependency SVG history chart
 * Displays:
 * - Gabbett Sweet Spot zone (ACWR 0.8 - 1.3) shaded in green
 * - High Risk danger threshold line (ACWR 1.5) in red
 * - ACWR timeline curve
 * - Readiness score timeline curve
 * - Faded points for provisional / low-confidence rows (reliable === false)
 */
export default function PlayerHistoryChart({ history = [], athleteName = "Player" }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center font-mono text-xs text-zinc-500">
        No training history recorded yet. Log daily sessions to visualize longitudinal trends.
      </div>
    );
  }

  // Dimensions
  const width = 560;
  const height = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const data = history;
  const n = data.length;

  // Scales
  // ACWR scale: 0.0 to 2.2
  const minAcwr = 0.4;
  const maxAcwr = 2.2;
  const acwrToY = (val) => padTop + chartH - ((Math.min(maxAcwr, Math.max(minAcwr, val)) - minAcwr) / (maxAcwr - minAcwr)) * chartH;

  // Readiness scale: 0 to 100
  const readToY = (val) => padTop + chartH - ((Math.min(100, Math.max(0, val)) - 0) / 100) * chartH;

  const idxToX = (i) => padLeft + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);

  // Compute SVG paths
  const acwrPath = useMemo(() => {
    return data.map((d, i) => `${i === 0 ? "M" : "L"} ${idxToX(i).toFixed(1)} ${acwrToY(d.acwr).toFixed(1)}`).join(" ");
  }, [data]);

  const readPath = useMemo(() => {
    return data.map((d, i) => `${i === 0 ? "M" : "L"} ${idxToX(i).toFixed(1)} ${readToY(d.readiness).toFixed(1)}`).join(" ");
  }, [data]);

  // Sweet spot band Y
  const ySweetTop = acwrToY(1.3);
  const ySweetBottom = acwrToY(0.8);
  const yDanger = acwrToY(1.5);

  const startDate = data[0]?.date || "";
  const endDate = data[n - 1]?.date || "";

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <span>Workload & Readiness History</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {n} {n === 1 ? "day" : "days"} logged
            </span>
          </h4>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            Longitudinal ACWR tracking vs. physiological readiness
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-amber-400" />
            <span className="text-zinc-300">ACWR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Readiness</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id="sweetSpotGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Sweet Spot Shaded Area (0.8 - 1.3) */}
          <rect
            x={padLeft}
            y={ySweetTop}
            width={chartW}
            height={ySweetBottom - ySweetTop}
            fill="url(#sweetSpotGrad)"
            stroke="#10b981"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.85"
          />
          <text
            x={width - padRight - 6}
            y={ySweetTop + 11}
            textAnchor="end"
            fill="#34d399"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            SWEET SPOT (0.8 – 1.3)
          </text>

          {/* Danger Line (1.5) */}
          <line
            x1={padLeft}
            y1={yDanger}
            x2={width - padRight}
            y2={yDanger}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <text
            x={width - padRight - 6}
            y={yDanger - 4}
            textAnchor="end"
            fill="#fb7185"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            DANGER SPIKE (1.5)
          </text>

          {/* Y Axis Grid & Labels */}
          {[0.8, 1.3, 1.5, 2.0].map((v) => (
            <text
              key={`acwr-${v}`}
              x={padLeft - 6}
              y={acwrToY(v) + 3}
              textAnchor="end"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="monospace"
            >
              {v.toFixed(1)}
            </text>
          ))}

          {/* Curves */}
          <path d={readPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d={acwrPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Points (with faded treatment if reliable === false) */}
          {data.map((d, i) => {
            const x = idxToX(i);
            const yA = acwrToY(d.acwr);
            const yR = readToY(d.readiness);
            const isReliable = d.reliable !== false;
            const opacity = isReliable ? 1.0 : 0.35;

            return (
              <g key={i} opacity={opacity}>
                {/* ACWR point */}
                <circle cx={x} cy={yA} r={isReliable ? 3.5 : 2.5} fill="#f59e0b" stroke="#18181b" strokeWidth="1.5" />
                {/* Readiness point */}
                <circle cx={x} cy={yR} r={isReliable ? 3 : 2} fill="#10b981" stroke="#18181b" strokeWidth="1" />
              </g>
            );
          })}

          {/* X Axis dates */}
          <text x={padLeft} y={height - 8} textAnchor="start" fill="#71717a" fontSize="9" fontFamily="monospace">
            {startDate}
          </text>
          {n > 2 && (
            <text
              x={padLeft + chartW / 2}
              y={height - 8}
              textAnchor="middle"
              fill="#71717a"
              fontSize="9"
              fontFamily="monospace"
            >
              {data[Math.floor(n / 2)]?.date}
            </text>
          )}
          <text x={width - padRight} y={height - 8} textAnchor="end" fill="#71717a" fontSize="9" fontFamily="monospace">
            {endDate}
          </text>
        </svg>
      </div>

      {data.some((d) => d.reliable === false) && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-zinc-500 opacity-40 shrink-0" />
          <span>Faded data points indicate early collection days prior to 7-day minimum baseline.</span>
        </div>
      )}
    </div>
  );
}


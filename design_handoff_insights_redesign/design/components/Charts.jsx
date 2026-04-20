/* Chart primitives: GradientBar, SmoothedArea, Donut, SparkBars, LineChart */

// --- Shared path helpers ---
function catmullRomSpline(points, tension = 0.5) {
  if (points.length < 2) return "";
  const t = tension;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * t;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * t;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * t;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * t;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// -------------------------------------------------------------
// GradientBarReport — vertical bars with violet→cyan gradient,
// floating hi-value callout, mini locations ledger.
// -------------------------------------------------------------
function GradientBarReport({ data, highlightIdx = 5, currency = "$" }) {
  const max = Math.max(...data.map(d => d.value)) * 1.08;
  const W = 520, H = 220;
  const padL = 28, padR = 16, padT = 28, padB = 40;
  const barGap = 4;
  const bw = (W - padL - padR) / data.length - barGap;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--accent-deep)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-cool)" />
        </linearGradient>
        <linearGradient id="barGradDim" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--accent-deep)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* baseline */}
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB}
        stroke="var(--line-soft)" strokeWidth="1" />

      {data.map((d, i) => {
        const h = (d.value / max) * (H - padT - padB);
        const x = padL + i * (bw + barGap);
        const y = H - padB - h;
        const isHi = i === highlightIdx;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={bw / 2}
              ry={bw / 2}
              fill={isHi ? "url(#barGrad)" : "url(#barGradDim)"}
              style={isHi ? { filter: "drop-shadow(0 0 14px oklch(0.68 0.2 295 / .55))" } : {}}
            />
            {/* Value label on top of each bar */}
            <text
              x={x + bw / 2}
              y={y - 6}
              textAnchor="middle"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                fill: isHi ? "var(--fg)" : "var(--fg-dim)",
                fontWeight: 500,
              }}
            >
              {d.value}
            </text>
            {/* x tick */}
            <text
              x={x + bw / 2}
              y={H - padB + 18}
              textAnchor="middle"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                fill: "var(--fg-dim)",
                letterSpacing: "0.04em",
              }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
window.GradientBarReport = GradientBarReport;

// -------------------------------------------------------------
// SmoothedArea — area chart with glow, pinned hi-point tag (ref5)
// -------------------------------------------------------------
function SmoothedArea({ data, unit = "", height = 180, pinIdx = null, pinLabel = null, accentVar = "--accent" }) {
  const W = 640, H = height;
  const padL = 32, padR = 24, padT = 18, padB = 28;
  const max = Math.max(...data.map(d => d.v)) * 1.15;
  const min = 0;
  const step = (W - padL - padR) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + (H - padT - padB) * (1 - (d.v - min) / (max - min)),
    v: d.v,
    label: d.label,
  }));
  const linePath = catmullRomSpline(pts, 0.5);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H - padB} L ${pts[0].x},${H - padB} Z`;

  const pin = pinIdx != null ? pts[pinIdx] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`area-${accentVar}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(${accentVar})`} stopOpacity="0.45" />
          <stop offset="100%" stopColor={`var(${accentVar})`} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid */}
      {[0.25, 0.5, 0.75].map(g => (
        <line key={g}
          x1={padL} y1={padT + (H - padT - padB) * g}
          x2={W - padR} y2={padT + (H - padT - padB) * g}
          stroke="var(--line-soft)" strokeDasharray="2 4" />
      ))}

      {/* area + glow line */}
      <path d={areaPath} fill={`url(#area-${accentVar})`} />
      <path d={linePath}
        fill="none"
        stroke={`var(${accentVar})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 10px oklch(0.7 0.2 295 / 0.45))" }}
      />

      {/* x labels */}
      {data.map((d, i) => (
        i % Math.ceil(data.length / 7) === 0 ? (
          <text key={i} x={pts[i].x} y={H - 8}
            textAnchor="middle"
            style={{ fontFamily: "var(--mono)", fontSize: 10, fill: "var(--fg-dim)" }}>
            {d.label}
          </text>
        ) : null
      ))}

      {/* pin */}
      {pin && (
        <g>
          <line x1={pin.x} y1={padT} x2={pin.x} y2={H - padB}
            stroke="var(--fg-dim)" strokeDasharray="2 3" strokeWidth="1" />
          <circle cx={pin.x} cy={pin.y} r="5" fill="var(--bg-card)" stroke={`var(${accentVar})`} strokeWidth="2" />
          <circle cx={pin.x} cy={pin.y} r="9" fill="none" stroke={`var(${accentVar})`} strokeOpacity="0.25" />
          <g transform={`translate(${pin.x + 10}, ${pin.y - 22})`}>
            <rect x="0" y="0" rx="6" ry="6" width="84" height="34"
              fill="var(--bg-card)" stroke="var(--line)" />
            <text x="10" y="14" style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--fg-dim)", letterSpacing: "0.06em" }}>
              {pinLabel || "PEAK"}
            </text>
            <text x="10" y="27" style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, fill: "var(--fg)" }}>
              {unit}{pin.v.toFixed(1)}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
window.SmoothedArea = SmoothedArea;

// -------------------------------------------------------------
// Donut — expense-style donut with center label
// -------------------------------------------------------------
function Donut({ segments, size = 180, thickness = 22, centerValue, centerLabel }) {
  const r = size / 2 - thickness / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        {segments.map((s, i) => (
          <linearGradient key={i} id={`donut-${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={s.colorEnd || s.color} />
          </linearGradient>
        ))}
      </defs>

      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />

      {segments.map((s, i) => {
        const len = (s.value / total) * (Math.PI * 2);
        const a1 = acc, a2 = acc + len - 0.03;
        acc += len;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        const large = len > Math.PI ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none"
            stroke={`url(#donut-${i})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${s.color})` }}
          />
        );
      })}

      <text x={cx} y={cy - 6} textAnchor="middle"
        style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 700, fill: "var(--fg)", letterSpacing: "-0.02em" }}>
        {centerValue}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontFamily: "var(--mono)", fontSize: 10, fill: "var(--fg-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {centerLabel}
      </text>
    </svg>
  );
}
window.Donut = Donut;

// -------------------------------------------------------------
// SparkBars — small card's bar set (ref 4)
// -------------------------------------------------------------
function SparkBars({ values, highlight = null, labels }) {
  const max = Math.max(...values);
  return (
    <div>
      <div className="spark-row" style={{ height: 72 }}>
        {values.map((v, i) => {
          const isHi = highlight === i || (highlight == null && v === max);
          return (
            <div key={i}
              className={`spark-row__bar ${!isHi ? "spark-row__bar--dim" : ""}`}
              style={{ height: `${(v / max) * 100}%` }}
              title={`${labels?.[i] ?? i}: ${v}`} />
          );
        })}
      </div>
      {labels && (
        <div className="spark-row__labels">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
window.SparkBars = SparkBars;

// -------------------------------------------------------------
// MultilineChart — smoothed multi-series (for weekly trendlines)
// -------------------------------------------------------------
function MultilineChart({ series, labels, height = 220, accentSeries = 0 }) {
  const W = 680, H = height;
  const padL = 36, padR = 16, padT = 16, padB = 26;
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals) * 1.1;
  const min = Math.min(...allVals, 0);
  const step = (W - padL - padR) / (labels.length - 1);

  const toPts = (arr) => arr.map((v, i) => ({
    x: padL + i * step,
    y: padT + (H - padT - padB) * (1 - (v - min) / (max - min)),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="ml-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(g => (
        <g key={g}>
          <line x1={padL} y1={padT + (H - padT - padB) * g} x2={W - padR} y2={padT + (H - padT - padB) * g}
            stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={padL - 8} y={padT + (H - padT - padB) * g + 3}
            textAnchor="end"
            style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--fg-dim)" }}>
            {Math.round(max * (1 - g))}
          </text>
        </g>
      ))}

      {/* series */}
      {series.map((s, i) => {
        const pts = toPts(s.data);
        const d = catmullRomSpline(pts, 0.5);
        const isAccent = i === accentSeries;
        if (isAccent) {
          const area = `${d} L ${pts[pts.length - 1].x},${H - padB} L ${pts[0].x},${H - padB} Z`;
          return (
            <g key={i}>
              <path d={area} fill="url(#ml-accent)" />
              <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5"
                style={{ filter: "drop-shadow(0 0 8px oklch(0.7 0.2 295 / 0.5))" }} />
            </g>
          );
        }
        return (
          <path key={i} d={d} fill="none"
            stroke={s.color || "var(--fg-dim)"}
            strokeWidth="1.6"
            strokeDasharray={s.dashed ? "3 4" : undefined}
            opacity={0.65}
          />
        );
      })}

      {/* x labels */}
      {labels.map((l, i) => (
        <text key={i} x={padL + i * step} y={H - 8}
          textAnchor="middle"
          style={{ fontFamily: "var(--mono)", fontSize: 10, fill: "var(--fg-dim)" }}>
          {l}
        </text>
      ))}
    </svg>
  );
}
window.MultilineChart = MultilineChart;

import React, { useMemo } from "react";

function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

// Closed Catmull–Rom spline converted to cubic Béziers (smooth “blob” like the reference).
function closedCatmullRomPath(points, tension = 0.9) {
  if (!points || points.length < 3) return "";
  const pts = points.slice();
  const n = pts.length;

  const p = (i) => pts[(i + n) % n];
  const ctrl = (p0, p1, p2, t) => ({
    c1: {
      x: p1.x + ((p2.x - p0.x) / 6) * t,
      y: p1.y + ((p2.y - p0.y) / 6) * t,
    },
    c2: {
      x: p2.x - ((p(p2.__i + 2).x - p1.x) / 6) * t,
      y: p2.y - ((p(p2.__i + 2).y - p1.y) / 6) * t,
    },
  });

  // annotate indices for ctrl helper
  const ann = pts.map((pt, i) => ({ ...pt, __i: i }));

  let d = `M ${ann[0].x.toFixed(2)} ${ann[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = ann[(i - 1 + n) % n];
    const p1 = ann[i];
    const p2 = ann[(i + 1) % n];
    const p3 = ann[(i + 2) % n];

    const c1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension,
      y: p1.y + ((p2.y - p0.y) / 6) * tension,
    };
    const c2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension,
      y: p2.y - ((p3.y - p1.y) / 6) * tension,
    };

    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(
      2
    )} ${c2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + " Z";
}

export default function PremiumRadar({
  items,
  size = 320,
  padding = 26,
  rings = 4,
  accent = "var(--premium-accent)",
  showLabels = true,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - padding;

  const normalized = useMemo(() => {
    const safe = (items || []).map((it) => ({
      label: it.label,
      value: Math.max(0, Math.min(100, Number(it.value) || 0)),
    }));
    return safe;
  }, [items]);

  const points = useMemo(() => {
    const n = normalized.length;
    if (n === 0) return [];
    return normalized.map((it, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const r = (it.value / 100) * radius;
      return polarToCartesian(cx, cy, r, angle);
    });
  }, [normalized, cx, cy, radius]);

  const labelPoints = useMemo(() => {
    const n = normalized.length;
    if (n === 0) return [];
    return normalized.map((it, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const p = polarToCartesian(cx, cy, radius + 14, angle);
      return { ...p, label: it.label, angle };
    });
  }, [normalized, cx, cy, radius]);

  const blobPath = useMemo(() => closedCatmullRomPath(points, 0.92), [points]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      className="premium-radar"
      role="img"
      aria-label="Radar chart"
    >
      <defs>
        <radialGradient id="premiumRadarFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
        </radialGradient>
        <filter id="premiumSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
          />
        </filter>
      </defs>

      {/* Rings */}
      {Array.from({ length: rings }).map((_, idx) => {
        const r = ((idx + 1) / rings) * radius;
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(15, 15, 15, 0.10)"
          />
        );
      })}

      {/* Spokes */}
      {normalized.map((_, i) => {
        const n = normalized.length;
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const p = polarToCartesian(cx, cy, radius, angle);
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(15, 15, 15, 0.08)"
          />
        );
      })}

      {/* Blob shadow */}
      {blobPath ? (
        <path d={blobPath} fill={accent} opacity="0.10" filter="url(#premiumSoftGlow)" />
      ) : null}

      {/* Blob */}
      {blobPath ? (
        <path
          d={blobPath}
          fill="url(#premiumRadarFill)"
          stroke={accent}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      ) : null}

      {/* Center medallion */}
      <circle
        cx={cx}
        cy={cy}
        r={28}
        fill="rgba(255,255,255,0.90)"
        stroke="rgba(15, 15, 15, 0.10)"
      />
      <circle
        cx={cx}
        cy={cy}
        r={44}
        fill="none"
        stroke="rgba(15, 15, 15, 0.08)"
      />
      {/* Simple diamond mark */}
      <path
        d={`M ${cx} ${cy - 12} L ${cx + 12} ${cy} L ${cx} ${cy + 12} L ${
          cx - 12
        } ${cy} Z`}
        fill="none"
        stroke="rgba(15, 15, 15, 0.55)"
        strokeWidth="2"
      />
      <path
        d={`M ${cx} ${cy - 12} L ${cx} ${cy + 12}`}
        stroke="rgba(15, 15, 15, 0.35)"
        strokeWidth="1.5"
      />
      <path
        d={`M ${cx - 12} ${cy} L ${cx + 12} ${cy}`}
        stroke="rgba(15, 15, 15, 0.35)"
        strokeWidth="1.5"
      />

      {/* Labels */}
      {showLabels
        ? labelPoints.map((lp) => (
            <text
              key={lp.label}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="rgba(55,53,47,0.65)"
            >
              {lp.label}
            </text>
          ))
        : null}
    </svg>
  );
}


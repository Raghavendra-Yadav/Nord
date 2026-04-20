/* PetalRadar — rounded closed-spline radar with violet glow.
   Inspired by the "petal" polar shape. */

function polar(cx, cy, r, a) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function closedSplinePath(pts, tension = 0.92) {
  if (!pts || pts.length < 3) return "";
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension,
      y: p1.y + ((p2.y - p0.y) / 6) * tension,
    };
    const c2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension,
      y: p2.y - ((p3.y - p1.y) / 6) * tension,
    };
    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + " Z";
}

function PetalRadar({
  items,
  size = 220,
  padding = 38,
  rings = 4,
}) {
  const cx = size / 2, cy = size / 2;
  const radius = size / 2 - padding;
  const n = (items || []).length;

  const points = React.useMemo(() => {
    if (!items) return [];
    return items.map((it, i) => {
      const v = Math.max(0, Math.min(100, Number(it.value) || 0));
      // push lobes out aggressively so the shape is visibly petaled
      const lobe = 0.55 + (v / 100) * 0.45;
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return polar(cx, cy, radius * lobe, a);
    });
  }, [items, cx, cy, radius, n]);

  const blob = React.useMemo(() => closedSplinePath(points, 1.0), [points]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label="Petal radar">
      <defs>
        <radialGradient id="petalFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </radialGradient>
        <filter id="petalGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0" />
        </filter>
        <linearGradient id="petalStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-cool)" />
        </linearGradient>
      </defs>

      {/* Rings */}
      {Array.from({ length: rings }).map((_, i) => {
        const r = ((i + 1) / rings) * radius;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke="var(--line)" strokeWidth="1" />
        );
      })}

      {/* Glow blob */}
      {blob && <path d={blob} fill="var(--accent)" opacity="0.28" filter="url(#petalGlow)" />}
      {blob && <path d={blob} fill="url(#petalFill)" stroke="url(#petalStroke)" strokeWidth="2.6" strokeLinejoin="round" />}

      {/* Center medallion */}
      <circle cx={cx} cy={cy} r={30} fill="var(--bg-card)" stroke="var(--line)" />
      <path
        d={`M ${cx} ${cy - 11} L ${cx + 11} ${cy} L ${cx} ${cy + 11} L ${cx - 11} ${cy} Z`}
        fill="none" stroke="var(--fg-mute)" strokeWidth="1.5" strokeLinejoin="round"
      />
      <line x1={cx} y1={cy - 11} x2={cx} y2={cy + 11} stroke="var(--fg-dim)" strokeWidth="1" />
      <line x1={cx - 11} y1={cy} x2={cx + 11} y2={cy} stroke="var(--fg-dim)" strokeWidth="1" />

      {/* Domain labels inside the spokes */}
      {items && items.map((it, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const p = polar(cx, cy, radius + 18, a);
        return (
          <text key={it.label} x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: "var(--sans)", fontSize: 9.5, fontWeight: 600, fill: "var(--fg)", letterSpacing: "0.01em" }}>
            {it.label}
          </text>
        );
      })}
    </svg>
  );
}

window.PetalRadar = PetalRadar;

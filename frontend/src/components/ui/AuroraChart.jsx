import React from "react";

export function AuroraChartFrame({ height = 260, children }) {
  return (
    <div className="aurora-chart" style={{ height }}>
      {children}
    </div>
  );
}

export function AuroraDot({ cx, cy, stroke, fill }) {
  // Recharts activeDot renderer (keeps hover feeling “premium”)
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={stroke} opacity={0.12} />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        stroke={stroke}
        strokeWidth={2}
        fill={fill || "#fff"}
      />
    </g>
  );
}

export function AuroraTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload || payload.length === 0) return null;

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;
  return (
    <div className="aurora-tooltip">
      {formattedLabel ? (
        <div className="aurora-tooltip__label">{formattedLabel}</div>
      ) : null}
      <div className="aurora-tooltip__rows">
        {payload
          .filter((p) => p && p.value !== undefined && p.value !== null)
          .map((p) => (
            <div key={p.dataKey} className="aurora-tooltip__row">
              <span
                className="aurora-tooltip__swatch"
                style={{ background: p.color || p.stroke || "#7c3aed" }}
              />
              <span className="aurora-tooltip__name">
                {p.name || p.dataKey}
              </span>
              <span className="aurora-tooltip__value">{p.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}


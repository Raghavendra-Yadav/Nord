import React, { useMemo } from "react";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function WhoopPanel({ title, subtitle, right, children, className = "" }) {
  return (
    <section className={`whoop-card ${className}`}>
      <header className="whoop-card__header">
        <div>
          <div className="whoop-card__titleRow">
            <h3 className="whoop-card__title">{title}</h3>
            {right ? <div className="whoop-card__right">{right}</div> : null}
          </div>
          {subtitle ? <p className="whoop-card__subtitle">{subtitle}</p> : null}
        </div>
      </header>
      <div className="whoop-card__body">{children}</div>
    </section>
  );
}

export function GlassChartPanel({ children, className = "" }) {
  return <div className={`whoop-glass ${className}`}>{children}</div>;
}

export function ScoreRing({ value, size = 120, label, sublabel }) {
  const v = clamp01((Number(value) || 0) / 100);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * v;

  return (
    <div className="whoop-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="whoopRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(15,15,15,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#whoopRingGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="whoop-ring__center">
        <div className="whoop-ring__value">{Math.round(v * 100)}</div>
        <div className="whoop-ring__unit">/100</div>
      </div>
      {label ? <div className="whoop-ring__label">{label}</div> : null}
      {sublabel ? <div className="whoop-ring__sublabel">{sublabel}</div> : null}
    </div>
  );
}

export function DomainBars({ items, max = 100 }) {
  const sorted = useMemo(() => {
    return [...(items || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [items]);

  return (
    <div className="whoop-bars">
      {sorted.map((it) => {
        const v = Math.max(0, Math.min(max, Number(it.value) || 0));
        return (
          <div key={it.label} className="whoop-bars__row">
            <div className="whoop-bars__label">{it.label}</div>
            <div className="whoop-bars__track">
              <div className="whoop-bars__fill" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <div className="whoop-bars__value">{Math.round(v)}</div>
          </div>
        );
      })}
    </div>
  );
}


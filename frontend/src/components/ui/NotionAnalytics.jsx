import React from "react";

export function AnalyticsCard({ title, subtitle, right, children, className = "" }) {
  return (
    <section className={`analytics-card ${className}`}>
      <header className="analytics-card__header">
        <div className="analytics-card__titles">
          <div className="analytics-card__titleRow">
            <h3 className="analytics-card__title">{title}</h3>
            {right ? <div className="analytics-card__right">{right}</div> : null}
          </div>
          {subtitle ? <p className="analytics-card__subtitle">{subtitle}</p> : null}
        </div>
      </header>
      <div className="analytics-card__body">{children}</div>
    </section>
  );
}

export function KpiCard({ label, value, hint, tone = "neutral", children, className = "" }) {
  return (
    <section className={`analytics-kpi ${className}`}>
      <div className="analytics-kpi__top">
        <div className="analytics-kpi__label">{label}</div>
        {hint ? <div className={`analytics-pill analytics-pill--${tone}`}>{hint}</div> : null}
      </div>
      <div className="analytics-kpi__value">{value}</div>
      {children ? <div className="analytics-kpi__spark">{children}</div> : null}
    </section>
  );
}

export function NotionTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  const formattedLabel = labelFormatter ? labelFormatter(label) : label;
  return (
    <div className="analytics-tooltip">
      {formattedLabel ? <div className="analytics-tooltip__label">{formattedLabel}</div> : null}
      <div className="analytics-tooltip__rows">
        {payload
          .filter((p) => p && p.value !== undefined && p.value !== null)
          .map((p) => (
            <div key={p.dataKey} className="analytics-tooltip__row">
              <span className="analytics-tooltip__name">{p.name || p.dataKey}</span>
              <span className="analytics-tooltip__value">
                {valueFormatter ? valueFormatter(p.value, p) : p.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}


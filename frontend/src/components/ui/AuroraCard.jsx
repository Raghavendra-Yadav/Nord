import React from "react";

export function AuroraCard({
  className = "",
  accent = "violet",
  children,
  ...props
}) {
  return (
    <section
      className={`aurora-card aurora-accent-${accent} ${className}`}
      {...props}
    >
      <div className="aurora-card__inner">{children}</div>
    </section>
  );
}

export function AuroraCardHeader({ title, subtitle, right }) {
  return (
    <header className="aurora-card__header">
      <div className="aurora-card__headerText">
        <div className="aurora-card__titleRow">
          <h3 className="aurora-card__title">{title}</h3>
          {right ? <div className="aurora-card__right">{right}</div> : null}
        </div>
        {subtitle ? <p className="aurora-card__subtitle">{subtitle}</p> : null}
      </div>
    </header>
  );
}

export function AuroraKpi({ label, value, delta, deltaTone = "good" }) {
  return (
    <div className="aurora-kpi">
      <div className="aurora-kpi__label">{label}</div>
      <div className="aurora-kpi__row">
        <div className="aurora-kpi__value">{value}</div>
        {delta ? (
          <span className={`aurora-kpi__delta aurora-tone-${deltaTone}`}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}


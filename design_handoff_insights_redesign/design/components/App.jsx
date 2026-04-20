/* Insights dashboard — main composition */

const { useState, useEffect, useMemo } = React;

// --- Synthesised demo data (realistic for a life-tracker) ---
const DOMAINS = [
  { key: "Body",        value: 82, delta: +3 },
  { key: "Mind",        value: 74, delta: +1 },
  { key: "Mood",        value: 68, delta: -2 },
  { key: "Vices",       value: 38, delta: -6 },
  { key: "Career",      value: 91, delta: +5 },
  { key: "Finance",     value: 62, delta: +0 },
  { key: "Relations",   value: 54, delta: -3 },
  { key: "Environment", value: 71, delta: +2 },
  { key: "Reflect",     value: 79, delta: +4 },
];

const DAYS14 = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  return { label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2).toUpperCase(),
           num: d.getDate(),
           date: d };
});

// 14-day spend curve (Liquidity burn)
const SPEND14 = [42, 18, 95, 24, 63, 12, 180, 44, 32, 51, 77, 22, 68, 39];

// 30-day smoothed-area: DayRating
const RATING30 = [5.8, 6.1, 6.4, 6.2, 6.8, 7.1, 7.3, 7.0, 6.6, 6.9, 7.4, 7.8, 8.0, 7.6, 7.2, 7.5, 7.9, 8.2, 8.4, 8.1, 7.7, 7.4, 7.8, 8.0, 8.3, 8.5, 8.1, 7.9, 8.2, 8.6]
  .map((v, i) => ({ label: `${i + 1}`, v }));
const RATING_PIN = 25;

// Weekly trends (8 weeks)
const WEEKS = ["W09", "W10", "W11", "W12", "W13", "W14", "W15", "W16"];
const CAREER_W =   [58, 62, 71, 68, 75, 82, 79, 88];
const BODY_W =     [65, 64, 70, 72, 74, 71, 78, 82];
const MOOD_W =     [62, 68, 65, 70, 66, 72, 74, 72];

// Consumption bar report — deep work blocks
const DEEPWORK = [
  { label: "01", value: 2 }, { label: "02", value: 4 }, { label: "03", value: 3 },
  { label: "04", value: 5 }, { label: "05", value: 3 }, { label: "06", value: 6 },
  { label: "07", value: 4 }, { label: "08", value: 2 }, { label: "09", value: 5 },
  { label: "10", value: 3 },
].map(d => ({ ...d, value: d.value * 23 })); // scale up to look like reference's counts

// Screen time 7-day (small card)
const SCREEN_WEEK = [3.8, 2.9, 4.6, 4.1, 2.1, 5.4, 3.2];
const SCREEN_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Sleep 7-day
const SLEEP_WEEK = [7.2, 6.8, 7.8, 8.1, 7.5, 6.4, 8.4];

// Expense donut
const EXPENSES = [
  { label: "Rent",      value: 1600, color: "oklch(0.68 0.20 295)" },
  { label: "Food",      value: 420,  color: "oklch(0.72 0.18 335)" },
  { label: "Transit",   value: 180,  color: "oklch(0.72 0.18 255)" },
  { label: "Wellness",  value: 245,  color: "oklch(0.78 0.14 195)" },
  { label: "Dining out",value: 310,  color: "oklch(0.74 0.16 25)" },
  { label: "Misc",      value: 162,  color: "oklch(0.55 0.04 280)" },
];

const TOTAL_EXP = EXPENSES.reduce((s, x) => s + x.value, 0);

// Insights
const INSIGHTS = [
  {
    id: "sleep-mood",
    tag: "Statistical signal",
    rail: "var(--accent)",
    title: "Sleep ↔ Day Rating correlation is +62%",
    body: "Across 90 days, two-thirds of the variance in your daily performance score is explained by the night before's sleep duration. This is your most predictive lever.",
    action: "Maintain",
    actionText: "Defend your 11:20pm → 7:00am window. Skip the late Slack sync on Thursdays.",
  },
  {
    id: "screen-friction",
    tag: "Systemic friction",
    rail: "var(--warn)",
    title: "Digital capture coefficient: −41%",
    body: "Every extra hour of phone time on your 14-day window compressed deep-work blocks by ~0.6 units. This has compounded into 3.2 lost output-days this month.",
    action: "Protocol",
    actionText: "Phone parked in hallway drawer 9pm → 8am for 7 days. Re-measure next Monday.",
  },
  {
    id: "relations-drift",
    tag: "Balance alert",
    rail: "var(--bad)",
    title: "Career is cannibalising Relations",
    body: "Career surged to 91/100 over the last two weeks. In the same window, Relations dropped to 54 and meaningful-conversation rate fell to 28%. The system is out of equipoise.",
    action: "Counterweight",
    actionText: "Two low-stakes social calls this week. Cancel one coworking block to create the slot.",
  },
];

// Heat matrix intensity
function heatColor(v) {
  if (v == null) return "oklch(0.25 0.01 285 / 0.15)";
  if (v < 35) return "oklch(0.45 0.18 25 / 0.55)";
  if (v < 60) return "oklch(0.55 0.12 70 / 0.55)";
  if (v < 80) return "oklch(0.62 0.18 295 / 0.55)";
  return "oklch(0.72 0.22 295 / 0.95)";
}

// Synth heat data
function heatValue(domainIdx, dayIdx) {
  const base = DOMAINS[domainIdx].value;
  const seed = (domainIdx * 7 + dayIdx * 11) % 37;
  const noise = (seed - 18) * 1.8;
  const v = Math.max(0, Math.min(100, Math.round(base + noise)));
  return v;
}

// ================================================================
function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("nord-theme") || "dark");
  const [window_, setWindow] = useState(() => Number(localStorage.getItem("nord-window")) || 90);
  const [accent, setAccent] = useState(() => Number(localStorage.getItem("nord-accent")) || 295);
  const [tweakOn, setTweakOn] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nord-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-h", accent);
    localStorage.setItem("nord-accent", accent);
  }, [accent]);
  useEffect(() => {
    localStorage.setItem("nord-window", window_);
  }, [window_]);

  // Tweaks contract
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweakOn(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweakOn(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const overall = Math.round(DOMAINS.reduce((s, d) => s + d.value, 0) / DOMAINS.length);

  return (
    <div className="shell" data-screen-label="Insights / Overview">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">N</div>
          <div>Nord</div>
        </div>
        <div className="topbar__crumbs">
          <span>/</span>
          <span>Workspace</span>
          <span>/</span>
          <b>Deep Analytics</b>
        </div>
        <div className="topbar__spacer" />
        <div className="topbar__controls">
          <div className="seg" role="tablist">
            {[30, 60, 90].map(n => (
              <button key={n} data-active={window_ === n}
                onClick={() => setWindow(n)}>{n}d</button>
            ))}
          </div>
          <button className="chip" data-active={true} title="Domain focus">
            <span className="chip__dot" /> All domains
          </button>
          <button className="chip"
            title="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☾ Dark" : "☀ Light"}
          </button>
        </div>
      </header>

      {/* Page head */}
      <section className="pagehead">
        <div>
          <h1>Your system over the last <em>{window_} days</em></h1>
          <p>A behavioural map of 9 life domains — intrinsic performance, observed friction, and the statistical signals Nord is confident enough to flag.</p>
        </div>
        <div className="pagehead__meta">
          <div>Window · <b>{window_} days</b></div>
          <div>Observations · <b>{window_ * 3}</b></div>
          <div>Last sync · <b>12 min ago</b></div>
        </div>
      </section>

      {/* ===== KPI strip ===== */}
      <div className="grid">

        {/* Overall balance / Petal Radar hero */}
        <section className="card card--dark col-6" style={{ padding: 26 }}>
          <div className="card__label card__label--pair">
            <span>◆ Life balance · petal projection</span>
            <span>{window_}d window</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr", gap: 20, alignItems: "center" }}>
            <div style={{ aspectRatio: "1/1", position: "relative" }}>
              <PetalRadar
                items={DOMAINS.map(d => ({ label: d.key, value: d.value }))}
                size={220}
                padding={38}
              />
            </div>
            <div>
              <div className="kpi-big">
                <div className="mono small dim" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Composite score</div>
                <div className="kpi-big__value">{overall}<small>/100</small></div>
                <div className="kpi-big__delta kpi-big__delta--up">▲ +4.2 <span>vs prev window</span></div>
              </div>
              <div className="dbars" style={{ marginTop: 24 }}>
                {DOMAINS.slice(0, 5).map(d => (
                  <div key={d.key} className="dbar">
                    <div className="dbar__label">{d.key}</div>
                    <div className="dbar__track">
                      <div className={`dbar__fill ${d.value < 50 ? "dbar__fill--bad" : d.value < 70 ? "dbar__fill--warn" : ""}`}
                           style={{ "--v": `${d.value}%` }} />
                    </div>
                    <div className="dbar__value">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right side: big gradient bar card (Deep work report) */}
        <section className="card card--dark col-6" style={{ padding: 26, display: "flex", flexDirection: "column" }}>
          <div className="card__label card__label--pair">
            <span>▮ Deep work report</span>
            <span>Last 10 sessions</span>
          </div>
          <div className="row" style={{ alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
            <div className="kpi-big">
              <div className="kpi-big__value tnum">
                38.4<small>hrs</small>
              </div>
              <div className="kpi-big__delta kpi-big__delta--up mono">
                ▲ +19.0%&nbsp;&nbsp;<span>44.2 prev / 38.4 current</span>
              </div>
            </div>
            <div className="legend" style={{ marginTop: 0 }}>
              <span><i style={{ background: "linear-gradient(180deg, var(--accent-cool), var(--accent-deep))" }} />Session depth</span>
              <span><i style={{ background: "color-mix(in oklch, var(--fg) 20%, transparent)" }} />Avg baseline</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 220 }}>
            <GradientBarReport data={DEEPWORK} highlightIdx={5} />
          </div>
          <div style={{
            borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12,
            display: "grid", gridTemplateColumns: "1fr auto", gap: 10, fontSize: 12,
            color: "var(--fg-mute)"
          }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Peak block</span><b className="mono" style={{ color: "var(--fg)" }}>S·06 — 138 min</b>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Cadence</span><b className="mono" style={{ color: "var(--fg)" }}>2.4 / day</b>
            </div>
          </div>
        </section>

      </div>

      {/* ===== Section 1: Lenses ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 01 · Lenses</div>
          <h2>Day rating — 30 day trajectory</h2>
        </div>
        <div className="sec-head__side">self-reported · tnum</div>
      </div>

      <div className="grid">
        <section className="card col-8" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>☉ Smoothed rating · 30 days</span>
            <span>Target ≥ 7.5</span>
          </div>
          <div className="row" style={{ gap: 28, alignItems: "flex-end", marginBottom: 10 }}>
            <div className="kpi-big">
              <div className="kpi-big__value">8.6<small>/10</small></div>
              <div className="kpi-big__delta kpi-big__delta--up">▲ +0.8 <span>30-day avg</span></div>
            </div>
            <div className="stack" style={{ marginBottom: 6, minWidth: 110 }}>
              <div className="mono small dim">Variance</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>σ = 0.72</div>
            </div>
            <div className="stack" style={{ marginBottom: 6, minWidth: 120 }}>
              <div className="mono small dim">Days ≥ target</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>21 / 30</div>
            </div>
          </div>
          <SmoothedArea data={RATING30} height={200} pinIdx={RATING_PIN} pinLabel="PEAK D26" unit="" />
        </section>

        <section className="card col-4" style={{ padding: 22 }}>
          <div className="card__label card__label--pair">
            <span>◉ Expense composition</span>
            <span className="mono small dim">Apr</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 6 }}>
            <Donut
              segments={EXPENSES}
              size={200}
              thickness={20}
              centerValue={`$${(TOTAL_EXP / 1000).toFixed(1)}k`}
              centerLabel="This month"
            />
            <div className="donut-legend" style={{ width: "100%" }}>
              {EXPENSES.slice(0, 3).map(e => (
                <div key={e.label} className="donut-legend__row" style={{ gridTemplateColumns: "10px 1fr auto" }}>
                  <i style={{ background: e.color }} />
                  <span>{e.label}</span>
                  <em>{Math.round((e.value / TOTAL_EXP) * 100)}%</em>
                </div>
              ))}
              <div className="mono small dim" style={{ marginTop: 4, letterSpacing: "0.08em" }}>
                + {EXPENSES.length - 3} more categories
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== KPI small cards strip ===== */}
      <div className="grid" style={{ marginTop: 16 }}>
        <MiniKpi
          col="col-3"
          label="Sleep debt"
          value="−4.2h"
          hint="vs 7.5h nightly target"
          values={SLEEP_WEEK}
          labels={["M","T","W","T","F","S","S"]}
          delta={{ type: "down", text: "−1.1h vs last wk" }}
        />
        <MiniKpi
          col="col-3"
          label="Screen time"
          value="3.7h/d"
          hint="dopamine load estimate"
          values={SCREEN_WEEK}
          labels={SCREEN_LABELS}
          flag="warn"
          flagLabel="Elevated"
          delta={{ type: "up", text: "+12% vs last wk", bad: true }}
        />
        <MiniKpi
          col="col-3"
          label="Daily spend"
          value="$54.80"
          hint="14-day mean velocity"
          values={SPEND14.slice(-7)}
          labels={["M","T","W","T","F","S","S"]}
          delta={{ type: "down", text: "−$8.40 vs last wk" }}
        />
        <MiniKpi
          col="col-3"
          label="Meaningful convos"
          value="38%"
          hint="weekly relational pulse"
          values={[1, 0, 1, 0, 0, 1, 0].map(v => v === 1 ? 100 : 10)}
          labels={["M","T","W","T","F","S","S"]}
          flag="bad"
          flagLabel="Below floor"
          delta={{ type: "down", text: "−18pp vs 90-day mean", bad: true }}
        />
      </div>

      {/* ===== Section 2: Trendlines ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 02 · Trendlines</div>
          <h2>Weekly progression across domains</h2>
        </div>
        <div className="sec-head__side">8 weeks · rolling mean</div>
      </div>

      <div className="grid">
        <section className="card col-8" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>↗ Momentum vectors</span>
            <span>Career leading</span>
          </div>
          <div className="legend" style={{ margin: "6px 0 16px" }}>
            <span><i style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />Career · accent</span>
            <span><i style={{ background: "var(--fg-dim)" }} />Body</span>
            <span><i style={{ background: "var(--fg-dim)", opacity: 0.5 }} />Mood</span>
          </div>
          <MultilineChart
            series={[
              { name: "Career", data: CAREER_W, color: "var(--accent)" },
              { name: "Body",   data: BODY_W,   color: "var(--fg-dim)" },
              { name: "Mood",   data: MOOD_W,   color: "var(--fg-dim)", dashed: true },
            ]}
            labels={WEEKS}
            height={240}
            accentSeries={0}
          />
        </section>

        {/* Income card — references the small bar kpi (ref 4) */}
        <section className="card col-4" style={{ padding: 22 }}>
          <div className="card__label card__label--pair">
            <span>⊛ Income</span>
            <span>•••</span>
          </div>
          <div className="kpi-big" style={{ marginBottom: 4 }}>
            <div className="kpi-big__value tnum">$32,134</div>
            <div className="kpi-big__delta kpi-big__delta--up mono">▲ +2.5%&nbsp;&nbsp;<span>$31,348 last month</span></div>
          </div>
          <SparkBars
            values={[28, 62, 88, 35, 52, 40, 30]}
            highlight={2}
            labels={["01","02","03","04","05","06","07"]}
          />
          <div style={{ marginTop: 18, fontSize: 12, color: "var(--fg-mute)", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Freelance</span><b className="mono" style={{ color: "var(--fg)" }}>$18,400</b>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <span>Dividends</span><b className="mono" style={{ color: "var(--fg)" }}>$2,180</b>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <span>Salary</span><b className="mono" style={{ color: "var(--fg)" }}>$11,554</b>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Section 3: Heat matrix + insights ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 03 · Patterns</div>
          <h2>Area intensity matrix · 14 days</h2>
        </div>
        <div className="sec-head__side">row = domain · column = day</div>
      </div>

      <div className="grid">
        <section className="card col-7" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>▦ Heat matrix</span>
            <span>{DAYS14[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {DAYS14[13].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>

          <div className="heat">
            <div className="heat__rowlabels">
              <div className="heat__rowlabel" style={{ opacity: 0 }}>_</div>
              {DOMAINS.map(d => (
                <div key={d.key} className="heat__rowlabel">{d.key}</div>
              ))}
            </div>

            <div>
              <div className="heat__dates">
                {DAYS14.map((d, i) => <span key={i}>{d.num}</span>)}
              </div>
              <div className="heat__rows">
                {DOMAINS.map((d, di) => (
                  <div key={d.key} className="heat__row">
                    {DAYS14.map((_, xi) => {
                      const v = heatValue(di, xi);
                      return <div key={xi} className="heat__cell" style={{ "--c": heatColor(v) }}
                        title={`${d.key} · ${DAYS14[xi].date.toDateString()} · ${v}`} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="legend">
            <span><i style={{ background: heatColor(null), borderRadius: 3 }} />No log</span>
            <span><i style={{ background: heatColor(30) }} />0-35</span>
            <span><i style={{ background: heatColor(50) }} />35-60</span>
            <span><i style={{ background: heatColor(70) }} />60-80</span>
            <span><i style={{ background: heatColor(90) }} />80-100</span>
          </div>
        </section>

        <section className="col-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {INSIGHTS.map(ins => (
            <article key={ins.id} className="insight" style={{ "--rail": ins.rail }}>
              <div>
                <div className="insight__meta">
                  <span className="dot" style={{ width: 6, height: 6, borderRadius: 3, background: ins.rail, display: "inline-block" }} />
                  <b>{ins.tag}</b>
                  <span>· Confidence 0.82</span>
                </div>
                <h4 className="insight__title">{ins.title}</h4>
                <p className="insight__body">{ins.body}</p>
                <div className="insight__action">
                  <b>{ins.action}</b>
                  <span>{ins.actionText}</span>
                </div>
              </div>
              <div className="insight__cta">
                <button className="btn btn--primary">✓ Act</button>
                <button className="btn btn--ghost">Later</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* ===== Section 4: Domain table ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 04 · Ledger</div>
          <h2>All nine domains</h2>
        </div>
        <div className="sec-head__side">composite scores · {window_}d</div>
      </div>

      <div className="grid">
        <section className="card col-12" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Domain", "Score", "Δ prev", "Trend", "Signals", "Status"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "14px 22px",
                    fontFamily: "var(--mono)", fontSize: 10,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--fg-dim)", fontWeight: 500
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map((d, i) => (
                <tr key={d.key} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "14px 22px", fontWeight: 500 }}>{d.key}</td>
                  <td style={{ padding: "14px 22px", fontFamily: "var(--mono)", fontSize: 14 }}>{d.value}</td>
                  <td style={{ padding: "14px 22px", fontFamily: "var(--mono)", fontSize: 12,
                    color: d.delta > 0 ? "var(--good)" : d.delta < 0 ? "var(--bad)" : "var(--fg-dim)" }}>
                    {d.delta > 0 ? "+" : ""}{d.delta}
                  </td>
                  <td style={{ padding: "14px 22px", width: "30%" }}>
                    <div className="dbar__track">
                      <div className={`dbar__fill ${d.value < 50 ? "dbar__fill--bad" : d.value < 70 ? "dbar__fill--warn" : ""}`}
                        style={{ "--v": `${d.value}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: "14px 22px", color: "var(--fg-mute)", fontSize: 12 }}>
                    {d.value >= 80 ? "Stable high, defend cadence" :
                     d.value >= 60 ? "Within band, slight drift" :
                     d.value >= 40 ? "Attention required" : "Intervention recommended"}
                  </td>
                  <td style={{ padding: "14px 22px" }}>
                    <span className="mono" style={{
                      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: d.value >= 70 ? "var(--good)" : d.value >= 45 ? "var(--warn)" : "var(--bad)"
                    }}>
                      ● {d.value >= 70 ? "Thriving" : d.value >= 45 ? "Drifting" : "Critical"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Footer ticker */}
      <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
        <div className="ticker">
          <span>NORD·LIVE</span>
          <span>BODY <b>82</b> <i className="up">▲</i></span>
          <span>MIND <b>74</b> <i className="up">▲</i></span>
          <span>MOOD <b>68</b> <i className="dn">▼</i></span>
          <span>CAREER <b>91</b> <i className="up">▲</i></span>
          <span>RELATIONS <b>54</b> <i className="dn">▼</i></span>
          <span>σ <b>0.72</b></span>
        </div>
      </div>

      {/* Tweaks */}
      {tweakOn && (
        <aside id="tweaks">
          <h4>Tweaks <span className="mono dim small">v1</span></h4>

          <label>Theme
            <div className="seg">
              <button data-active={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
              <button data-active={theme === "light"} onClick={() => setTheme("light")}>Light</button>
            </div>
          </label>

          <label>Window
            <div className="seg">
              {[30, 60, 90].map(n => (
                <button key={n} data-active={window_ === n}
                  onClick={() => setWindow(n)}>{n}d</button>
              ))}
            </div>
          </label>

          <label>Accent hue
            <input type="range" min="0" max="360" value={accent}
              onChange={(e) => setAccent(Number(e.target.value))} />
          </label>

          <div className="swatches">
            {[295, 260, 330, 210, 180, 30].map(h => (
              <button key={h} style={{ "--h": h, background: `oklch(0.68 0.22 ${h})` }}
                data-active={accent === h}
                onClick={() => setAccent(h)} />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

// -------- Mini KPI sub-component --------
function MiniKpi({ col, label, value, hint, values, labels, flag, flagLabel, delta }) {
  return (
    <section className={`card ${col}`} style={{ padding: 20 }}>
      <div className="card__label card__label--pair">
        <span>▸ {label}</span>
        {flag && (
          <span className={`card__flag ${flag}`} style={{ position: "static", top: 0, right: 0 }}>
            <span className="dot" />{flagLabel}
          </span>
        )}
      </div>
      <div className="kpi-big" style={{ marginBottom: 6 }}>
        <div className="kpi-big__value tnum" style={{ fontSize: 36 }}>{value}</div>
        {delta && (
          <div className={`kpi-big__delta ${delta.bad ? "kpi-big__delta--down" : delta.type === "up" ? "kpi-big__delta--up" : "kpi-big__delta--down"}`}>
            {delta.type === "up" ? "▲" : "▼"} {delta.text}
          </div>
        )}
      </div>
      <div className="mono small dim" style={{ marginBottom: 8 }}>{hint}</div>
      <SparkBars values={values} labels={labels} />
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

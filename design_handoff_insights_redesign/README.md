# Handoff: Deep Analytics / Insights Redesign (Nord)

## Overview
A redesigned **InsightsTab** for the life-tracker-app with a warm near-black + violet-glow aesthetic (dark-first, light-mode supported). Covers the full 9-domain life system (Body · Mind · Mood · Vices · Career · Finance · Relations · Environment · Reflect) with petal radar, gradient bar reports, smoothed area with peak annotation, donut composition, heat matrix, multi-line weekly trends, KPI mini-cards, editorial insight rail, and a domain ledger table.

## About the Design Files
The files in `design/` are **HTML/React design references** — prototypes showing intended look and behavior, not production code to drop in. Your task is to **recreate these designs in the existing `life-tracker-app/frontend/` React + Vite codebase**, using its established patterns (CSS variables, Recharts for data bindings, the existing `api/axiosConfig` fetch layer in `InsightsTab.jsx`).

The visual primitives in `design/components/` (PetalRadar, GradientBarReport, SmoothedArea, Donut, SparkBars, MultilineChart) are **pure SVG React components** with no external deps — they can be ported nearly verbatim, just converted from the prototype's global-window pattern to ES modules.

## Fidelity
**High-fidelity.** All colors, typography, spacing, radii, and states are final. Recreate the UI pixel-perfectly. Data hooks should use the real backend — the sample data in `App.jsx` (DOMAINS, DAYS14, EXPENSES, etc.) is purely illustrative and must be replaced by what `InsightsTab.jsx` already computes (`radarData`, `trendData`, `financeData`, `motivationSpectrumData`, `correlationData`, `summary`, `activeInsights`, etc.).

## Target Files in Codebase

The redesign replaces/updates these existing files:

| File | Change |
|---|---|
| `frontend/src/components/InsightsTab.jsx` | Rewrite JSX layer; keep all data-compilation logic |
| `frontend/src/components/ui/PremiumRadar.jsx` | Replace with new `PetalRadar.jsx` |
| `frontend/src/components/ui/WhoopAnalytics.jsx` | Deprecate — `ScoreRing`, `DomainBars`, `GlassChartPanel` supplanted |
| `frontend/src/components/ui/NotionAnalytics.jsx` | Keep `AnalyticsCard`/`KpiCard`/`NotionTooltip` but re-style via new tokens |
| `frontend/src/index.css` | Add Nord design tokens (`:root` block) |
| `frontend/index.html` | Add Inter + JetBrains Mono Google Fonts link |

New files to create:

```
frontend/src/components/ui/PetalRadar.jsx
frontend/src/components/ui/NordCharts.jsx        // exports GradientBarReport, SmoothedArea, Donut, SparkBars, MultilineChart
frontend/src/styles/nord.css                     // card, kpi, dbar, insight, heat classes
```

## Design Tokens (append to index.css)

```css
:root {
  --accent-h: 295;
  --accent:       oklch(0.70 0.20 var(--accent-h));
  --accent-deep:  oklch(0.48 0.22 277);
  --accent-cool:  oklch(0.72 0.18 335);
  --accent-strong:oklch(0.62 0.24 var(--accent-h));

  --bg:         oklch(0.14 0.01 280);
  --bg-raised:  oklch(0.17 0.013 285);
  --bg-card:    oklch(0.19 0.015 285);
  --bg-card-2:  oklch(0.22 0.018 288);
  --line:       oklch(0.30 0.015 285 / 0.55);
  --line-soft:  oklch(0.30 0.015 285 / 0.25);

  --fg:      oklch(0.97 0.005 285);
  --fg-mute: oklch(0.75 0.01 285);
  --fg-dim:  oklch(0.55 0.01 285);

  --good: oklch(0.78 0.15 150);
  --warn: oklch(0.78 0.15 70);
  --bad:  oklch(0.68 0.20 25);

  --radius-lg: 22px;
  --radius-md: 14px;
  --radius-sm: 10px;

  --sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}

[data-theme="light"] {
  --bg:        oklch(0.985 0.003 285);
  --bg-raised: oklch(0.96 0.004 285);
  --bg-card:   #ffffff;
  --bg-card-2: oklch(0.97 0.005 285);
  --line:      oklch(0.15 0.01 285 / 0.10);
  --line-soft: oklch(0.15 0.01 285 / 0.06);
  --fg:        oklch(0.18 0.01 285);
  --fg-mute:   oklch(0.35 0.01 285);
  --fg-dim:    oklch(0.55 0.01 285);
}
```

## Screens / Views

### 1. Topbar + Pagehead
- Brand mark (28×28 violet-gradient square, "N")
- Breadcrumb: `/ Workspace / Deep Analytics`
- Right-aligned controls: window segmented toggle `[30d|60d|90d]`, domain filter chip, theme toggle (☾/☀)
- Pagehead: h1 with inline `<em>` gradient-text span for the window number, muted subcopy (max 58ch), right-aligned meta strip (Window / Observations / Last sync) in mono uppercase

### 2. Hero row (12-col grid, 16px gap)

**2a — Life Balance · Petal Projection** (col-6, `.card.card--dark`)
- Compact **PetalRadar** (size 220, padding 38) on the left (0.7fr)
- Composite score KPI on right (1fr): mono eyebrow "COMPOSITE SCORE" → 54px number with `/100` small suffix → `▲ +4.2 vs prev window` delta
- Below KPI: 5-row domain bar strip (`.dbar`) with gradient fill, right-aligned mono value

**2b — Deep Work Report** (col-6, `.card.card--dark`)
- Eyebrow "▮ Deep work report" · "Last 10 sessions"
- Big KPI `38.4hrs` with green delta `▲ +19.0%`
- **GradientBarReport** — vertical bars with violet→cyan gradient, each labeled with small mono value above, x-tick below
- Footer strip: Peak block · Cadence

### 3. Chapter 01 · Lenses

**3a — Smoothed rating** (col-8) — 30-day `SmoothedArea`, pin annotation at peak day
**3b — Expense composition** (col-4) — Donut (200px, thickness 20) stacked **vertically** above a **3-row** legend + "+ N more" hint (don't cram all 6 rows)

### 4. KPI strip (4× col-3 mini cards)
Sleep debt · Screen time · Daily spend · Meaningful convos. Each card: eyebrow + optional right-aligned status flag (warn/bad), big number, hint, then 7-bar `SparkBars` row with day letters.

### 5. Chapter 02 · Trendlines

**5a — Momentum vectors** (col-8) — `MultilineChart` with Career as accent series (violet glow + area), Body/Mood as muted gray lines, Mood dashed.
**5b — Income** (col-4) — big `$` KPI + `SparkBars` + 3-row source ledger.

### 6. Chapter 03 · Patterns

**6a — Heat matrix** (col-7) — 9 rows × 14 columns, each cell 22px, color-coded by score bucket. Date header row on top. Legend strip below.
**6b — Insight rail** (col-5) — `.insight` cards with colored left rail. Each: meta/confidence line → title → body (max 62ch) → boxed action protocol → Act / Later buttons.

### 7. Chapter 04 · Ledger
Full-width table of all 9 domains: Domain · Score · Δ prev · Trend bar · Signals copy · Status pill. No card padding; let the rows breathe.

### 8. Footer ticker
Mono pill summarizing key metrics (BODY 82 ▲ · MIND 74 ▲ · ...).

## Typography
- **Inter** 400/500/600/700 for all UI copy
- **JetBrains Mono** 500 for numbers in KPIs, ticks, eyebrows, meta strips, status pills
- Heading tracking: `-0.025em` for h1, `-0.02em` for h2, `-0.01em` for card titles
- Eyebrow labels: 11px mono, `letter-spacing: 0.12em`, `text-transform: uppercase`, `color: var(--fg-dim)`
- Big KPI: `clamp(40px, 4vw, 54px)`, weight 700, tracking `-0.035em`, `font-feature-settings: "tnum"`

## Chart Components — Porting Notes

All chart components in `design/components/` use the global-window pattern for the prototype. Convert to ES modules when porting:

**PetalRadar.jsx** — `size=220, padding=38, rings=4`. Rounded closed Catmull-Rom spline. SVG `<defs>` contains a `radialGradient` fill, a Gaussian-blur `filter`, and a linear-gradient stroke. Labels positioned at `radius + 18` with `fill: var(--fg)`, 9.5px, weight 600. **Important:** we removed the outer tick-number ring (0/10/15/20…) because it crowded the 9 domain labels.

**GradientBarReport.jsx** — vertical bars, `rx = bw/2` (pill-shaped). Highlighted bar gets `url(#barGrad)` + drop-shadow; rest get muted `url(#barGradDim)`. Value label floats above each bar.

**SmoothedArea.jsx** — Catmull-Rom smoothed path + area fill with vertical gradient to transparent. Optional pin: vertical dashed line + 5px circle + 9px halo + 84×34px tag with mono eyebrow + sans value.

**Donut.jsx** — SVG arcs with per-segment gradient (start → end color), `strokeLinecap: round`, 3px gap between segments (`a2 = acc + len - 0.03`), drop-shadow glow matching each segment color, center numeric + mono label.

**SparkBars.jsx** — plain CSS flexbox bars (not SVG). Active bar uses full accent gradient + glow; dim bars use `color-mix(var(--fg) 22%, transparent)`.

**MultilineChart.jsx** — Catmull-Rom smoothed lines. Series at `accentSeries` index gets a filled area underneath + violet drop-shadow glow; others render as 1.6px muted strokes (optionally dashed).

## Interactions & Behavior

- **Window toggle** (30/60/90d): re-fetches `/entries/history?days=N` — your existing `useEffect` in InsightsTab already does this. Persist to `localStorage` key `nord-window`.
- **Theme toggle**: `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`, persist to `localStorage` key `nord-theme`.
- **Accent hue**: expose via CSS var `--accent-h` (0-360). Default 295.
- **Insight cards**: keep your existing `handleFeedback(insight, 'acted' | 'helpful' | 'dismissed')` posting to `/insights/feedback`.
- **Heat cell hover**: title attribute with `{domain} · {date} · {score}`.
- **Petal radar**: static in v1 (no hover interaction). Add hover-to-highlight domain in v2.

## Data Bindings

Map your existing InsightsTab computed data to the new components:

```jsx
// Petal radar
<PetalRadar items={domainScores} size={220} padding={38} />
// domainScores already = [{ label, value }, ...]

// Composite score big number
<div className="kpi-big__value">{overall}<small>/100</small></div>

// 5-row domain bars under KPI
{domainScores.slice(0, 5).map(d => <DBar key={d.label} {...d} />)}

// Gradient bar report (Deep work / Motivation)
<GradientBarReport
  data={motivationSpectrumData.map((s, i) => ({ label: String(i+1).padStart(2,'0'), value: s.score }))}
  highlightIdx={motivationSpectrumData.reduce((best,s,i,arr) => s.score > arr[best].score ? i : best, 0)}
/>

// Smoothed area (30-day day rating)
<SmoothedArea
  data={history.slice(-30).map((e, i) => ({ label: String(i+1), v: Number(e.reflect?.dayRating) || 0 }))}
  height={200}
  pinIdx={...index of max...}
  pinLabel="PEAK"
/>

// Donut (expense composition) — aggregate finance categories from history
<Donut segments={expenseSegments} size={200} thickness={20}
       centerValue={`$${(total/1000).toFixed(1)}k`} centerLabel="This month" />

// KPI mini-cards
<MiniKpi label="Sleep debt" value={`${summary.weeklyIntel.sleepDebt}h`} values={sleepWeek} labels={weekDayLetters} ... />

// Multiline chart
<MultilineChart
  series={[
    { name: 'Career', data: trendData.map(t => t.Career), color: 'var(--accent)' },
    { name: 'Body',   data: trendData.map(t => t.Body),   color: 'var(--fg-dim)' },
    { name: 'Mood',   data: trendData.map(t => t.Mood),   color: 'var(--fg-dim)', dashed: true },
  ]}
  labels={trendData.map(t => t.name)}
  accentSeries={0}
/>

// Heat matrix — you already compute cells via calcScore([entryForDay], domain)

// Insight rail — map activeInsights to .insight cards
```

## Assets
No raster assets used. All visuals are SVG + CSS. Fonts loaded from Google Fonts (Inter + JetBrains Mono). No icon library needed — glyphs (◆, ▮, ☉, ◉, ↗, ⊛, ▦, ▸) are plain Unicode.

## Light-mode specifics (don't skip)
The `.card--dark` variant needs an explicit light-mode override using high specificity:

```css
html[data-theme="light"] .card.card--dark {
  background:
    radial-gradient(120% 140% at 0% 0%, color-mix(in oklch, var(--accent) 12%, transparent) 0%, transparent 60%),
    linear-gradient(180deg, #ffffff 0%, oklch(0.97 0.008 285) 100%) !important;
  border-color: color-mix(in oklch, var(--accent) 22%, var(--line)) !important;
  color: var(--fg) !important;
}
```
Without the `html[data-theme="light"]` prefix + `!important`, the stacked-background shorthand on `.card--dark` wins and both hero cards stay dark in light mode.

## Files in this bundle

- `design/Insights Dashboard.html` — full prototype, open in a browser
- `design/styles.css` — all design-system classes (`.card`, `.kpi-big`, `.dbar`, `.insight`, `.heat`, `.ticker`, `.seg`, `.chip`…)
- `design/components/PetalRadar.jsx` — petal radar SVG
- `design/components/Charts.jsx` — GradientBarReport, SmoothedArea, Donut, SparkBars, MultilineChart
- `design/components/App.jsx` — full composition, illustrative data

## Suggested Implementation Order

1. Add fonts to `frontend/index.html`; paste tokens into `frontend/src/index.css`
2. Create `ui/PetalRadar.jsx` and `ui/NordCharts.jsx` (convert the bundled files from global-window to ESM exports: `export default PetalRadar`, `export function GradientBarReport…`, replace `const { useMemo } = React` with `import`s)
3. Copy the card/kpi/dbar/insight/heat/ticker/seg classes from `design/styles.css` into `frontend/src/styles/nord.css`, import it from `App.jsx`
4. Rewrite `InsightsTab.jsx` JSX section-by-section against the composition in `design/components/App.jsx`, keeping your real data bindings
5. Delete obsolete `PremiumRadar.jsx` and (optionally) `WhoopAnalytics.jsx`
6. Verify light-mode parity — test the `[data-theme="light"] .card--dark` override

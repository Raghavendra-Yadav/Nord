import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { calculateScore } from '../utils/analyticsEngine';
import PetalRadar from './ui/PetalRadar';
import { SparkBars, MultilineChart } from './ui/NordCharts';

export default function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/entries/history?days=7');
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analysing this week…</div>;
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--notion-gray-text)' }}>
        <p>No data recorded yet this week.</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>Log today's entry first.</p>
      </div>
    );
  }

  // ---- Weekly intelligence (unchanged logic) ----
  const intel = (() => {
    const last7 = history;
    const wins = last7.filter(e => Number(e.reflect?.dayRating) >= 7).length;
    const losses = 7 - wins;
    const targetSleep = 7.5;
    const sleepDebt = last7.reduce((acc, e) => acc + (targetSleep - (Number(e.body?.sleepH) || targetSleep)), 0).toFixed(1);
    const dayRatings = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    last7.forEach(e => {
      const d = new Date(e.date + 'T00:00:00').getDay();
      const s = (Number(e.reflect?.dayRating) || 0) + (Number(e.career?.deepWorkBlocks) || 0) * 2;
      if (!dayRatings[d]) dayRatings[d] = [];
      dayRatings[d].push(s);
    });
    let bestIdx = -1, maxAvg = -1;
    Object.keys(dayRatings).forEach(d => {
      const avg = dayRatings[d].reduce((a, b) => a + b, 0) / dayRatings[d].length;
      if (avg > maxAvg) { maxAvg = avg; bestIdx = d; }
    });
    const creation = last7.reduce((acc, e) => acc + (Number(e.career?.deepWorkBlocks) || 0) + ((Number(e.mind?.meditMin) || 0) / 60), 0);
    const noise = last7.reduce((acc, e) => acc + (Number(e.vices?.screenT) || 0), 0);
    const eq = creation === 0 ? 0 : Math.min(100, Math.round((creation / (creation + noise)) * 100));
    return { wins, losses, sleepDebt, primeDay: bestIdx !== -1 ? dayNames[bestIdx] : 'N/A', eq };
  })();

  // ---- Radar / domain data ----
  const domains = ['Body', 'Mind', 'Career', 'Social', 'Vices', 'Reflect'];
  const radarItems = domains.map(domain => {
    let sum = 0, count = 0;
    history.forEach(e => {
      const s = calculateScore(e, domain);
      if (s !== null) { sum += s; count++; }
    });
    return { label: domain, value: count > 0 ? Math.round(sum / count) : 0 };
  });

  // ---- Spark data ----
  const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const sleepWeek = history.map(e => Number(e.body?.sleepH) || 0);
  const moodWeek = history.map(e => Number(e.mood?.mood) || 0);
  const energyWeek = history.map(e => Number(e.mood?.energy) || 0);

  // ---- MultilineChart for mood+energy ----
  const trendLabels = history.map(e => new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }));
  const trendSeries = [
    { name: 'Mood', data: moodWeek, color: 'var(--accent)' },
    { name: 'Energy', data: energyWeek, color: 'var(--fg-dim)', dashed: true },
  ];

  const heatColor = (v) => {
    if (v == null || v === 0) return 'oklch(0.25 0.01 285 / 0.12)';
    if (v < 35) return 'oklch(0.45 0.18 25 / 0.55)';
    if (v < 60) return 'oklch(0.55 0.12 70 / 0.45)';
    if (v < 80) return 'oklch(0.62 0.18 295 / 0.45)';
    return 'oklch(0.72 0.22 295 / 0.85)';
  };

  // 9-domain heat strip (same domains as InsightsTab)
  const allDomains = ['Body', 'Mind', 'Mood', 'Vices', 'Career', 'Finance', 'Relations', 'Environment', 'Reflect'];

  return (
    <div style={{ paddingBottom: 80, animation: 'smoothDropIn 0.3s ease forwards' }}>

      {/* ===== KPI Strip ===== */}
      <div className="grid" style={{ marginBottom: 20 }}>

        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label card__label--pair">
            <span>▸ Weekly record</span>
          </div>
          <div className="kpi-big" style={{ marginBottom: 8 }}>
            <div className="kpi-big__value" style={{ fontSize: 36 }}>
              <span style={{ color: 'var(--good)' }}>{intel.wins}W</span>
              <span style={{ color: 'var(--fg-dim)', fontSize: '0.5em', fontWeight: 500, marginLeft: 6 }}>/ 7</span>
            </div>
            <div className="kpi-big__delta kpi-big__delta--down">
              {intel.losses}L — days below 7/10
            </div>
          </div>
        </section>

        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label card__label--pair">
            <span>▸ Sleep debt</span>
            {Number(intel.sleepDebt) > 5 && (
              <span className="card__flag bad"><span className="dot" />High</span>
            )}
          </div>
          <div className="kpi-big" style={{ marginBottom: 6 }}>
            <div className="kpi-big__value tnum" style={{ fontSize: 36 }}>{intel.sleepDebt}h</div>
            <div className="kpi-big__delta kpi-big__delta--down">vs 7.5h target</div>
          </div>
          <SparkBars values={sleepWeek.length > 0 ? sleepWeek : [0]} labels={weekLabels} />
        </section>

        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label">▸ Essentialism quotient</div>
          <div className="kpi-big" style={{ marginBottom: 10 }}>
            <div className="kpi-big__value tnum" style={{ fontSize: 36 }}>{intel.eq}%</div>
            <div className="kpi-big__delta">creation vs noise ratio</div>
          </div>
          <div className="dbar__track">
            <div
              className={`dbar__fill${intel.eq < 30 ? ' dbar__fill--bad' : intel.eq < 60 ? ' dbar__fill--warn' : ''}`}
              style={{ '--v': `${intel.eq}%` }}
            />
          </div>
        </section>

        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label">▸ Prime output day</div>
          <div className="kpi-big">
            <div className="kpi-big__value" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>{intel.primeDay}</div>
            <div className="kpi-big__delta kpi-big__delta--up">peak performance</div>
          </div>
        </section>
      </div>

      {/* ===== Life Balance + Domain Scores ===== */}
      <div className="grid" style={{ marginBottom: 16 }}>
        <section className="card card--dark col-5" style={{ padding: 22 }}>
          <div className="card__label card__label--pair">
            <span>◆ Life balance · petal projection</span>
            <span>7d avg</span>
          </div>
          <div style={{ aspectRatio: '1/1', maxWidth: 240, margin: '0 auto' }}>
            <PetalRadar items={radarItems} size={220} padding={38} />
          </div>
        </section>

        <section className="card col-7" style={{ padding: 22 }}>
          <div className="card__label" style={{ marginBottom: 16 }}>◈ Domain scores · 7-day average</div>
          <div className="dbars">
            {radarItems.map(d => (
              <div key={d.label} className="dbar">
                <div className="dbar__label">{d.label}</div>
                <div className="dbar__track">
                  <div
                    className={`dbar__fill${d.value < 50 ? ' dbar__fill--bad' : d.value < 70 ? ' dbar__fill--warn' : ''}`}
                    style={{ '--v': `${d.value}%` }}
                  />
                </div>
                <div className="dbar__value">{d.value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== Mood & Energy Trend ===== */}
      <div className="grid" style={{ marginBottom: 16 }}>
        <section className="card col-8" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>↗ Mood & energy pulse · 7 days</span>
            <span>self-reported</span>
          </div>
          <div className="legend" style={{ margin: '6px 0 14px' }}>
            <span><i style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />Mood</span>
            <span><i style={{ background: 'var(--fg-dim)', opacity: 0.6 }} />Energy</span>
          </div>
          {trendLabels.length > 1 && (
            <MultilineChart series={trendSeries} labels={trendLabels} height={200} accentSeries={0} />
          )}
        </section>

        <section className="card col-4" style={{ padding: 22 }}>
          <div className="card__label" style={{ marginBottom: 12 }}>▸ Mood spark</div>
          <SparkBars values={moodWeek.length > 0 ? moodWeek : [0]} labels={weekLabels} />
          <div style={{ marginTop: 16 }}>
            <div className="card__label" style={{ marginBottom: 12 }}>▸ Energy spark</div>
            <SparkBars values={energyWeek.length > 0 ? energyWeek : [0]} labels={weekLabels} />
          </div>
        </section>
      </div>

      {/* ===== 9-Domain Heat Strip ===== */}
      <div className="grid" style={{ marginBottom: 16 }}>
        <section className="card col-12" style={{ padding: 22 }}>
          <div className="card__label card__label--pair" style={{ marginBottom: 14 }}>
            <span>▦ Domain intensity · this week</span>
            <span>row = domain · column = day</span>
          </div>
          <div className="heat">
            <div className="heat__rowlabels">
              <div className="heat__rowlabel" style={{ opacity: 0 }}>_</div>
              {allDomains.map(d => <div key={d} className="heat__rowlabel">{d}</div>)}
            </div>
            <div>
              <div className="heat__dates" style={{ gridTemplateColumns: `repeat(${history.length}, minmax(18px, 1fr))` }}>
                {history.map((e, i) => (
                  <span key={i}>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                ))}
              </div>
              <div className="heat__rows">
                {allDomains.map(domain => (
                  <div key={domain} className="heat__row" style={{ gridTemplateColumns: `repeat(${history.length}, minmax(18px, 1fr))` }}>
                    {history.map((e, xi) => {
                      const v = calculateScore(e, domain);
                      return (
                        <div key={xi} className="heat__cell"
                          style={{ '--c': heatColor(v) }}
                          title={`${domain} · ${e.date} · ${v ?? 'No log'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="legend">
            <span><i style={{ background: heatColor(null) }} />No log</span>
            <span><i style={{ background: heatColor(30) }} />0–35</span>
            <span><i style={{ background: heatColor(50) }} />35–60</span>
            <span><i style={{ background: heatColor(70) }} />60–80</span>
            <span><i style={{ background: heatColor(90) }} />80–100</span>
          </div>
        </section>
      </div>

      {/* ===== Weekly Log Feed ===== */}
      <div className="sec-head" style={{ marginTop: 24 }}>
        <div>
          <div className="sec-head__no">This week</div>
          <h2>Daily log feed</h2>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...history].reverse().map(entry => {
          const rating = Number(entry.reflect?.dayRating) || 0;
          const isWin = rating >= 7;
          return (
            <div key={entry._id} className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isWin ? 'var(--good)' : 'var(--fg-dim)', letterSpacing: '0.08em' }}>
                    {isWin ? '● WIN' : '○ —'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--notion-gray-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.reflect?.wins || 'Day maintained with steady discipline.'}
                </p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: isWin ? 'color-mix(in oklch, var(--good) 12%, transparent)' : 'color-mix(in oklch, var(--fg) 6%, transparent)',
                border: `1px solid ${isWin ? 'color-mix(in oklch, var(--good) 30%, transparent)' : 'var(--line)'}`,
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14,
                color: isWin ? 'var(--good)' : 'var(--fg-dim)'
              }}>
                {rating || '—'}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

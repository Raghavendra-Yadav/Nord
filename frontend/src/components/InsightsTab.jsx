import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { calculateScore, calculatePearsonCorrelation, calculateIEI } from '../utils/analyticsEngine';
import PetalRadar from './ui/PetalRadar';
import { GradientBarReport, SmoothedArea, Donut, SparkBars, MultilineChart } from './ui/NordCharts';

export default function InsightsTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [windowDays, setWindowDays] = useState(
    () => Number(localStorage.getItem('nord-window')) || 90
  );

  useEffect(() => {
    localStorage.setItem('nord-window', windowDays);
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/entries/history?days=${windowDays}`);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [windowDays]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12 }}>
          Generating Intelligence Matrix…
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)', fontSize: 13, textAlign: 'center' }}>
          No data logged yet.<br />Log today's entry to see your Deep Analytics.
        </div>
      </div>
    );
  }

  // ==========================================
  // DATA COMPILATION (unchanged from original)
  // ==========================================
  const calcScore = (entriesArr, domain) => {
    let sum = 0, count = 0;
    entriesArr.forEach(entry => {
      const s = calculateScore(entry, domain);
      if (s !== null) { sum += s; count++; }
    });
    return count > 0 ? Math.round(sum / count) : null;
  };

  const domains = ['Body', 'Mind', 'Mood', 'Vices', 'Career', 'Finance', 'Relations', 'Environment', 'Reflect'];

  const radarData = domains.map(domain => ({
    subject: domain,
    Score: calcScore(history, domain),
    fullMark: 100
  }));
  const domainScores = radarData.map(d => ({ label: d.subject, value: d.Score ?? 0 }));
  const overall = domainScores.length > 0
    ? Math.round(domainScores.reduce((a, b) => a + (Number(b.value) || 0), 0) / domainScores.length)
    : 0;

  // Overall delta: compare second half vs first half of history
  const halfIdx = Math.floor(history.length / 2);
  const prevHalf = history.slice(0, halfIdx);
  const prevOverall = prevHalf.length > 0
    ? Math.round(domains.reduce((s, d) => s + (calcScore(prevHalf, d) || 0), 0) / domains.length)
    : overall;
  const overallDelta = (overall - prevOverall).toFixed(1);

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const weeklyGroups = {};
  [...history].forEach(entry => {
    const d = new Date(entry.date + 'T00:00:00');
    const weekKey = `W${getWeekNumber(d)}`;
    if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = [];
    weeklyGroups[weekKey].push(entry);
  });

  const trendData = Object.keys(weeklyGroups).map(week => {
    const weekEntries = weeklyGroups[week];
    return {
      name: week,
      Career: calcScore(weekEntries, 'Career'),
      Mood: calcScore(weekEntries, 'Mood'),
      Body: calcScore(weekEntries, 'Body')
    };
  });

  const recent14 = [...history].reverse().slice(0, 14).reverse();

  const financeData = recent14.map(e => ({
    date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    Spent: Number(e.finance?.spent) || 0
  }));

  const motivationSpectrumData = recent14.map(e => calculateIEI(e));

  const summary = (() => {
    const slice = [...history].slice(-14);
    const avgIEI = motivationSpectrumData.length > 0
      ? Math.round(motivationSpectrumData.reduce((a, b) => a + (Number(b) || 0), 0) / motivationSpectrumData.length)
      : 0;

    const top = domains.map(d => ({ d, s: calcScore(slice, d) })).sort((a, b) => b.s - a.s)[0];
    const low = domains.map(d => ({ d, s: calcScore(slice, d) })).sort((a, b) => a.s - b.s)[0];

    const momentum = (() => {
      const recent = [...history].reverse().slice(0, 7);
      const previous = [...history].reverse().slice(7, 14);
      const calcAvg = (arr) => {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((acc, entry) => {
          let daySum = 0;
          domains.forEach(d => daySum += calcScore([entry], d) || 0);
          return acc + (daySum / domains.length);
        }, 0);
        return sum / arr.length;
      };
      const avgRecent = calcAvg(recent);
      const avgPrev = calcAvg(previous);
      const diff = avgRecent - avgPrev;
      return { score: Math.round(avgRecent), diff: diff.toFixed(1), status: diff > 2 ? 'Winning' : diff < -2 ? 'Slumping' : 'Steady' };
    })();

    const dopamineDebt = (() => {
      const today = [...history].reverse()[0];
      if (!today) return { ratio: 0, status: 'Neutral' };
      const consumption = (Number(today.vices?.screenT) || 0) * 20;
      const creation = ((Number(today.career?.deepWorkBlocks) || 0) * 30) + ((Number(today.mind?.meditMin) || 0) * 2);
      const ratio = creation === 0 ? (consumption > 0 ? 100 : 0) : Math.min(100, Math.round((consumption / Math.max(creation, 1)) * 50));
      return { ratio, status: ratio > 60 ? 'Debt' : ratio < 30 ? 'Recovered' : 'Balanced' };
    })();

    const weeklyIntel = (() => {
      const last7 = [...history].reverse().slice(0, 7);
      const targetSleep = 7.5;
      const debt = last7.reduce((acc, e) => acc + (targetSleep - (Number(e.body?.sleepH) || targetSleep)), 0);
      const dayRatings = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      last7.forEach(e => {
        const day = new Date(e.date + 'T00:00:00').getDay();
        const score = (Number(e.reflect?.dayRating) || 0) + (Number(e.career?.deepWorkBlocks) || 0) * 2;
        if (!dayRatings[day]) dayRatings[day] = [];
        dayRatings[day].push(score);
      });
      let bestDayIdx = -1, maxAvg = -1;
      Object.keys(dayRatings).forEach(day => {
        const avg = dayRatings[day].reduce((a, b) => a + b, 0) / dayRatings[day].length;
        if (avg > maxAvg) { maxAvg = avg; bestDayIdx = day; }
      });
      return {
        sleepDebt: debt.toFixed(1),
        primeDay: bestDayIdx !== -1 ? dayNames[bestDayIdx] : 'N/A'
      };
    })();

    const weeklyScorecard = (() => {
      const last7 = [...history].reverse().slice(0, 7);
      const wins = last7.filter(e => Number(e.reflect?.dayRating) >= 7).length;
      const losses = last7.length - wins;
      const meaningful = last7.filter(e => e.relations?.meaningConvo === 'yes').length;
      const scq = Math.round((meaningful / 7) * 100);
      const creationHours = last7.reduce((acc, e) =>
        acc + (Number(e.career?.deepWorkBlocks) || 0) + ((Number(e.mind?.meditMin) || 0) / 60) + ((Number(e.mind?.readMin) || 0) / 60), 0);
      const consumptionHours = last7.reduce((acc, e) => acc + (Number(e.vices?.screenT) || 0), 0);
      const eq = creationHours === 0 ? 0 : Math.min(100, Math.round((creationHours / (creationHours + consumptionHours)) * 100));
      return { wins, losses, scq, eq };
    })();

    return { avgIEI, top, low, momentum, dopamineDebt, weeklyIntel, weeklyScorecard };
  })();

  // ==========================================
  // BEHAVIORAL INTELLIGENCE ENGINE
  // ==========================================
  const generateInsights = () => {
    const rawInsights = [];
    const sleepMoodCorr = calculatePearsonCorrelation(history, 'body.sleepH', 'reflect.dayRating');
    if (Math.abs(sleepMoodCorr) > 0.4) {
      rawInsights.push({
        id: 'sleep-mood-pearson',
        tag: 'Statistical signal',
        rail: 'var(--accent)',
        title: `Sleep ↔ Day Rating correlation: ${(sleepMoodCorr * 100).toFixed(0)}%`,
        body: `${Math.abs(sleepMoodCorr * 100).toFixed(0)}% of your daily performance variance is explained by the previous night's sleep. This is your most predictive lever.`,
        action: 'Maintain',
        actionText: sleepMoodCorr > 0 ? 'Defend your sleep window. Skip the late sync on Thursdays.' : 'Your baseline is volatile. Prioritize an 8h sleep lock.'
      });
    }
    const screenWorkCorr = calculatePearsonCorrelation(history, 'vices.screenT', 'career.deepWorkBlocks');
    if (screenWorkCorr < -0.3) {
      rawInsights.push({
        id: 'screen-work-friction',
        tag: 'Systemic friction',
        rail: 'var(--warn)',
        title: `Digital capture coefficient: ${(screenWorkCorr * 100).toFixed(0)}%`,
        body: `Every extra hour of phone usage is mathematically eroding your professional depth. ${(screenWorkCorr * 100).toFixed(0)}% inverse correlation detected.`,
        action: 'Protocol',
        actionText: 'Phone parked away 9pm → 8am for 7 days. Re-measure next Monday.'
      });
    }
    const recent14Insights = [...history].reverse().slice(0, 14);
    const scores = domains.map(d => ({ name: d, score: calcScore(recent14Insights, d) }));
    const neglected = scores.filter(s => s.score !== null && s.score < 40);
    const strong = scores.filter(s => s.score !== null && s.score >= 80);
    if (neglected.length > 0 && strong.length > 0) {
      const weakest = neglected.sort((a, b) => a.score - b.score)[0];
      const strongest = strong.sort((a, b) => b.score - a.score)[0];
      rawInsights.push({
        id: 'radar-imbalance',
        tag: 'Balance alert',
        rail: 'var(--bad)',
        title: `${strongest.name} is cannibalising ${weakest.name}`,
        body: `${strongest.name} surged to ${strongest.score}/100 recently. In the same window, ${weakest.name} dropped to ${weakest.score}. The system is out of equipoise.`,
        action: 'Counterweight',
        actionText: `Two low-stakes ${weakest.name.toLowerCase()} sessions this week. Cancel one deep-work block to create the slot.`
      });
    }
    const highScreenDays = recent14Insights.filter(d => Number(d.vices?.screenT || 0) > 4.5);
    if (highScreenDays.length >= 4) {
      rawInsights.push({
        id: 'screen-time-spiral',
        tag: 'Anomaly',
        rail: 'var(--bad)',
        title: 'Digital consumption spiral',
        body: `You've logged over 4.5 hours of screen time on ${highScreenDays.length} of the last 14 days. This is a severe dopamine leak compressing output.`,
        action: 'Reset',
        actionText: 'Put phone in another room at 8 PM for the next 3 days.'
      });
    }
    return rawInsights.filter(insight => !dismissedInsights.includes(insight.id));
  };

  const activeInsights = generateInsights();

  const handleFeedback = async (insight, actionType) => {
    setDismissedInsights([...dismissedInsights, insight.id]);
    try {
      await api.post('/insights/feedback', {
        insightId: insight.id,
        category: insight.tag,
        actionType,
        context: { title: insight.title }
      });
    } catch (err) {
      console.error('Failed to log behavioral feedback', err);
    }
  };

  // ==========================================
  // DERIVED CHART DATA
  // ==========================================

  // Last 30 days of day ratings for SmoothedArea
  const ratingData30 = history.slice(-30).map((e, i) => ({
    label: String(i + 1),
    v: Number(e.reflect?.dayRating) || 0
  }));
  const pinIdx30 = ratingData30.reduce((best, d, i, arr) => d.v > arr[best].v ? i : best, 0);
  const peakRating = ratingData30[pinIdx30]?.v ?? 0;
  const avgRating = ratingData30.length > 0
    ? (ratingData30.reduce((s, d) => s + d.v, 0) / ratingData30.length).toFixed(1)
    : '0.0';

  // GradientBarReport data from motivationSpectrumData (IEI scores)
  const barReportData = motivationSpectrumData.map((s, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: Number(s) || 0
  }));
  const barHighlightIdx = barReportData.reduce(
    (best, d, i, arr) => d.value > arr[best].value ? i : best, 0
  );

  // Deep work total hours (last 14 days, 1.5h per block)
  const deepWorkHrs = recent14.reduce((sum, e) => sum + (Number(e.career?.deepWorkBlocks) || 0) * 1.5, 0);
  const prevDeepWorkHrs = prevHalf.slice(-14).reduce((sum, e) => sum + (Number(e.career?.deepWorkBlocks) || 0) * 1.5, 0);
  const deepWorkDeltaPct = prevDeepWorkHrs > 0
    ? (((deepWorkHrs - prevDeepWorkHrs) / prevDeepWorkHrs) * 100).toFixed(1)
    : '0.0';

  // Expense donut: aggregate from financeData (total only — no category breakdown in API)
  const totalSpent = financeData.reduce((sum, d) => sum + d.Spent, 0);
  const expenseSegments = totalSpent > 0 ? [
    { label: 'Spending', value: totalSpent, color: 'oklch(0.68 0.20 295)' }
  ] : [
    { label: 'No data', value: 1, color: 'var(--line)' }
  ];

  // Finance KPI — total income/spend for recent month
  const totalFinanceSpent = history.slice(-30).reduce((s, e) => s + (Number(e.finance?.spent) || 0), 0);

  // Last 7 day arrays for MiniKpi spark bars
  const last7 = [...history].reverse().slice(0, 7).reverse();
  const sleepWeek = last7.map(e => Number(e.body?.sleepH) || 0);
  const screenWeek = last7.map(e => Number(e.vices?.screenT) || 0);
  const spendWeek = last7.map(e => Number(e.finance?.spent) || 0);
  const convoWeek = last7.map(e => e.relations?.meaningConvo === 'yes' ? 100 : 10);
  const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const avgScreenTime = screenWeek.length > 0
    ? (screenWeek.reduce((a, b) => a + b, 0) / screenWeek.length).toFixed(1)
    : '0.0';
  const avgDailySpend = spendWeek.length > 0
    ? (spendWeek.reduce((a, b) => a + b, 0) / spendWeek.length).toFixed(0)
    : '0';
  const meaningfulConvoPct = Math.round((last7.filter(e => e.relations?.meaningConvo === 'yes').length / Math.max(last7.length, 1)) * 100);

  // 14-day dates for heat matrix
  const days14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return { num: d.getDate(), date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2).toUpperCase() };
  });

  const heatColor = (v) => {
    if (v == null) return 'oklch(0.25 0.01 285 / 0.15)';
    if (v < 35) return 'oklch(0.45 0.18 25 / 0.55)';
    if (v < 60) return 'oklch(0.55 0.12 70 / 0.55)';
    if (v < 80) return 'oklch(0.62 0.18 295 / 0.55)';
    return 'oklch(0.72 0.22 295 / 0.95)';
  };

  // Domain ledger with delta vs prev window
  const domainLedger = domains.map(d => {
    const score = calcScore(history, d) ?? 0;
    const prev = calcScore(prevHalf, d) ?? score;
    return { name: d, score, delta: score - prev };
  });

  // Trendline series
  const trendWeeks = trendData.map(t => t.name);
  const multiSeries = [
    { name: 'Career', data: trendData.map(t => t.Career), color: 'var(--accent)' },
    { name: 'Body', data: trendData.map(t => t.Body), color: 'var(--fg-dim)' },
    { name: 'Mood', data: trendData.map(t => t.Mood), color: 'var(--fg-dim)', dashed: true },
  ];

  // Spark bars for finance section
  const financeSparkValues = spendWeek.length > 0 ? spendWeek : [0];

  // Days above target rating
  const daysAboveTarget = ratingData30.filter(d => d.v >= 7.5).length;

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--notion-border)' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: 8 }}>Deep Analytics</h2>
          <p style={{ color: 'var(--notion-gray-text)', fontSize: 14, maxWidth: '58ch' }}>
            A behavioural map of 9 life domains over the last <strong>{windowDays} days</strong> — {history.length} observations.
          </p>
        </div>
        <div className="seg" role="tablist" style={{ flexShrink: 0, marginTop: 4 }}>
          {[30, 60, 90].map(n => (
            <button key={n} data-active={windowDays === n} onClick={() => setWindowDays(n)}>{n}d</button>
          ))}
        </div>
      </div>

      {/* ===== Hero row ===== */}
      <div className="grid">

        {/* 2a — Life Balance · Petal Projection */}
        <section className="card card--dark col-6" style={{ padding: 26 }}>
          <div className="card__label card__label--pair">
            <span>◆ Life balance · petal projection</span>
            <span>{windowDays}d window</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr', gap: 20, alignItems: 'center' }}>
            <div style={{ aspectRatio: '1/1', position: 'relative' }}>
              <PetalRadar items={domainScores} size={220} padding={38} />
            </div>
            <div>
              <div className="kpi-big">
                <div className="mono small dim" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>Composite score</div>
                <div className="kpi-big__value">{overall}<small>/100</small></div>
                <div className={`kpi-big__delta kpi-big__delta--${Number(overallDelta) >= 0 ? 'up' : 'down'}`}>
                  {Number(overallDelta) >= 0 ? '▲' : '▼'} {overallDelta > 0 ? '+' : ''}{overallDelta} <span>vs prev window</span>
                </div>
              </div>
              <div className="dbars" style={{ marginTop: 24 }}>
                {domainScores.slice(0, 5).map(d => (
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
            </div>
          </div>
        </section>

        {/* 2b — Deep Work Report */}
        <section className="card card--dark col-6" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
          <div className="card__label card__label--pair">
            <span>▮ Deep work report</span>
            <span>Last {barReportData.length} sessions</span>
          </div>
          <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="kpi-big">
              <div className="kpi-big__value tnum">
                {deepWorkHrs.toFixed(1)}<small>hrs</small>
              </div>
              <div className={`kpi-big__delta kpi-big__delta--${Number(deepWorkDeltaPct) >= 0 ? 'up' : 'down'} mono`}>
                {Number(deepWorkDeltaPct) >= 0 ? '▲' : '▼'} {deepWorkDeltaPct > 0 ? '+' : ''}{deepWorkDeltaPct}%&nbsp;&nbsp;
                <span>{prevDeepWorkHrs.toFixed(1)} prev / {deepWorkHrs.toFixed(1)} current</span>
              </div>
            </div>
            <div className="legend" style={{ marginTop: 0 }}>
              <span><i style={{ background: 'linear-gradient(180deg, var(--accent-cool), var(--accent-deep))' }} />Session depth</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 180 }}>
            <GradientBarReport data={barReportData} highlightIdx={barHighlightIdx} />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--fg-mute)' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>Peak block</span>
              <b className="mono" style={{ color: 'var(--fg)' }}>S·{String(barHighlightIdx + 1).padStart(2, '0')} — {barReportData[barHighlightIdx]?.value} pts</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>IEI avg</span>
              <b className="mono" style={{ color: 'var(--fg)' }}>{summary.avgIEI}/100</b>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Chapter 01 · Lenses ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 01 · Lenses</div>
          <h2>Day rating — 30 day trajectory</h2>
        </div>
        <div className="sec-head__side">self-reported · tnum</div>
      </div>

      <div className="grid">
        {/* 3a — Smoothed rating */}
        <section className="card col-8" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>☉ Smoothed rating · 30 days</span>
            <span>Target ≥ 7.5</span>
          </div>
          <div className="row" style={{ gap: 28, alignItems: 'flex-end', marginBottom: 10 }}>
            <div className="kpi-big">
              <div className="kpi-big__value">{peakRating.toFixed(1)}<small>/10</small></div>
              <div className="kpi-big__delta kpi-big__delta--up">▲ avg {avgRating} <span>30-day</span></div>
            </div>
            <div className="stack" style={{ marginBottom: 6, minWidth: 110 }}>
              <div className="mono small dim">Days ≥ target</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{daysAboveTarget} / {ratingData30.length}</div>
            </div>
          </div>
          {ratingData30.length > 1 && (
            <SmoothedArea data={ratingData30} height={200} pinIdx={pinIdx30} pinLabel="PEAK" />
          )}
        </section>

        {/* 3b — Expense composition */}
        <section className="card col-4" style={{ padding: 22 }}>
          <div className="card__label card__label--pair">
            <span>◉ Finance overview</span>
            <span className="mono small dim">14d</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 6 }}>
            <Donut
              segments={expenseSegments}
              size={200}
              thickness={20}
              centerValue={`$${(totalSpent / 1000).toFixed(1)}k`}
              centerLabel="14-day spend"
            />
            <div className="donut-legend" style={{ width: '100%' }}>
              {expenseSegments.slice(0, 3).map(e => (
                <div key={e.label} className="donut-legend__row">
                  <i style={{ background: e.color }} />
                  <span>{e.label}</span>
                  <em>100%</em>
                </div>
              ))}
              <div className="mono small dim" style={{ marginTop: 4, letterSpacing: '0.08em' }}>
                ${(totalSpent / Math.max(recent14.length, 1)).toFixed(0)}/day avg
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== KPI strip ===== */}
      <div className="grid" style={{ marginTop: 16 }}>
        <MiniKpi
          col="col-3"
          label="Sleep debt"
          value={`${summary.weeklyIntel.sleepDebt}h`}
          hint="vs 7.5h nightly target"
          values={sleepWeek.length > 0 ? sleepWeek : [0]}
          labels={weekLabels}
          delta={{ type: Number(summary.weeklyIntel.sleepDebt) < 0 ? 'up' : 'down', text: `${summary.weeklyIntel.sleepDebt}h accumulated` }}
        />
        <MiniKpi
          col="col-3"
          label="Screen time"
          value={`${avgScreenTime}h/d`}
          hint="dopamine load estimate"
          values={screenWeek.length > 0 ? screenWeek : [0]}
          labels={weekLabels}
          flag={Number(avgScreenTime) > 4 ? 'warn' : undefined}
          flagLabel="Elevated"
          delta={{ type: 'up', text: `${avgScreenTime}h 7-day avg`, bad: Number(avgScreenTime) > 4 }}
        />
        <MiniKpi
          col="col-3"
          label="Daily spend"
          value={`$${avgDailySpend}`}
          hint="14-day mean velocity"
          values={spendWeek.length > 0 ? spendWeek : [0]}
          labels={weekLabels}
          delta={{ type: 'down', text: `$${totalSpent.toFixed(0)} 14d total` }}
        />
        <MiniKpi
          col="col-3"
          label="Meaningful convos"
          value={`${meaningfulConvoPct}%`}
          hint="weekly relational pulse"
          values={convoWeek}
          labels={weekLabels}
          flag={meaningfulConvoPct < 40 ? 'bad' : undefined}
          flagLabel="Below floor"
          delta={{ type: meaningfulConvoPct >= 40 ? 'up' : 'down', text: `${last7.filter(e => e.relations?.meaningConvo === 'yes').length} / 7 days`, bad: meaningfulConvoPct < 40 }}
        />
      </div>

      {/* ===== Chapter 02 · Trendlines ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 02 · Trendlines</div>
          <h2>Weekly progression across domains</h2>
        </div>
        <div className="sec-head__side">{trendWeeks.length} weeks · rolling mean</div>
      </div>

      <div className="grid">
        {/* 5a — Momentum vectors */}
        <section className="card col-8" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>↗ Momentum vectors</span>
            <span>Career leading</span>
          </div>
          <div className="legend" style={{ margin: '6px 0 16px' }}>
            <span><i style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />Career · accent</span>
            <span><i style={{ background: 'var(--fg-dim)' }} />Body</span>
            <span><i style={{ background: 'var(--fg-dim)', opacity: 0.5 }} />Mood</span>
          </div>
          {trendWeeks.length > 1 && (
            <MultilineChart series={multiSeries} labels={trendWeeks} height={240} accentSeries={0} />
          )}
        </section>

        {/* 5b — Finance overview */}
        <section className="card col-4" style={{ padding: 22 }}>
          <div className="card__label card__label--pair">
            <span>⊛ Finance</span>
            <span>30d</span>
          </div>
          <div className="kpi-big" style={{ marginBottom: 4 }}>
            <div className="kpi-big__value tnum">${totalFinanceSpent.toFixed(0)}</div>
            <div className="kpi-big__delta kpi-big__delta--down mono">
              ▼ 30d spend<span style={{ marginLeft: 8 }}>track expenses in log</span>
            </div>
          </div>
          <SparkBars
            values={financeSparkValues}
            highlight={financeSparkValues.indexOf(Math.max(...financeSparkValues))}
            labels={weekLabels}
          />
          <div style={{ marginTop: 18, fontSize: 12, color: 'var(--fg-mute)', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>Daily avg</span><b className="mono" style={{ color: 'var(--fg)' }}>${avgDailySpend}</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <span>Peak day</span><b className="mono" style={{ color: 'var(--fg)' }}>${Math.max(...spendWeek, 0).toFixed(0)}</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <span>14d total</span><b className="mono" style={{ color: 'var(--fg)' }}>${totalSpent.toFixed(0)}</b>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Chapter 03 · Patterns ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 03 · Patterns</div>
          <h2>Area intensity matrix · 14 days</h2>
        </div>
        <div className="sec-head__side">row = domain · column = day</div>
      </div>

      <div className="grid">
        {/* 6a — Heat matrix */}
        <section className="card col-7" style={{ padding: 24 }}>
          <div className="card__label card__label--pair">
            <span>▦ Heat matrix</span>
            <span>{days14[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {days14[13]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="heat">
            <div className="heat__rowlabels">
              <div className="heat__rowlabel" style={{ opacity: 0 }}>_</div>
              {domains.map(d => (
                <div key={d} className="heat__rowlabel">{d}</div>
              ))}
            </div>
            <div>
              <div className="heat__dates">
                {days14.map((d, i) => <span key={i}>{d.num}</span>)}
              </div>
              <div className="heat__rows">
                {domains.map((domain) => (
                  <div key={domain} className="heat__row">
                    {days14.map((day, xi) => {
                      const dateStr = new Date(day.date.getTime() - day.date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                      const entry = recent14.find(e => e.date === dateStr);
                      const v = entry ? calcScore([entry], domain) : null;
                      return (
                        <div key={xi} className="heat__cell"
                          style={{ '--c': heatColor(v) }}
                          title={`${domain} · ${day.date.toDateString()} · ${v ?? 'No log'}`}
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

        {/* 6b — Insight rail */}
        <section className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeInsights.length === 0 && (
            <div className="card" style={{ color: 'var(--fg-dim)', fontSize: 13, textAlign: 'center', padding: 32 }}>
              No flagged insights for this window.
            </div>
          )}
          {activeInsights.map(ins => (
            <article key={ins.id} className="insight" style={{ '--rail': ins.rail }}>
              <div>
                <div className="insight__meta">
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: ins.rail, display: 'inline-block' }} />
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
                <button className="btn btn--primary" onClick={() => handleFeedback(ins, 'acted')}>✓ Act</button>
                <button className="btn btn--ghost" onClick={() => handleFeedback(ins, 'dismissed')}>Later</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* ===== Chapter 04 · Ledger ===== */}
      <div className="sec-head">
        <div>
          <div className="sec-head__no">Chapter 04 · Ledger</div>
          <h2>All nine domains</h2>
        </div>
        <div className="sec-head__side">composite scores · {windowDays}d</div>
      </div>

      <div className="grid">
        <section className="card col-12" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Domain', 'Score', 'Δ prev', 'Trend', 'Signals', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 22px',
                    fontFamily: 'var(--mono)', fontSize: 10,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--fg-dim)', fontWeight: 500
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domainLedger.map(d => (
                <tr key={d.name} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <td style={{ padding: '14px 22px', fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: '14px 22px', fontFamily: 'var(--mono)', fontSize: 14 }}>{d.score}</td>
                  <td style={{ padding: '14px 22px', fontFamily: 'var(--mono)', fontSize: 12, color: d.delta > 0 ? 'var(--good)' : d.delta < 0 ? 'var(--bad)' : 'var(--fg-dim)' }}>
                    {d.delta > 0 ? '+' : ''}{d.delta}
                  </td>
                  <td style={{ padding: '14px 22px', width: '28%' }}>
                    <div className="dbar__track">
                      <div className={`dbar__fill${d.score < 50 ? ' dbar__fill--bad' : d.score < 70 ? ' dbar__fill--warn' : ''}`}
                        style={{ '--v': `${d.score}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 22px', color: 'var(--fg-mute)', fontSize: 12 }}>
                    {d.score >= 80 ? 'Stable high, defend cadence' :
                     d.score >= 60 ? 'Within band, slight drift' :
                     d.score >= 40 ? 'Attention required' : 'Intervention recommended'}
                  </td>
                  <td style={{ padding: '14px 22px' }}>
                    <span className="mono" style={{
                      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: d.score >= 70 ? 'var(--good)' : d.score >= 45 ? 'var(--warn)' : 'var(--bad)'
                    }}>
                      ● {d.score >= 70 ? 'Thriving' : d.score >= 45 ? 'Drifting' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Footer ticker */}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
        <div className="ticker">
          <span>NORD·LIVE</span>
          {domainLedger.slice(0, 6).map(d => (
            <span key={d.name}>
              {d.name.toUpperCase().slice(0, 4)} <b>{d.score}</b>{' '}
              {d.delta >= 0 ? <i className="up">▲</i> : <i className="dn">▼</i>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------- MiniKpi sub-component --------
function MiniKpi({ col, label, value, hint, values, labels, flag, flagLabel, delta }) {
  return (
    <section className={`card ${col}`} style={{ padding: 20 }}>
      <div className="card__label card__label--pair">
        <span>▸ {label}</span>
        {flag && (
          <span className={`card__flag ${flag}`}>
            <span className="dot" />{flagLabel}
          </span>
        )}
      </div>
      <div className="kpi-big" style={{ marginBottom: 6 }}>
        <div className="kpi-big__value tnum" style={{ fontSize: 36 }}>{value}</div>
        {delta && (
          <div className={`kpi-big__delta ${delta.bad ? 'kpi-big__delta--down' : delta.type === 'up' ? 'kpi-big__delta--up' : 'kpi-big__delta--down'}`}>
            {delta.type === 'up' ? '▲' : '▼'} {delta.text}
          </div>
        )}
      </div>
      <div className="mono small dim" style={{ marginBottom: 8 }}>{hint}</div>
      <SparkBars values={values} labels={labels} />
    </section>
  );
}

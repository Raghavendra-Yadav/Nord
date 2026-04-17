import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  BarChart, Bar, ScatterChart, Scatter, Cell
} from 'recharts';
import api from '../api/axiosConfig';
import { AnalyticsCard, KpiCard, NotionTooltip } from './ui/NotionAnalytics';
import { WhoopPanel, GlassChartPanel, ScoreRing, DomainBars } from './ui/WhoopAnalytics';
import { getVal, calculateScore, calculatePearsonCorrelation, calculateIEI } from '../utils/analyticsEngine';

/**
 * 📈 Deep Analytics & Intelligence Dashboard
 * A massive visualization suite for LifeOS metrics.
 */
export default function InsightsTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [focusDomain, setFocusDomain] = useState('All');
  const [windowDays, setWindowDays] = useState(90);

  // Fetch up to 90 days of data for rich analytics
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/entries/history?days=${windowDays}`);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [windowDays]);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Generating Intelligence Matrix...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>No data logged yet. Log today's entry to see your Deep Analytics.</div>;
  }

  // Wrapper for centralized scoring logic (averages over arrays for Insight consistency)
  const calcScore = (entriesArr, domain) => {
    let sum = 0, count = 0;
    entriesArr.forEach(entry => {
      const s = calculateScore(entry, domain);
      if (s !== null) { sum += s; count++; }
    });
    return count > 0 ? Math.round(sum / count) : null;
  };

  const domains = ['Body', 'Mind', 'Mood', 'Vices', 'Career', 'Finance', 'Relations', 'Environment', 'Reflect'];
  const domainOptions = ['All', ...domains];

  // ==========================================
  // BEHAVIORAL INTELLIGENCE ENGINE (Insight Generator)
  // ==========================================
  const generateInsights = () => {
    const rawInsights = [];
    
    // 1. ADVANCED: Pearson Correlation (Sleep vs Day Rating)
    const sleepMoodCorr = calculatePearsonCorrelation(history, 'body.sleepH', 'reflect.dayRating');
    if (Math.abs(sleepMoodCorr) > 0.4) {
      rawInsights.push({
        id: 'sleep-mood-pearson',
        category: 'Statistical Signal',
        icon: sleepMoodCorr > 0 ? '📈' : '📉',
        color: sleepMoodCorr > 0 ? '#0F7B0F' : '#E03E3E',
        title: `Sleep/Focus Correlation: ${(sleepMoodCorr * 100).toFixed(0)}%`,
        text: `We've detected a ${sleepMoodCorr > 0 ? 'strong positive' : 'negative'} mathematical relationship between your sleep duration and your daily performance rating. ${Math.abs(sleepMoodCorr * 100).toFixed(0)}% of your variance in output is directly explained by sleep consistency.`,
        action: sleepMoodCorr > 0 ? 'Maintain this sleep window to stabilize highs.' : 'Your baseline is currently volatile. Prioritize an 8h sleep lock.'
      });
    }

    // 2. ADVANCED: Cross-Domain Friction (Screen Time vs Deep Work)
    const screenWorkCorr = calculatePearsonCorrelation(history, 'vices.screenT', 'career.deepWorkBlocks');
    if (screenWorkCorr < -0.3) {
      rawInsights.push({
        id: 'screen-work-friction',
        category: 'Systemic Friction',
        icon: '📱',
        color: '#D9730D',
        title: 'Digital Capture Coefficient',
        text: `Data reveals a inverse correlation (${(screenWorkCorr * 100).toFixed(0)}%) between Screen Time and Deep Work. Every hour of additional phone usage is mathematically eroding your professional depth.`,
        action: 'Implement a "No Phone" rule for the first 90 minutes of your workday.'
      });
    }

    // 3. Trend Analysis (Momentum Vectors)
    const recent14 = [...history].reverse().slice(0, 14);
    const first7 = recent14.slice(7, 14);
    const last7 = recent14.slice(0, 7);
    
    if (first7.length > 0 && last7.length > 0) {
      const avgFirst7 = first7.reduce((a,b) => a + Number(b.career?.deepWorkBlocks || 0), 0) / first7.length;
      const avgLast7 = last7.reduce((a,b) => a + Number(b.career?.deepWorkBlocks || 0), 0) / last7.length;
      
      if (avgLast7 - avgFirst7 > 1.0) {
         rawInsights.push({
          id: 'momentum-vector-up',
          category: 'Momentum',
          icon: '🚀',
          color: '#0F7B0F',
          title: 'Positive Growth Vector',
          text: `Your output vector is currently up-trending. Output density increased by ${((avgLast7-avgFirst7)*100/Math.max(avgFirst7,1)).toFixed(0)}% week-over-week.`,
          action: 'Aggressively defend this state. Reject all non-essential meetings.'
        });
      }
    }

    // 3. Balance: Radar Anomaly Detection
    const scores = domains.map(d => ({ name: d, score: calcScore(recent14, d) }));
    const neglected = scores.filter(s => s.score < 40);
    const strong = scores.filter(s => s.score >= 80);
    
    if (neglected.length > 0 && strong.length > 0) {
      const weakest = neglected.sort((a,b) => a.score - b.score)[0];
      const strongest = strong.sort((a,b) => b.score - a.score)[0];
      rawInsights.push({
        id: 'radar-imbalance',
        category: 'Balance',
        icon: '⚖️',
        color: '#185FA5',
        title: 'Systemic Imbalance Flag',
        text: `Your ${strongest.name} area is thriving (${strongest.score}/100), but it seems to be cannibalizing your ${weakest.name} area which is critically low (${weakest.score}/100).`,
        action: `Reallocate 5% of your mental bandwidth to ${weakest.name}.`
      });
    }

    // 4. Vices: Screen Time 
    const highScreenDays = recent14.filter(d => Number(d.vices?.screenT || 0) > 4.5);
    if (highScreenDays.length >= 4) {
      rawInsights.push({
        id: 'screen-time-spiral',
        category: 'Anomaly',
        icon: '📱',
        color: '#E03E3E',
        title: 'Digital Consumption Spiral',
        text: `You have logged over 4.5 hours of screen time on ${highScreenDays.length} of the last 14 days. This is a severe dopamine leak.`,
        action: 'Put phone in another room at 8 PM for the next 3 days.'
      });
    }

    // 5. Motivation Override (Grace Pause)
    const recent7IEI = last7.map(e => calculateIEI(e)); 
    if (recent7IEI.length >= 3) {
      const avgIEI = recent7IEI.reduce((a,b)=>a+b, 0) / recent7IEI.length;
      if (avgIEI < 40) {
        rawInsights.push({
          id: 'motivation-compulsion',
          category: 'System Override',
          icon: '☕',
          color: '#555555',
          title: 'Autopilot Tracking Detected',
          text: `Your recent logs have been completely devoid of reflection. You are speed-tracking just to maintain the streak. Remember: the system serves you, you do not serve the system.`,
          action: 'Take a 3-Day Reset. Stop tracking immediately. Streaks will be mathematically frozen.'
        });
      }
    }

    return rawInsights.filter(insight => !dismissedInsights.includes(insight.id));
  };
  
  const activeInsights = generateInsights();

  // ==========================================
  // CHART DATA COMPILATION
  // ==========================================
  const radarData = domains.map(domain => ({
    subject: domain,
    Score: calcScore(history, domain),
    fullMark: 100
  }));
  const domainScores = radarData.map((d) => ({ label: d.subject, value: d.Score }));
  const overall =
    domainScores.length > 0
      ? Math.round(domainScores.reduce((a, b) => a + (Number(b.value) || 0), 0) / domainScores.length)
      : 0;

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
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
  const filteredRecent = focusDomain === 'All' ? recent14 : recent14;
  const getHeatColor = (score) => {
    if (score === 0) return 'var(--notion-input-bg)';
    if (score < 40) return 'rgba(224, 62, 62, 0.4)'; // Red-ish 
    if (score < 70) return 'rgba(217, 115, 13, 0.5)'; // Orange/Yellow-ish
    return 'rgba(24, 95, 165, 0.8)'; // Good Blue
  };

  const streakDays = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });
  
  const habits = [
    { label: '🏋️ Workout', check: e => e?.body?.workoutType && e.body.workoutType !== 'rest' },
    { label: '🧘 Meditation', check: e => Number(e?.mind?.meditMin) >= 10 },
    { label: '💼 Deep Work', check: e => Number(e?.career?.deepWorkBlocks) >= 2 },
    { label: '🌿 Outdoor', check: e => Number(e?.environ?.outdoorTime) > 30 }
  ];

  const financeData = recent14.map(e => ({
    date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    Spent: Number(e.finance?.spent) || 0
  }));

  const correlationData = history
    .filter(e => e.body?.sleepH && e.mood?.mood)
    .map(e => ({
      sleep: Number(e.body.sleepH),
      mood: Number(e.mood.mood),
      date: e.date
    }));

  const motivationSpectrumData = recent14.map(e => calculateIEI(e));

  const summary = (() => {
    const slice = [...history].slice(-14);
    const avgIEI =
      motivationSpectrumData.length > 0
        ? Math.round(
            motivationSpectrumData.reduce((a, b) => a + Number(b.score || 0), 0) /
              motivationSpectrumData.length
          )
        : 0;

    const top = domains
      .map((d) => ({ d, s: calcScore(slice, d) }))
      .sort((a, b) => b.s - a.s)[0];

    const low = domains
      .map((d) => ({ d, s: calcScore(slice, d) }))
      .sort((a, b) => a.s - b.s)[0];

    const momentum = (() => {
      const recent = [...history].reverse().slice(0, 7);
      const previous = [...history].reverse().slice(7, 14);
      
      const calcAvg = (arr) => {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((acc, entry) => {
          let daySum = 0;
          domains.forEach(d => daySum += calcScore([entry], d));
          return acc + (daySum / domains.length);
        }, 0);
        return sum / arr.length;
      };

      const avgRecent = calcAvg(recent);
      const avgPrev = calcAvg(previous);
      const diff = avgRecent - avgPrev;
      
      return {
        score: Math.round(avgRecent),
        diff: diff.toFixed(1),
        status: diff > 2 ? 'Winning' : diff < -2 ? 'Slumping' : 'Steady'
      };
    })();

    const dopamineDebt = (() => {
      const today = [...history].reverse()[0];
      if (!today) return { ratio: 0, status: 'Neutral' };
      
      const consumption = (Number(today.vices?.screenT) || 0) * 20; // weight screen time
      const creation = ((Number(today.career?.deepWorkBlocks) || 0) * 30) + ((Number(today.mind?.meditMin) || 0) * 2);
      
      const ratio = creation === 0 ? (consumption > 0 ? 100 : 0) : Math.min(100, Math.round((consumption / Math.max(creation, 1)) * 50));
      
      return {
        ratio,
        status: ratio > 60 ? 'Debt' : ratio < 30 ? 'Recovered' : 'Balanced'
      };
    })();

    const weeklyIntel = (() => {
      const last7 = [...history].reverse().slice(0, 7);
      
      // 1. Sleep Debt
      const targetSleep = 7.5;
      const debt = last7.reduce((acc, e) => acc + (targetSleep - (Number(e.body?.sleepH) || targetSleep)), 0);
      
      // 2. Prime Day
      const dayRatings = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      last7.forEach(e => {
        const day = new Date(e.date + 'T00:00:00').getDay();
        const score = (Number(e.reflect?.dayRating) || 0) + (Number(e.career?.deepWorkBlocks) || 0) * 2;
        if (!dayRatings[day]) dayRatings[day] = [];
        dayRatings[day].push(score);
      });
      
      let bestDayIdx = -1;
      let maxAvg = -1;
      
      Object.keys(dayRatings).forEach(day => {
        const avg = dayRatings[day].reduce((a, b) => a + b, 0) / dayRatings[day].length;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestDayIdx = day;
        }
      });

      return {
        sleepDebt: debt.toFixed(1),
        primeDay: bestDayIdx !== -1 ? dayNames[bestDayIdx] : 'N/A'
      };
    })();

    const weeklyScorecard = (() => {
      const last7 = [...history].reverse().slice(0, 7);
      
      // 1. Win/Loss (Day Rating 7+ is a win)
      const wins = last7.filter(e => Number(e.reflect?.dayRating) >= 7).length;
      const losses = last7.length - wins;
      
      // 2. SCQ (Social Pulse)
      const meaningful = last7.filter(e => e.relations?.meaningConvo === 'yes').length;
      const scq = Math.round((meaningful / 7) * 100);
      
      // 3. Essentialism Quotient (Creation vs Noise)
      const creationHours = last7.reduce((acc, e) => {
        return acc + (Number(e.career?.deepWorkBlocks) || 0) + ((Number(e.mind?.meditMin) || 0) / 60) + ((Number(e.mind?.readMin) || 0) / 60);
      }, 0);
      const consumptionHours = last7.reduce((acc, e) => acc + (Number(e.vices?.screenT) || 0), 0);
      const eq = creationHours === 0 ? 0 : Math.min(100, Math.round((creationHours / (creationHours + consumptionHours)) * 100));

      return { wins, losses, scq, eq };
    })();

    return { avgIEI, top, low, momentum, dopamineDebt, weeklyIntel, weeklyScorecard };
  })();

  // ==========================================
  // BEHAVIORAL FEEDBACK LOOP (A/B Testing Signal)
  // ==========================================
  const handleFeedback = async (insight, actionType) => {
    // Optimistically hide the card so the user flow is uninterrupted
    setDismissedInsights([...dismissedInsights, insight.id]);
    
    try {
      // Send telemetry to backend for algorithm learning
      await api.post('/insights/feedback', {
        insightId: insight.id,
        category: insight.category,
        actionType: actionType, // 'helpful', 'dismissed', 'saved', 'acted'
        context: {
          title: insight.title,
          renderedText: insight.text
        }
      });
    } catch (err) {
      console.error('Failed to log behavioral feedback', err);
    }
  };

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: '8px' }}>
            Deep Analytics & Patterns
          </h2>
          <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px' }}>
            System output mapped across your selected window.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="notion-input"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            style={{
              width: 'auto',
              height: 34,
              borderRadius: 8,
              background: 'var(--notion-input-bg)',
              border: '1px solid var(--notion-border)',
            }}
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <select
            className="notion-input"
            value={focusDomain}
            onChange={(e) => setFocusDomain(e.target.value)}
            style={{
              width: 'auto',
              height: 34,
              borderRadius: 8,
              background: 'var(--notion-input-bg)',
              border: '1px solid var(--notion-border)',
            }}
          >
            {domainOptions.map((d) => (
              <option key={d} value={d}>
                Focus: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top summary widgets */}
      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        <KpiCard 
          className="analytics-span-3" 
          label="Momentum Arc" 
          value={summary.momentum.status} 
          hint={`${summary.momentum.diff > 0 ? '+' : ''}${summary.momentum.diff}% vs last week`} 
          tone={summary.momentum.status === 'Winning' ? 'good' : summary.momentum.status === 'Slumping' ? 'bad' : 'neutral'} 
        />
        <KpiCard 
          className="analytics-span-3" 
          label="Dopamine Debt" 
          value={summary.dopamineDebt.status} 
          hint={`${summary.dopamineDebt.ratio}% consumption ratio`} 
          tone={summary.dopamineDebt.status === 'Recovered' ? 'good' : summary.dopamineDebt.status === 'Debt' ? 'bad' : 'neutral'} 
        />
        <KpiCard className="analytics-span-3" label="Strongest Area" value={summary.top?.d || '-'} hint="Past 14 days" tone="good" />
        <KpiCard className="analytics-span-3" label="Focus Required" value={summary.low?.d || '-'} hint="Area of neglect" tone="bad" />
      </div>

      <div className="analytics-grid" style={{ marginBottom: 32 }}>
        <GlassChartPanel className="analytics-span-6" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'grid', placeItems: 'center', fontSize: '24px' }}>💤</div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weekly Sleep Debt</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>{summary.weeklyIntel.sleepDebt} Hours</p>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '2px' }}>Relative to 7.5h nightly target.</p>
          </div>
        </GlassChartPanel>

        <GlassChartPanel className="analytics-span-6" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'grid', placeItems: 'center', fontSize: '24px' }}>⚡</div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prime Output Day</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>{summary.weeklyIntel.primeDay}</p>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '2px' }}>Your most consistent high-performing day.</p>
          </div>
        </GlassChartPanel>
      </div>

      <div className="analytics-grid" style={{ marginBottom: 32 }}>
        <GlassChartPanel className="analytics-span-4" style={{ padding: '20px' }}>
           <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>The Scoreboard</p>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'rgba(16, 185, 129, 1)' }}>{summary.weeklyScorecard.wins}W</span>
              <span style={{ color: 'var(--notion-border)', fontSize: '20px' }}>/</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'rgba(244, 63, 94, 1)' }}>{summary.weeklyScorecard.losses}L</span>
           </div>
           <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)' }}>Day Rating 7+ counts as a Win.</p>
        </GlassChartPanel>

        <GlassChartPanel className="analytics-span-4" style={{ padding: '20px' }}>
           <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Essentialism Quotient</p>
           <p style={{ fontSize: '24px', fontWeight: 900, color: '#111111' }}>{summary.weeklyScorecard.eq}%</p>
           <div style={{ width: '100%', height: '4px', background: 'rgba(15,15,15,0.05)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${summary.weeklyScorecard.eq}%`, height: '100%', background: 'var(--premium-accent)' }}></div>
           </div>
           <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '8px' }}>Signal vs. distractors ratio.</p>
        </GlassChartPanel>

        <GlassChartPanel className="analytics-span-4" style={{ padding: '20px' }}>
           <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Social Pulse (SCQ)</p>
           <p style={{ fontSize: '24px', fontWeight: 900, color: '#111111' }}>{summary.weeklyScorecard.scq}%</p>
           <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '8px' }}>Weekly meaningful connection rate.</p>
        </GlassChartPanel>
      </div>

      {/* INTELLIGENCE ENGINE: Insight Cards */}
      {activeInsights.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(15,23,42,0.62)', marginBottom: 10 }}>
            Autonomic insights
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeInsights.map((insight) => (
              <div
                key={insight.id}
                className="stats-card"
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: '#fff',
                  borderLeft: `4px solid ${insight.color}80`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{insight.icon}</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--notion-text)', letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {insight.title}
                      </div>
                      <span className="analytics-pill analytics-pill--neutral">{insight.category}</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--notion-text)', marginBottom: 12, lineHeight: 1.6 }}>
                      {insight.text}
                    </p>

                    <div style={{ background: 'rgba(24,95,165,0.06)', display: 'inline-block', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(24,95,165,0.12)', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#185FA5' }}>
                        Action protocol:{' '}
                        <span style={{ fontWeight: 500, color: 'var(--notion-text)' }}>{insight.action}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleFeedback(insight, 'acted')}
                        className="notion-button"
                        style={{ width: 'auto', marginTop: 0, padding: '0 12px', height: 32, background: '#185FA5' }}
                      >
                        ✓ Will act on this
                      </button>
                      <button
                        onClick={() => handleFeedback(insight, 'helpful')}
                        className="notion-button"
                        style={{
                          width: 'auto',
                          marginTop: 0,
                          padding: '0 12px',
                          height: 32,
                          background: 'var(--notion-input-bg)',
                          color: 'var(--notion-text)',
                          border: '1px solid var(--notion-border)',
                        }}
                      >
                        💡 Helpful context
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFeedback(insight, 'dismissed')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--notion-gray-text)',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 6,
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DASHBOARD CHARTS */}
      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        
        {/* MOTIVATION SPECTRUM VISUALIZER */}
        <AnalyticsCard
          className="analytics-span-6"
          title="Motivation transparency"
          subtitle="Intrinsic depth vs autopilot tracking over the last 14 days."
          right={<span className="analytics-pill analytics-pill--neutral">BETA</span>}
        >
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={motivationSpectrumData} margin={{ top: 10, right: 10, bottom: 6, left: -16 }}>
                <defs>
                  <linearGradient id="barGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(24,95,165,0.85)" />
                    <stop offset="100%" stopColor="rgba(24,95,165,0.35)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(15,23,42,0.62)' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip content={<NotionTooltip />} />
                <Bar dataKey="score" name="Quality" radius={[12, 12, 12, 12]} isAnimationActive animationDuration={900}>
                  {motivationSpectrumData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 70
                          ? 'url(#barGood)'
                          : entry.score <= 40
                            ? 'rgba(15,15,15,0.18)'
                            : 'rgba(15,15,15,0.28)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* 1. NINE-DOMAIN RADAR */}
        <AnalyticsCard
          className="analytics-span-6"
          title="Life area balance"
          subtitle="Whoop-style: overall ring + ranked domain bars."
        >
          <GlassChartPanel>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 14, alignItems: 'center' }}>
              <ScoreRing value={overall} label="Overall" sublabel={`${windowDays}d window`} />
              <DomainBars items={domainScores} />
            </div>
          </GlassChartPanel>
        </AnalyticsCard>
      </div>

      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        <AnalyticsCard className="analytics-span-12" title="Weekly trendlines" subtitle="One accent line + muted companions.">
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 6, left: -18 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip content={<NotionTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--notion-gray-text)' }}/>
                <Line type="monotone" name="Body" dataKey="Body" stroke="#185FA5" strokeWidth={2.4} dot={false} isAnimationActive animationDuration={800} />
                <Line type="monotone" name="Career" dataKey="Career" stroke="rgba(15,15,15,0.28)" strokeWidth={2.0} dot={false} isAnimationActive animationDuration={800} />
                <Line type="monotone" name="Mood" dataKey="Mood" stroke="rgba(15,15,15,0.20)" strokeWidth={2.0} dot={false} isAnimationActive animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        <AnalyticsCard className="analytics-span-6" title="Area heat matrix (14 days)" subtitle="Daily domain intensity at a glance.">
          <GlassChartPanel>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '8px', marginTop: '20px' }}>
                {domains.map(d => <div key={d} style={{ height: '20px', fontSize: '10px', color: 'rgba(15,15,15,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 700 }}>{d}</div>)}
              </div>
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {recent14.map((d, i) => (
                    <div key={`hx-${i}`} style={{ width: '20px', fontSize: '9px', color: 'rgba(15,15,15,0.5)', textAlign: 'center', fontWeight: 700 }}>
                      {new Date(d.date + 'T00:00:00').getDate()}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {domains.map(domain => (
                    <div key={`row-${domain}`} style={{ display: 'flex', gap: '4px' }}>
                      {recent14.map((d, i) => {
                        const score = calcScore([d], domain);
                        return (
                          <div
                            key={`cell-${i}`}
                            title={`${domain} on ${d.date}: ${score !== null ? score : 'No Log'}`}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '5px',
                              background:
                                score === null
                                  ? 'rgba(15,15,15,0.04)'
                                  : score < 40
                                    ? 'rgba(224,62,62,0.4)'
                                    : score < 70
                                      ? 'rgba(139,92,246,0.45)'
                                      : 'rgba(99,102,241,0.7)',
                              border: '1px solid rgba(15,15,15,0.05)',
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassChartPanel>
        </AnalyticsCard>

        <AnalyticsCard className="analytics-span-6" title="Correlation engine: sleep vs mood" subtitle="Do your sleep hours predict mood?">
          <GlassChartPanel>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                  <XAxis type="number" dataKey="sleep" name="Sleep Hours" domain={[0, 12]} tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="mood" name="Mood" domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NotionTooltip />} />
                  <Scatter name="Days" data={correlationData} fill="rgba(139,92,246,0.85)">
                    {correlationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'rgba(99,102,241,0.8)'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </GlassChartPanel>
        </AnalyticsCard>
      </div>

      <div className="analytics-grid">
        <AnalyticsCard className="analytics-span-6" title={`Consistency matrix (${windowDays} days)`} subtitle="Execution signals over time.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {habits.map((habit, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>{habit.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {streakDays.map((dateStr, i) => {
                    const entry = history.find(e => e.date === dateStr);
                    const done = habit.check(entry);
                    return (
                      <div
                        key={i}
                        title={`${dateStr}: ${done ? 'Done' : 'Missed'}`}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: done ? '#185FA5' : 'rgba(15,15,15,0.08)',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard className="analytics-span-6" title="Liquidity burn (14 days)" subtitle="Daily spend velocity.">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.88)" />
                    <stop offset="100%" stopColor="rgba(99,102,241,0.55)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} width={40} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<NotionTooltip />} />
                <Bar dataKey="Spent" name="Spent" fill="url(#spendGrad)" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

    </div>
  );
}

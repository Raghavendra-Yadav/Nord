import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  BarChart, Bar, ScatterChart, Scatter, Cell
} from 'recharts';
import api from '../api/axiosConfig';

/**
 * 📈 Deep Analytics & Intelligence Dashboard
 * A massive visualization suite for LifeOS metrics.
 */
export default function InsightsTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState([]);

  // Fetch up to 90 days of data for rich analytics
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/entries/history?days=90');
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Generating Intelligence Matrix...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>No data logged yet. Log today's entry to see your Deep Analytics.</div>;
  }

  // ==========================================
  // DATA SCORING ENGINE (0-100 normalization)
  // ==========================================
  
  const calcScore = (entriesArr, domain) => {
    let sum = 0, count = 0;
    entriesArr.forEach(entry => {
      let score = null;
      switch (domain) {
        case 'Body':
          if (entry.body?.sleepHr) score = Math.min((Number(entry.body.sleepHr) / 8) * 100, 100);
          break;
        case 'Mind':
          if (entry.mind?.readMin !== undefined) score = Math.min((Number(entry.mind.readMin || 0) / 30) * 100, 100);
          break;
        case 'Mood':
          if (entry.mood?.mood) score = (Number(entry.mood.mood) / 10) * 100;
          break;
        case 'Vices':
          if (entry.vices?.screenT !== undefined) score = Math.max(100 - (Number(entry.vices.screenT || 0) * 15), 0); 
          break;
        case 'Career':
          if (entry.career?.deepWorkBlocks !== undefined) score = Math.min((Number(entry.career.deepWorkBlocks || 0) / 3) * 100, 100);
          break;
        case 'Finance':
          if (entry.finance?.spent !== undefined) score = entry.finance.spent < 20 ? 100 : Math.max(100 - (Number(entry.finance.spent)/3), 0);
          break;
        case 'Relations':
          if (entry.relations?.meaningConvo) score = entry.relations.meaningConvo === 'yes' ? 100 : 0;
          break;
        case 'Environment':
          if (entry.environ?.roomClean) score = entry.environ.roomClean === 'yes' ? 100 : (entry.environ.roomClean === 'partial' ? 50 : 0);
          break;
        case 'Reflect':
          if (entry.reflect?.dayRating) score = (Number(entry.reflect.dayRating) / 10) * 100;
          break;
        default: break;
      }
      if (score !== null) { sum += score; count++; }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  };

  const domains = ['Body', 'Mind', 'Mood', 'Vices', 'Career', 'Finance', 'Relations', 'Environment', 'Reflect'];

  // ==========================================
  // MOTIVATION TRANSPARENCY (Intrinsic vs Extrinsic)
  // ==========================================
  const calculateIEI = (entry) => {
    if (!entry) return { date: '', score: 50 };
    let score = 50; // starts neutral
    
    // Extrinsic Signals (Hurried, minimal reflection, phone addiction)
    if (!entry.reflect?.gratitude || entry.reflect.gratitude.length < 5) score -= 20;
    if (!entry.reflect?.wins || entry.reflect.wins.length < 5) score -= 10;
    if (Number(entry.vices?.screenT || 0) > 4.5) score -= 10;
    
    // Intrinsic Signals (Depth, intentionality, social connection)
    if (entry.reflect?.gratitude && entry.reflect.gratitude.length > 20) score += 20;
    if (entry.reflect?.struggles && entry.reflect.struggles.length > 15) score += 15;
    if (entry.relations?.meaningConvo === 'yes') score += 15;
    
    return {
      date: new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      score: Math.max(0, Math.min(100, score)) // clamp 0-100
    };
  };

  // ==========================================
  // BEHAVIORAL INTELLIGENCE ENGINE (Insight Generator)
  // ==========================================
  const generateInsights = () => {
    const rawInsights = [];
    
    // 1. Correlation: Sleep & Day Rating
    const lowSleeps = history.filter(d => Number(d.body?.sleepHr) < 6.5 && d.reflect?.dayRating);
    const goodSleeps = history.filter(d => Number(d.body?.sleepHr) >= 7.5 && d.reflect?.dayRating);
    
    if (lowSleeps.length >= 3 && goodSleeps.length >= 3) {
      const avgLow = lowSleeps.reduce((a,b) => a + Number(b.reflect.dayRating), 0) / lowSleeps.length;
      const avgGood = goodSleeps.reduce((a,b) => a + Number(b.reflect.dayRating), 0) / goodSleeps.length;
      
      const diff = avgGood - avgLow;
      if (diff >= 1.5) {
        rawInsights.push({
          id: 'sleep-mood-corr',
          category: 'Correlation',
          icon: '📉',
          color: '#E03E3E',
          title: 'Severe Sleep Penalty Detected',
          text: `Your Day Rating drops by a massive ${diff.toFixed(1)} points on days you sleep under 6.5 hours compared to 7.5+. Sleep deprivation is systematically destroying your momentum.`,
          action: 'Set a hard technology cutoff at 10 PM tonight.'
        });
      }
    }

    // 2. Trend: Deep Work Regression or Momentum
    const recent14 = [...history].reverse().slice(0, 14);
    const first7 = recent14.slice(7, 14);
    const last7 = recent14.slice(0, 7);
    
    if (first7.length > 0 && last7.length > 0) {
      const avgFirst7 = first7.reduce((a,b) => a + Number(b.career?.deepWorkBlocks || 0), 0) / first7.length;
      const avgLast7 = last7.reduce((a,b) => a + Number(b.career?.deepWorkBlocks || 0), 0) / last7.length;
      
      if (avgLast7 - avgFirst7 > 1.0) {
         rawInsights.push({
          id: 'deepwork-trend-up',
          category: 'Momentum',
          icon: '🚀',
          color: '#0F7B0F',
          title: 'Career Output Scaling Rapidly',
          text: `Your deep work volume has increased by ${((avgLast7-avgFirst7)*100/Math.max(avgFirst7,1)).toFixed(0)}% this week compared to last week. You are hitting a flow state cycle.`,
          action: 'Protect your morning calendar to ride out this momentum.'
        });
      } else if (avgFirst7 - avgLast7 > 0.8) {
         rawInsights.push({
          id: 'deepwork-trend-down',
          category: 'Warning',
          icon: '⚠️',
          color: '#D9730D',
          title: 'Deep Work Constriction',
          text: `Your deep work blocks dropped significantly over the last 7 days. Friction is accumulating in your professional output.`,
          action: 'Block out 90 uninterrupted minutes tomorrow morning. Zero email.'
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
    const recent7IEI = last7.map(e => calculateIEI(e).score); 
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

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };
  
  const weeklyGroups = {};
  [...history].forEach(entry => {
    const d = new Date(entry.date);
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
  const getHeatColor = (score) => {
    if (score === 0) return 'var(--notion-input-bg)';
    if (score < 40) return 'rgba(224, 62, 62, 0.4)'; // Red-ish 
    if (score < 70) return 'rgba(217, 115, 13, 0.5)'; // Orange/Yellow-ish
    return 'rgba(24, 95, 165, 0.8)'; // Good Blue
  };

  const streakDays = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });
  
  const habits = [
    { label: '🏋️ Workout', check: e => e?.body?.workout === 'yes' },
    { label: '🧘 Meditation', check: e => Number(e?.mind?.meditMin) >= 10 },
    { label: '💼 Deep Work', check: e => Number(e?.career?.deepWorkBlocks) >= 2 },
    { label: '🌿 Outdoor', check: e => Number(e?.environ?.outdoorTime) > 30 }
  ];

  const financeData = recent14.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    Spent: Number(e.finance?.spent) || 0
  }));

  const correlationData = history
    .filter(e => e.body?.sleepHr && e.mood?.mood)
    .map(e => ({
      sleep: Number(e.body.sleepHr),
      mood: Number(e.mood.mood),
      date: e.date
    }));

  const motivationSpectrumData = recent14.map(e => calculateIEI(e));

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
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: '8px' }}>Deep Analytics & Patterns</h2>
        <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px' }}>System output mapped across 90 days of empirical data.</p>
      </div>

      {/* INTELLIGENCE ENGINE: Insight Cards */}
      {activeInsights.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>🧠 Autonomic Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeInsights.map((insight) => (
              <div key={insight.id} style={{ 
                background: '#fff', border: `1px solid ${insight.color}40`, borderLeft: `4px solid ${insight.color}`, 
                borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{insight.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: insight.color }}>{insight.title}</span>
                    <span style={{ fontSize: '10px', background: 'var(--notion-input-bg)', padding: '2px 6px', borderRadius: '4px', color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{insight.category}</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--notion-text)', marginBottom: '12px', lineHeight: '1.5' }}>{insight.text}</p>
                  <div style={{ background: 'rgba(24, 95, 165, 0.05)', display: 'inline-block', padding: '6px 12px', borderRadius: '6px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#185FA5' }}>Action Protocol: <span style={{ fontWeight: 400, color: 'var(--notion-text)' }}>{insight.action}</span></p>
                  </div>
                  
                  {/* Feedback Action Row (Telemetry) */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleFeedback(insight, 'acted')} 
                      style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.target.style.opacity = 0.9} onMouseLeave={e => e.target.style.opacity = 1}
                    >
                      ✓ Will Act On This
                    </button>
                    <button 
                      onClick={() => handleFeedback(insight, 'helpful')} 
                      style={{ background: 'var(--notion-input-bg)', color: 'var(--notion-text)', border: '1px solid var(--notion-border)', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'var(--notion-border)'} onMouseLeave={e => e.target.style.background = 'var(--notion-input-bg)'}
                    >
                      💡 Helpful Context
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => handleFeedback(insight, 'dismissed')}
                  style={{ background: 'none', border: 'none', color: 'var(--notion-gray-text)', cursor: 'pointer', fontSize: '16px', padding: '4px', opacity: 0.5, transition: 'opacity 0.2s' }}
                  title="Dismiss (Not useful)"
                  onMouseEnter={e => e.target.style.opacity = 1}
                  onMouseLeave={e => e.target.style.opacity = 0.5}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DASHBOARD CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* MOTIVATION SPECTRUM VISUALIZER */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Motivation Transparency
            <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#555', fontWeight: 500 }}>BETA</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Intrinsic Quality (Deep Blue) vs. Autopilot Compulsion (Silver)</p>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={motivationSpectrumData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '4px', fontSize: '12px' }} formatter={(v) => [`${v}/100`, "Quality Score"]} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {motivationSpectrumData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#185FA5' : (entry.score <= 40 ? '#D1D5DB' : '#9CA3AF')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 1. NINE-DOMAIN RADAR */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Life Area Balance</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Normalized aggregate scoring across 9 dimensions.</p>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="var(--notion-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} />
                <Radar name="Score" dataKey="Score" stroke="#185FA5" fill="#185FA5" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 2. LONG TERM TRENDS */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Weekly Trendlines</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Momentum of 3 critical variables over time.</p>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid var(--notion-border)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Line type="monotone" dataKey="Career" stroke="#000" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Mood" stroke="#34C759" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Body" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* 3. DAILY PERFORMANCE HEATMAP */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>3. Area Heat Matrix (Last 14 Days)</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Dark blue = Optimal. Red = Needs attention.</p>
          
          <div style={{ display: 'flex' }}>
            {/* Y Axis Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '8px', marginTop: '20px' }}>
              {domains.map(d => <div key={d} style={{ height: '20px', fontSize: '10px', color: 'var(--notion-gray-text)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{d}</div>)}
            </div>
            
            {/* Grid */}
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {recent14.map((d, i) => (
                  <div key={`hx-${i}`} style={{ width: '20px', fontSize: '9px', color: 'var(--notion-gray-text)', textAlign: 'center' }}>
                    {new Date(d.date).getDate()}
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
                          title={`${domain} on ${d.date}: ${score}`}
                          style={{ width: '20px', height: '20px', borderRadius: '4px', background: getHeatColor(score) }} 
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. CORRELATION ANALYSIS */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>4. Correlation Engine: Sleep vs Mood</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Does your sleep actually predict your mood?</p>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <XAxis type="number" dataKey="sleep" name="Sleep Hours" domain={[0, 12]} tick={{ fontSize: 11 }} label={{ value: "Hours Slept", position: "insideBottom", offset: -10, fontSize: 11 }}/>
                <YAxis type="number" dataKey="mood" name="Mood" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: "Mood (1-10)", angle: -90, position: "insideLeft", fontSize: 11 }}/>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Days" data={correlationData} fill="#185FA5">
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#185FA5'} fillOpacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 4. GITHUB STREAKS */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>5. Consistency Matrix (90 Days)</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Did you execute?</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {habits.map((habit, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{habit.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {streakDays.map((dateStr, i) => {
                    const entry = history.find(e => e.date === dateStr);
                    const done = habit.check(entry);
                    return (
                      <div 
                        key={i} 
                        title={`${dateStr}: ${done ? 'Done' : 'Missed'}`}
                        style={{ width: '10px', height: '10px', borderRadius: '2px', background: done ? '#34C759' : 'rgba(0,0,0,0.05)' }} 
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. SPENDING BAR CHART */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>6. Liquidity Burn (Last 14 Days)</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Daily spend velocity.</p>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} width={40} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '4px', fontSize: '12px' }} formatter={value => [`$${value}`, "Spent"]} />
                <Bar dataKey="Spent" fill="#000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  BarChart, Bar, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import api from '../api/axiosConfig';

/**
 * 📈 Deep Analytics Dashboard
 * A massive visualization suite for LifeOS metrics.
 */
export default function InsightsTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Generating Analytics Matrix...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Not enough data for Deep Analytics. Keep logging!</div>;
  }

  // ==========================================
  // DATA SCORING ENGINE (0-100 normalization)
  // ==========================================
  
  // Calculate a 0-100 score for a specific metric across an array of entries
  const calcScore = (entriesArr, domain) => {
    let sum = 0, count = 0;
    
    entriesArr.forEach(entry => {
      let score = null;
      switch (domain) {
        case 'Body':
          if (entry.body?.sleepHr) score = Math.min((Number(entry.body.sleepHr) / 8) * 100, 100);
          break;
        case 'Mind':
          if (entry.mind?.readMin) score = Math.min((Number(entry.mind.readMin) / 60) * 100, 100);
          break;
        case 'Mood':
          if (entry.mood?.mood) score = (Number(entry.mood.mood) / 10) * 100;
          break;
        case 'Vices':
          // Inverse: Low screen time = High Score (assuming 10hrs is 0 score)
          if (entry.vices?.screenT) score = Math.max(100 - (Number(entry.vices.screenT) * 10), 0); 
          break;
        case 'Career':
          if (entry.career?.deepWorkBlocks) score = Math.min((Number(entry.career.deepWorkBlocks) / 4) * 100, 100);
          break;
        case 'Finance':
          if (entry.finance?.spent) score = entry.finance.spent < 50 ? 100 : Math.max(100 - (Number(entry.finance.spent)/5), 0);
          break;
        case 'Relations':
          if (entry.relations?.meaningConvo === 'yes') score = 100; else score = 0;
          break;
        case 'Environment':
          if (entry.environ?.roomClean === 'yes') score = 100; else if (entry.environ?.roomClean === 'partial') score = 50; else score = 0;
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

  // 1. RADAR CHART (Overall Balance)
  const radarData = domains.map(domain => ({
    subject: domain,
    Score: calcScore(history, domain),
    fullMark: 100
  }));

  // 2. LONG TERM TRENDS (Weekly grouping)
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };
  
  const weeklyGroups = {};
  history.forEach(entry => {
    const d = new Date(entry.date);
    const weekKey = `W${getWeekNumber(d)}`;
    if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = [];
    weeklyGroups[weekKey].push(entry);
  });
  
  const trendData = Object.keys(weeklyGroups).reverse().map(week => {
    const weekEntries = weeklyGroups[week];
    return {
      name: week,
      Career: calcScore(weekEntries, 'Career'),
      Mood: calcScore(weekEntries, 'Mood'),
      Body: calcScore(weekEntries, 'Body')
    };
  });

  // 3. DAILY DOMAIN HEATMAP (React Grid Matrix)
  // Map last 14 days over the 9 domains
  const recentDays = [...history].reverse().slice(-14);
  
  const getHeatColor = (score) => {
    if (score === 0) return 'var(--notion-input-bg)';
    if (score < 40) return '#ffcccc'; // Poor (red-ish)
    if (score < 70) return '#fff0b3'; // Okay (yellow-ish)
    return 'rgba(24, 95, 165, 0.6)'; // Good (Brand Blue)
  };

  // 4. GITHUB-STYLE STREAKS (Specific Habits over 90 days)
  const streakDays = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });
  
  const habits = [
    { label: '🏋️ Workout', check: e => e?.body?.workout === 'yes' },
    { label: '🧘 Meditation', check: e => Number(e?.mind?.meditMin) > 0 },
    { label: '💼 Deep Work', check: e => Number(e?.career?.deepWorkBlocks) >= 2 },
    { label: '🌿 Outdoor', check: e => Number(e?.environ?.outdoorTime) > 30 }
  ];

  // 5. FINANCE BREAKDOWN
  const financeData = [...history].reverse().slice(-14).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    Spent: Number(e.finance?.spent) || 0
  }));

  // 6. CORRELATION (Sleep vs Mood)
  const correlationData = history
    .filter(e => e.body?.sleepHr && e.mood?.mood)
    .map(e => ({
      sleep: Number(e.body.sleepHr),
      mood: Number(e.mood.mood),
      date: e.date
    }));

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '60px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: '8px' }}>Deep Analytics & Patterns</h2>
        <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px' }}>System output mapped across 90 days of empirical data.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* 1. NINE-DOMAIN RADAR */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>1. Life Area Balance</h3>
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

        {/* 2. LONG TERM TRENDS */}
        <div className="stats-card" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>2. Weekly Trendlines</h3>
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
                {recentDays.map((d, i) => (
                  <div key={`hx-${i}`} style={{ width: '20px', fontSize: '9px', color: 'var(--notion-gray-text)', textAlign: 'center' }}>
                    {new Date(d.date).getDate()}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {domains.map(domain => (
                  <div key={`row-${domain}`} style={{ display: 'flex', gap: '4px' }}>
                    {recentDays.map((d, i) => {
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

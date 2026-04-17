import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import api from '../api/axiosConfig';
import { GlassChartPanel } from './ui/WhoopAnalytics';
import { calculateScore } from '../utils/analyticsEngine';

export default function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/entries/history?days=7');
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--notion-gray-text)' }}>Analyzing this week...</div>;
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--notion-gray-text)' }}>
        <p>No data recorded yet this week.</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Log today's entry first to see insights.</p>
      </div>
    );
  }

  // --- WEEKLY INTELLIGENCE LOGIC ---
  const intel = (() => {
    const last7 = history; // Already 7 days from API

    // 1. Win/Loss
    const wins = last7.filter(e => Number(e.reflect?.dayRating) >= 7).length;
    const losses = 7 - wins;

    // 2. Sleep Debt (Target 7.5h)
    const targetSleep = 7.5;
    const sleepDebt = last7.reduce((acc, e) => acc + (targetSleep - (Number(e.body?.sleepH) || targetSleep)), 0).toFixed(1);

    // 3. Prime Day
    const dayRatings = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    last7.forEach(e => {
        const d = new Date(e.date + 'T00:00:00').getDay();
        const s = (Number(e.reflect?.dayRating) || 0) + (Number(e.career?.deepWorkBlocks) || 0) * 2;
        if (!dayRatings[d]) dayRatings[d] = [];
        dayRatings[d].push(s);
    });
    let bestIdx = -1; let maxAvg = -1;
    Object.keys(dayRatings).forEach(d => {
        const avg = dayRatings[d].reduce((a, b) => a + b, 0) / dayRatings[d].length;
        if (avg > maxAvg) { maxAvg = avg; bestIdx = d; }
    });

    // 4. Essentialism Quotient (Creation vs Noise)
    const creation = last7.reduce((acc, e) => acc + (Number(e.career?.deepWorkBlocks) || 0) + ((Number(e.mind?.meditMin) || 0) / 60), 0);
    const noise = last7.reduce((acc, e) => acc + (Number(e.vices?.screenT) || 0), 0);
    const eq = creation === 0 ? 0 : Math.min(100, Math.round((creation / (creation + noise)) * 100));

    return { wins, losses, sleepDebt, primeDay: bestIdx !== -1 ? dayNames[bestIdx] : 'N/A', eq };
  })();

  // --- RADAR DATA ---
  // --- RADAR DATA (Centralized Scoring) ---
  const domains = ['Body', 'Mind', 'Career', 'Social', 'Vices', 'Reflect'];
  const radarData = domains.map(domain => {
    let sum = 0, count = 0;
    history.forEach(e => {
      const s = calculateScore(e, domain);
      if (s !== null) { sum += s; count++; }
    });
    return {
      subject: domain,
      A: count > 0 ? Math.round(sum / count) : 0
    };
  });

  // --- LINE TREND ---
  const lineData = history.map(e => ({
    date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    Mood: Number(e.mood?.mood) || 0,
    Energy: Number(e.mood?.energy) || 0
  }));

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '80px' }}>
      
      {/* SECTION 1: THE EXECUTIVE SCOREBOARD */}
      <div className="analytics-grid" style={{ marginBottom: '24px' }}>
         <GlassChartPanel className="analytics-span-4" style={{ padding: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Win/Loss Record</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
               <span style={{ fontSize: '32px', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{intel.wins}W</span>
               <span style={{ fontSize: '20px', color: 'var(--notion-border)', fontWeight: 300 }}>&mdash;</span>
               <span style={{ fontSize: '32px', fontWeight: 900, color: '#F43F5E', lineHeight: 1 }}>{intel.losses}L</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '8px' }}>Tracking days with 7+ rating.</p>
         </GlassChartPanel>

         <GlassChartPanel className="analytics-span-4" style={{ padding: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Essentialism Quotient</p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: '#111111', lineHeight: 1 }}>{intel.eq}%</p>
            <div style={{ width: '100%', height: '4px', background: 'rgba(15,15,15,0.05)', borderRadius: '2px', marginTop: '14px', overflow: 'hidden' }}>
               <div style={{ width: `${intel.eq}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '8px' }}>Creation vs. Consumption signal.</p>
         </GlassChartPanel>

         <GlassChartPanel className="analytics-span-4" style={{ padding: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Sleep Debt</p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: intel.sleepDebt > 5 ? '#F43F5E' : '#111111', lineHeight: 1 }}>{intel.sleepDebt}h</p>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '10px' }}>Owed vs. 7.5h nightly target.</p>
         </GlassChartPanel>
      </div>

      {/* SECTION 2: CHARTS & TRENDS */}
      <div className="analytics-grid" style={{ marginBottom: '24px' }}>
        
        {/* Radar Chart Panel */}
        <GlassChartPanel className="analytics-span-12" style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Area Balance (7d Average)</p>
          <div style={{ height: '340px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(15,15,15,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--notion-gray-text)', fontSize: 13, fontWeight: 600 }} />
                <Radar name="You" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassChartPanel>

        {/* Prime Day & Insights */}
        <GlassChartPanel className="analytics-span-4" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '28px' }}>
           <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', display: 'grid', placeItems: 'center', fontSize: '32px' }}>⚡</div>
           <div>
             <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Prime Strategy Day</p>
             <p style={{ fontSize: '26px', fontWeight: 800, color: '#111111' }}>{intel.primeDay}</p>
             <p style={{ fontSize: '13px', color: 'var(--notion-gray-text)', marginTop: '4px' }}>Peak Output performance.</p>
           </div>
        </GlassChartPanel>

        <GlassChartPanel className="analytics-span-8" style={{ padding: '28px' }}>
           <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Mood & Energy Pulse</p>
           <div style={{ height: '260px', width: '100%' }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={lineData}>
                 <defs>
                   <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="date" tick={{ fill: 'var(--notion-gray-text)', fontSize: 12 }} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                 <Area type="monotone" dataKey="Mood" stroke="#6366F1" fillOpacity={1} fill="url(#colorMood)" strokeWidth={3.5} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </GlassChartPanel>

      </div>

      {/* SECTION 3: RAW FEED */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--notion-text)' }}>Weekly Log Feed</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...history].reverse().map(entry => (
          <div key={entry._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(15,15,15,0.05)' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700 }}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '4px' }}>
                {entry.reflect?.wins || 'Day maintained with steady discipline.'}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: Number(entry.reflect?.dayRating) >= 7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15,15,15,0.05)', display: 'grid', placeItems: 'center', fontWeight: 800, color: Number(entry.reflect?.dayRating) >= 7 ? '#059669' : 'var(--notion-text)' }}>
              {entry.reflect?.dayRating || '-'}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

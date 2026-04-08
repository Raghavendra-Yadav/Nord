import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import api from '../api/axiosConfig';

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

  // Derived Stats
  const validDays = history.length;
  
  const avgDayRating = (history.reduce((sum, d) => sum + (Number(d.reflect?.dayRating) || 0), 0) / validDays).toFixed(1);
  const totalDeepWork = history.reduce((sum, d) => sum + (Number(d.career?.deepWorkBlocks) || 0), 0);
  const totalReadMins = history.reduce((sum, d) => sum + (Number(d.mind?.readMin) || 0), 0);
  const totalScreenTime = history.reduce((sum, d) => sum + (Number(d.vices?.screenT) || 0), 0).toFixed(1);

  // Calculate Radar Averages
  const aggregateData = () => {
    const categories = [
      { key: 'mood.mood', name: 'Mood', max: 10 },
      { key: 'mood.energy', name: 'Energy', max: 10 },
      { key: 'reflect.dayRating', name: 'Rating', max: 10 },
      { key: 'mind.readMin', name: 'Learning', max: 60 },
      { key: 'career.carHours', name: 'Work Hrs', max: 10 },
      { key: 'environ.outdoorTime', name: 'Nature', max: 60 }
    ];

    return categories.map(cat => {
      const keys = cat.key.split('.');
      let sum = 0;
      let count = 0;

      history.forEach(entry => {
        const val = Number(entry[keys[0]]?.[keys[1]]);
        if (!isNaN(val) && val > 0) {
          sum += val;
          count++;
        }
      });

      let avg = count === 0 ? 0 : sum / count;
      const score = Math.round((avg / cat.max) * 100);
      return { subject: cat.name, A: Math.min(score, 100), fullMark: 100 };
    });
  };

  const radarData = aggregateData();

  // Line Chart Data
  const lineData = history.map(entry => {
    const dateObj = new Date(entry.date);
    return {
      date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      Mood: Number(entry.mood?.mood) || 0,
      Stress: Number(entry.mood?.stress) || 0,
      Rating: Number(entry.reflect?.dayRating) || 0
    };
  });

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.3px', color: 'var(--notion-text)' }}>7-Day Dashboard</h2>

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Avg Day Rating', val: `${avgDayRating}/10`, icon: '⭐' },
          { label: 'Deep Work Blocks', val: totalDeepWork, icon: '⏱️' },
          { label: 'Reading (Mins)', val: totalReadMins, icon: '📚' },
          { label: 'Total Screen Time', val: `${totalScreenTime}h`, icon: '📱' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--notion-input-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.icon} {stat.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--notion-text)' }}>{stat.val}</div>
          </div>
        ))}
      </div>
      
      <div className="form-grid">
        
        {/* Radar Chart Panel */}
        <div style={{ background: 'var(--notion-input-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--notion-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Life Area Balance</p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--notion-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--notion-gray-text)', fontSize: 11 }} />
                <Radar name="You" dataKey="A" stroke="#185FA5" fill="#185FA5" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart Panel */}
        <div style={{ background: 'var(--notion-input-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--notion-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Mental State Trends</p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fill: 'var(--notion-gray-text)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--notion-border)', borderRadius: '4px', fontSize: '12px' }} />
                <Line type="monotone" name="Day Rating" dataKey="Rating" stroke="#185FA5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                <Line type="monotone" name="Mood" dataKey="Mood" stroke="#34C759" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Stress" dataKey="Stress" stroke="#FF3B30" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Wins & Struggles Feed */}
      <div style={{ marginTop: '32px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-gray-text)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Daily Tape</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...history].reverse().map(entry => {
            const dateObj = new Date(entry.date);
            return (
              <div key={entry._id} style={{ padding: '16px', background: 'var(--notion-input-bg)', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                    {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#185FA5', background: 'rgba(24, 95, 165, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    Rating: {entry.reflect?.dayRating || '-'}/10
                  </span>
                </div>
                
                <div style={{ fontSize: '13.5px', color: 'var(--notion-text)', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ flexShrink: 0 }}>🏆</span>
                    <span><strong style={{ color: 'var(--notion-gray-text)' }}>Win:</strong> {entry.reflect?.wins || 'No win recorded'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>🧗</span>
                    <span><strong style={{ color: 'var(--notion-gray-text)' }}>Struggle:</strong> {entry.reflect?.struggles || 'No struggle recorded'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ flexShrink: 0 }}>🎯</span>
                    <span><strong style={{ color: 'var(--notion-gray-text)' }}>Next Day Intent:</strong> {entry.reflect?.intention || 'None set'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

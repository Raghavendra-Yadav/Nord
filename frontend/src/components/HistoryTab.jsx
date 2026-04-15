import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
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

  // Calculate Radar Averages
  const aggregateData = () => {
    const categories = [
      { key: 'mood.mood', name: 'Mood', max: 10 },
      { key: 'mood.energy', name: 'Energy', max: 10 },
      { key: 'mood.focus', name: 'Focus', max: 10 },
      { key: 'reflect.dayRating', name: 'Day Rating', max: 10 },
      { key: 'career.carHours', name: 'Work Hrs', max: 12 },
      { key: 'vices.screenT', name: 'Screen Time', max: 12 },   // Inverse scale Ideally
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
      // Convert to 100-base score for the radar
      const score = Math.round((avg / cat.max) * 100);
      return { subject: cat.name, A: Math.min(score, 100), fullMark: 100 };
    });
  };

  const radarData = aggregateData();

  // Format data for Line Graph (Mood vs Energy over time)
  const lineData = history.map(entry => {
    const dateObj = new Date(entry.date);
    return {
      date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      Mood: Number(entry.mood?.mood) || 0,
      Energy: Number(entry.mood?.energy) || 0
    };
  });

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.3px' }}>7-Day Insights</h2>
      
      <div className="form-grid">
        
        {/* Radar Chart Panel */}
        <div style={{ background: 'var(--notion-input-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--notion-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Area Balance Profile</p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--notion-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--notion-gray-text)', fontSize: 11 }} />
                <Radar name="You" dataKey="A" stroke="#000000" fill="#000000" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart Panel */}
        <div style={{ background: 'var(--notion-input-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--notion-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Mood & Energy Trends</p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fill: 'var(--notion-gray-text)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--notion-border)', borderRadius: '4px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="Mood" stroke="#000000" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Energy" stroke="#888888" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Raw Logs List */}
      <div style={{ marginTop: '32px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-gray-text)', marginBottom: '12px' }}>Weekly Log Feed</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...history].reverse().map(entry => (
            <div key={entry._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--notion-input-bg)', borderRadius: '6px', border: '1px solid var(--notion-border)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                <div style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '4px' }}>
                  {entry.reflect?.wins ? `Win: ${entry.reflect.wins}` : 'No reflection logged.'}
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                {entry.mood?.mood ? `${entry.mood.mood}/10` : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

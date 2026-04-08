import { useState, useEffect } from 'react';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import api from '../api/axiosConfig';

export default function MonthTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonth = async () => {
      try {
        const { data } = await api.get('/entries/history?days=30');
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchMonth();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Loading 30-Day Protocol...</div>;

  // "The Scorecard" (Atomic Habits pattern visualization)
  // Calculate consistency across 30 days
  const daysTracked = history.length;
  let habitConsistency = 0;
  
  const heatMapGrid = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const entry = history.find(e => e.date === dateStr);
    
    // Evaluate depth of entry 
    let activityLevel = 0; // 0-4
    if (entry) {
      if (entry.body?.steps) activityLevel += 1;
      if (entry.mind?.meditation === 'done') activityLevel += 1;
      if (entry.career?.carHours > 0) activityLevel += 1;
      if (entry.reflect?.wins) activityLevel += 1;
    }
    habitConsistency += activityLevel;
    
    return { date: dateStr, level: activityLevel };
  });

  const getHeatColor = (level) => {
    if (level === 0) return 'rgba(15, 15, 15, 0.05)';
    if (level === 1) return 'rgba(65, 131, 196, 0.3)';
    if (level === 2) return 'rgba(65, 131, 196, 0.6)';
    if (level === 3) return 'rgba(65, 131, 196, 0.8)';
    return '#185FA5'; // Max Discipline
  };

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>30-Day Protocol & Consistency</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Heatmap (Discipline Grid) */}
        <div style={{ background: '#fff', border: '1px solid var(--notion-border)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600 }}>The Scorecard (Atomic Habits)</p>
            <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)' }}>Last 30 Days</p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {heatMapGrid.map((day, i) => (
              <div 
                key={i} 
                title={`${day.date}: Protocol Level ${day.level}`}
                style={{ 
                  width: '18px', height: '18px', borderRadius: '4px', 
                  background: getHeatColor(day.level),
                  transition: 'transform 0.1s', cursor: 'pointer'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--notion-gray-text)', marginTop: '12px' }}>
            James Clear emphasizes the "Habit Scorecard". Darker squares = higher systemic discipline across Body, Mind, Career, and Reflection criteria.
          </p>
        </div>

        {/* Essentialism Stats */}
        <div style={{ background: '#fff', border: '1px solid var(--notion-border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-gray-text)', textTransform: 'uppercase', marginBottom: '8px' }}>1% Better Every Day</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#185FA5' }}>{Math.min(100, Math.round((habitConsistency / 120) * 100))}%</p>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', textAlign: 'center', marginTop: '8px' }}>System output consistency over the last 30 days.</p>
        </div>

      </div>

      {/* Deep Work (Cal Newport) Analysis */}
      <div style={{ background: '#fff', border: '1px solid var(--notion-border)', padding: '20px', borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Deep Work Output (Cal Newport)</p>
        <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Tracking intense career/skill focus sessions devoid of distraction.</p>
        
        <div style={{ height: '200px', width: '100%', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatMapGrid.slice(-14)}> {/* Last 14 days zoom */}
              <XAxis dataKey="date" tickFormatter={str => new Date(str).getDate()} tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 4, fontSize: 12, border: '1px solid var(--notion-border)' }}/>
              <Bar dataKey="level" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

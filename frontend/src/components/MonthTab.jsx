import { useState, useEffect } from 'react';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import api from '../api/axiosConfig';
import { GlassChartPanel } from './ui/WhoopAnalytics';
import { calculateDayAverage } from '../utils/analyticsEngine';

export default function MonthTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const fetchMonth = async () => {
      try {
        const { data } = await api.get('/entries/history?days=90');
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchMonth();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Loading Calendar...</div>;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getEntryForDate = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return history.find((e) => e.date === dateStr);
  };
  
  let monthlyLogs = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    if (getEntryForDate(i)) monthlyLogs++;
  }

  // Calculate deep work array for a chart 
  const recentDays = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const e = history.find(entry => entry.date === dateStr);
    return {
      date: dateStr,
      level: e ? (e.career?.carHours ? parseInt(e.career.carHours) : 1) : 0
    };
  });

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: '8px' }}>
              Monthly Review
           </h2>
           <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px' }}>The calendar overview of your consistency.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={prevMonth} className="notion-button" style={{ width: 'auto', padding: '0 12px', marginTop: 0, background: 'var(--notion-input-bg)', color: 'var(--notion-text)', border: '1px solid var(--notion-border)' }}>&larr; Prev</button>
          <span style={{ fontSize: '16px', fontWeight: 700, minWidth: '130px', textAlign: 'center' }}>{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="notion-button" style={{ width: 'auto', padding: '0 12px', marginTop: 0, background: 'var(--notion-input-bg)', color: 'var(--notion-text)', border: '1px solid var(--notion-border)' }}>Next &rarr;</button>
        </div>
      </div>

      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        <GlassChartPanel className="analytics-span-8">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {daysOfWeek.map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase' }}>{day}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {calendarDays.map((day, index) => {
                const entry = getEntryForDate(day);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                const score = entry ? calculateDayAverage(entry) : null;

                const getBgColor = () => {
                  if (!day) return 'transparent';
                  if (!entry) return 'rgba(15, 15, 15, 0.02)'; // Empty logged out day
                  if (score < 40) return 'rgba(224, 62, 62, 0.4)'; // Low / Warning (Red)
                  if (score < 65) return 'rgba(99, 102, 241, 0.2)'; // Baseline (Light Indigo)
                  if (score < 85) return 'rgba(99, 102, 241, 0.5)'; // High Performance
                  return 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'; // Elite Performance
                };

                const textColor = entry && score > 2 ? '#fff' : 'var(--notion-text)';

                return (
                  <div 
                    key={index} 
                    onClick={() => entry && setSelectedEntry(entry)}
                    title={entry ? `Logged! Click to view details.` : day ? `No entry for ${day}` : ''}
                    style={{ 
                      aspectRatio: '1', 
                      background: getBgColor(),
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: isToday ? 800 : 600,
                      color: textColor,
                      border: isToday ? '2px solid #111111' : '1px solid rgba(15,15,15,0.06)',
                      boxShadow: entry && score > 3 ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                      opacity: day ? 1 : 0,
                      cursor: entry ? 'pointer' : 'default',
                      transform: selectedEntry?.date === entry?.date && entry ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {day || ''}
                  </div>
                );
              })}
            </div>
        </GlassChartPanel>

        <div className="analytics-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
           {selectedEntry ? (
             <GlassChartPanel style={{ animation: 'smoothDropIn 0.3s ease forwards' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                      {new Date(selectedEntry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)' }}>Detail View</p>
                  </div>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    style={{ background: 'rgba(15,15,15,0.05)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: 'var(--notion-gray-text)' }}
                  >Close</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--notion-input-bg)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--notion-gray-text)', marginBottom: '6px', letterSpacing: '0.4px' }}>Metrics</p>
                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p>Sleep: <strong>{selectedEntry.body?.sleepH || '-'}h</strong></p>
                      <p>Deep Work: <strong>{selectedEntry.career?.deepWorkBlocks || '0'} blks</strong></p>
                      <p>Spent: <strong>${selectedEntry.finance?.spent || '0'}</strong></p>
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#6366F1', marginBottom: '6px', letterSpacing: '0.4px' }}>Reflection</p>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5', color: 'var(--notion-text)' }}>
                      "{selectedEntry.reflect?.wins || selectedEntry.reflect?.gratitude || 'No reflection logged.'}"
                    </p>
                  </div>
                </div>
             </GlassChartPanel>
           ) : (
             <GlassChartPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.6px' }}>Consistency ({monthNames[month]})</p>
                <p style={{ fontSize: '42px', fontWeight: 800, color: '#111111', letterSpacing: '-1px' }}>{Math.round((monthlyLogs / daysInMonth) * 100)}%</p>
                <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', textAlign: 'center', marginTop: '8px' }}>
                  {monthlyLogs} of {daysInMonth} days logged.
                </p>
             </GlassChartPanel>
           )}

           <GlassChartPanel>
              <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Deep Work Output</p>
              <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px' }}>Recent 14 day session lengths.</p>
              
              <div style={{ height: '140px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentDays} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <XAxis dataKey="date" tickFormatter={str => new Date(str + 'T00:00:00').getDate()} tick={{ fontSize: 11, fill: 'var(--notion-gray-text)' }} axisLine={false} tickLine={false} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.2)" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="level" fill="url(#barGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassChartPanel>

        </div>
      </div>

    </div>
  );
}

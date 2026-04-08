import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export default function MonthTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchMonth = async () => {
      try {
        // Fetch last 60 days to ensure we have enough data to fill a calendar view
        const { data } = await api.get('/entries/history?days=60');
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchMonth();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: 'var(--notion-gray-text)' }}>Loading Calendar...</div>;

  // Calendar Logic
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = monthStart.getDay(); // 0 is Sunday
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < startDate; i++) {
    calendarDays.push(null); // Empty slots before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    // Adjust for local timezone offset when comparing strings
    const dateStr = dateObj.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format reliably
    calendarDays.push({ dayNum: i, dateStr });
  }

  const selectedEntry = selectedDate ? history.find(e => e.date === selectedDate) : null;

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', display: 'flex', gap: '24px' }}>
      
      {/* Calendar Area */}
      <div style={{ flex: '1', minWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--notion-text)' }}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={prevMonth} className="notion-button" style={{ padding: '4px 12px', background: 'var(--notion-input-bg)' }}>←</button>
            <button onClick={nextMonth} className="notion-button" style={{ padding: '4px 12px', background: 'var(--notion-input-bg)' }}>→</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-gray-text)', textAlign: 'center', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
          {calendarDays.map((calDay, i) => {
            if (!calDay) return <div key={`empty-${i}`} style={{ height: '80px' }} />;
            
            const entry = history.find(e => e.date === calDay.dateStr);
            const isSelected = selectedDate === calDay.dateStr;
            const hasData = !!entry;
            const rating = entry?.reflect?.dayRating;

            return (
              <div 
                key={calDay.dateStr}
                onClick={() => setSelectedDate(calDay.dateStr)}
                style={{
                  height: '80px',
                  border: isSelected ? '2px solid #185FA5' : '1px solid var(--notion-border)',
                  borderRadius: '8px',
                  padding: '8px',
                  background: isSelected ? 'rgba(24, 95, 165, 0.05)' : hasData ? 'var(--notion-input-bg)' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  position: 'relative',
                  overflow: 'hidden' // Force contain content
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: hasData ? 'var(--notion-text)' : 'var(--notion-gray-text)' }}>
                  {calDay.dayNum}
                </div>
                {hasData && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#185FA5', fontWeight: 600, background: 'rgba(24,95,165,0.1)', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>
                    {rating ? `${rating}/10` : 'Logged'}
                  </div>
                )}
                {entry?.reflect?.wins && (
                  <div 
                    title={entry.reflect.wins}
                    style={{ 
                      fontSize: '10px', 
                      color: 'var(--notion-text)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      marginTop: '6px',
                      maxWidth: '100%' 
                    }}
                  >
                    🏆 {entry.reflect.wins}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div style={{ width: '380px', flexShrink: 0 }}>
        {selectedDate ? (
          <div style={{ background: 'var(--notion-input-bg)', border: '1px solid var(--notion-border)', borderRadius: '12px', padding: '24px', position: 'sticky', top: '40px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {selectedEntry?.reflect?.dayRating && (
                <span style={{ fontSize: '13px', color: '#185FA5', background: 'rgba(24,95,165,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                  Rating: {selectedEntry.reflect.dayRating}/10
                </span>
              )}
            </h3>

            {!selectedEntry ? (
              <p style={{ color: 'var(--notion-gray-text)', fontSize: '13px', fontStyle: 'italic' }}>No data logged for this day.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Wins & Struggles */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--notion-gray-text)', letterSpacing: '0.5px', marginBottom: '8px' }}>Reflections</h4>
                  <div style={{ fontSize: '13px', background: '#fff', border: '1px solid var(--notion-border)', padding: '12px', borderRadius: '6px' }}>
                    <p style={{ marginBottom: '6px' }}><strong>🏆 Win:</strong> {selectedEntry.reflect?.wins || '-'}</p>
                    <p style={{ marginBottom: '6px' }}><strong>🧗 Struggle:</strong> {selectedEntry.reflect?.struggles || '-'}</p>
                    <p><strong>🙏 Grateful:</strong> {selectedEntry.reflect?.gratitude || '-'}</p>
                  </div>
                </div>

                {/* Health & Habits */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--notion-gray-text)', letterSpacing: '0.5px', marginBottom: '8px' }}>Body & Mind</h4>
                    <div style={{ fontSize: '12px', background: '#fff', border: '1px solid var(--notion-border)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ marginBottom: '4px' }}>💪 Train: {selectedEntry.body?.workout || 'no'}</p>
                      <p style={{ marginBottom: '4px' }}>🏃 Z2: {selectedEntry.body?.zone2Cardio || 'no'}</p>
                      <p style={{ marginBottom: '4px' }}>🧘 Meditate: {selectedEntry.mind?.meditMin ? `${selectedEntry.mind.meditMin}m` : '0m'}</p>
                      <p>📚 Read: {selectedEntry.mind?.readMin ? `${selectedEntry.mind.readMin}m` : '0m'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--notion-gray-text)', letterSpacing: '0.5px', marginBottom: '8px' }}>Mental State</h4>
                    <div style={{ fontSize: '12px', background: '#fff', border: '1px solid var(--notion-border)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ marginBottom: '4px' }}>⚡ Mood: {selectedEntry.mood?.mood || '-'}/10</p>
                      <p style={{ marginBottom: '4px' }}>🔋 Energy: {selectedEntry.mood?.energy || '-'}/10</p>
                      <p style={{ marginBottom: '4px' }}>🤯 Stress: {selectedEntry.mood?.stress || '-'}/10</p>
                      <p>🎯 Focus: {selectedEntry.mood?.focus || '-'}/10</p>
                    </div>
                  </div>
                </div>

                {/* Career & Vices */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--notion-gray-text)', letterSpacing: '0.5px', marginBottom: '8px' }}>Output & Friction</h4>
                  <div style={{ fontSize: '13px', background: '#fff', border: '1px solid var(--notion-border)', padding: '12px', borderRadius: '6px' }}>
                    <p style={{ marginBottom: '6px' }}><strong>⏱️ Deep Work:</strong> {selectedEntry.career?.deepWorkBlocks || '0'} blocks</p>
                    <p style={{ marginBottom: '6px' }}><strong>📱 Screen Time:</strong> {selectedEntry.vices?.screenT || '0'} hrs</p>
                    <p><strong>🎯 Tomorrow:</strong> {selectedEntry.reflect?.intention || '-'}</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--notion-input-bg)', border: '1px dashed var(--notion-border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--notion-gray-text)' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '12px' }}>🗓️</span>
            <p style={{ fontSize: '14px', fontWeight: 500 }}>Select a day</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Click on any date in the calendar to view the full log details.</p>
          </div>
        )}
      </div>

    </div>
  );
}

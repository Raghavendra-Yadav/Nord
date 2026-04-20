import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { calculateDayAverage } from '../utils/analyticsEngine';
import { GradientBarReport, SparkBars } from './ui/NordCharts';

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

  if (loading) return (
    <div style={{ padding: 40, color: 'var(--notion-gray-text)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      Loading calendar…
    </div>
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getEntryForDate = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return history.find(e => e.date === dateStr);
  };

  let monthlyLogs = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    if (getEntryForDate(i)) monthlyLogs++;
  }
  const consistencyPct = Math.round((monthlyLogs / daysInMonth) * 100);

  // Nord heat colors for calendar
  const heatColor = (score) => {
    if (score == null) return undefined;
    if (score < 40) return 'oklch(0.45 0.18 25 / 0.55)';
    if (score < 65) return 'oklch(0.62 0.18 295 / 0.45)';
    if (score < 85) return 'oklch(0.68 0.20 295 / 0.65)';
    return 'oklch(0.72 0.22 295 / 0.92)';
  };

  // Deep work bar data (last 14 days)
  const recentDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const e = history.find(entry => entry.date === dateStr);
    return {
      label: String(d.getDate()).padStart(2, '0'),
      value: e ? (Number(e.career?.deepWorkBlocks) || 0) : 0
    };
  });
  const deepWorkHighlight = recentDays.reduce((best, d, i, arr) => d.value > arr[best].value ? i : best, 0);
  const totalDeepWork = recentDays.reduce((s, d) => s + d.value, 0);

  // 7-day spark for consistency
  const last7Logs = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    return history.find(e => e.date === dateStr) ? 100 : 10;
  });

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: 8 }}>
            Monthly Review
          </h2>
          <p style={{ color: 'var(--notion-gray-text)', fontSize: 14 }}>
            Consistency · {monthNames[month]} {year}
          </p>
        </div>
        <div className="seg">
          <button onClick={prevMonth}>← Prev</button>
          <button style={{ minWidth: 120, fontWeight: 600, cursor: 'default', pointerEvents: 'none' }} data-active="true">
            {monthNames[month].slice(0, 3)} {year}
          </button>
          <button onClick={nextMonth}>Next →</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid" style={{ marginBottom: 20 }}>
        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label">▸ Monthly consistency</div>
          <div className="kpi-big" style={{ marginBottom: 8 }}>
            <div className="kpi-big__value tnum" style={{ fontSize: 40 }}>{consistencyPct}%</div>
            <div className="kpi-big__delta kpi-big__delta--up">{monthlyLogs} of {daysInMonth} days logged</div>
          </div>
          <div className="dbar__track" style={{ marginTop: 10 }}>
            <div className={`dbar__fill${consistencyPct < 50 ? ' dbar__fill--bad' : consistencyPct < 75 ? ' dbar__fill--warn' : ''}`}
              style={{ '--v': `${consistencyPct}%` }} />
          </div>
        </section>

        <section className="card col-3" style={{ padding: 20 }}>
          <div className="card__label">▸ 7-day streak</div>
          <div className="kpi-big" style={{ marginBottom: 8 }}>
            <div className="kpi-big__value tnum" style={{ fontSize: 40 }}>
              {last7Logs.filter(v => v === 100).length}
              <small>/7</small>
            </div>
            <div className="kpi-big__delta">days logged this week</div>
          </div>
          <SparkBars values={last7Logs} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
        </section>

        <section className="card col-6" style={{ padding: 20 }}>
          <div className="card__label card__label--pair">
            <span>▮ Deep work output · 14 days</span>
            <span className="mono small dim">{totalDeepWork} blocks total</span>
          </div>
          <div style={{ height: 100, marginTop: 8 }}>
            <GradientBarReport data={recentDays} highlightIdx={deepWorkHighlight} />
          </div>
        </section>
      </div>

      {/* Calendar + sidebar */}
      <div className="grid">
        {/* Calendar */}
        <section className="card col-8" style={{ padding: 22 }}>
          <div className="card__label card__label--pair" style={{ marginBottom: 16 }}>
            <span>◉ Calendar · {monthNames[month]}</span>
            <span>{monthlyLogs} logged</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
            {daysOfWeek.map(day => (
              <div key={day} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {calendarDays.map((day, index) => {
              const entry = getEntryForDate(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const score = entry ? calculateDayAverage(entry) : null;
              const bg = entry ? (heatColor(score) || 'color-mix(in oklch, var(--accent) 25%, transparent)') : undefined;

              return (
                <div
                  key={index}
                  onClick={() => entry && setSelectedEntry(entry)}
                  title={entry ? `Score ${score} — click to view` : day ? `No log for ${day}` : ''}
                  style={{
                    aspectRatio: '1',
                    background: bg || (day ? 'color-mix(in oklch, var(--fg) 4%, transparent)' : 'transparent'),
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isToday ? 800 : 600,
                    fontFamily: 'var(--mono)',
                    color: 'var(--notion-text)',
                    border: isToday
                      ? '2px solid var(--accent)'
                      : selectedEntry?.date === entry?.date && entry
                        ? '1px solid color-mix(in oklch, var(--accent) 60%, transparent)'
                        : '1px solid transparent',
                    boxShadow: entry && score > 65 ? '0 2px 10px color-mix(in oklch, var(--accent) 30%, transparent)' : 'none',
                    opacity: day ? 1 : 0,
                    cursor: entry ? 'pointer' : 'default',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {day || ''}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="legend">
            <span><i style={{ background: 'color-mix(in oklch, var(--fg) 4%, transparent)', border: '1px solid var(--line)' }} />No log</span>
            <span><i style={{ background: heatColor(30) }} />0–40</span>
            <span><i style={{ background: heatColor(55) }} />40–65</span>
            <span><i style={{ background: heatColor(72) }} />65–85</span>
            <span><i style={{ background: heatColor(90) }} />85+</span>
          </div>
        </section>

        {/* Sidebar */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedEntry ? (
            <section className="card card--dark" style={{ padding: 20, animation: 'smoothDropIn 0.2s ease forwards' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div className="card__label">◉ Day detail</div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>
                    {new Date(selectedEntry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  style={{ background: 'color-mix(in oklch, var(--fg) 8%, transparent)', border: '1px solid var(--line)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--fg-mute)' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Sleep', value: `${selectedEntry.body?.sleepH || '—'}h` },
                    { label: 'Deep work', value: `${selectedEntry.career?.deepWorkBlocks || '0'} blks` },
                    { label: 'Spent', value: `$${selectedEntry.finance?.spent || '0'}` },
                    { label: 'Day rating', value: `${selectedEntry.reflect?.dayRating || '—'}/10` },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '10px 12px', background: 'color-mix(in oklch, var(--fg) 5%, transparent)', borderRadius: 8, border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-dim)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {(selectedEntry.reflect?.wins || selectedEntry.reflect?.gratitude) && (
                  <div style={{ padding: '10px 12px', background: 'color-mix(in oklch, var(--accent) 8%, transparent)', borderRadius: 8, border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>Reflection</div>
                    <p style={{ fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.55, color: 'var(--fg-mute)' }}>
                      "{selectedEntry.reflect?.wins || selectedEntry.reflect?.gratitude}"
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="card card--dark" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="card__label" style={{ justifyContent: 'center', marginBottom: 10 }}>◆ {monthNames[month]} consistency</div>
              <div className="kpi-big__value tnum" style={{ fontSize: 52, marginBottom: 4 }}>{consistencyPct}%</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>
                {monthlyLogs} of {daysInMonth} days
              </div>
              <div className="dbar__track" style={{ width: '100%', marginTop: 16 }}>
                <div className={`dbar__fill${consistencyPct < 50 ? ' dbar__fill--bad' : consistencyPct < 75 ? ' dbar__fill--warn' : ''}`}
                  style={{ '--v': `${consistencyPct}%` }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 12 }}>
                Click any logged day to see details.
              </p>
            </section>
          )}
        </div>
      </div>

    </div>
  );
}

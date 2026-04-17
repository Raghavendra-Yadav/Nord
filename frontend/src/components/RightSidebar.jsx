import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

export default function RightSidebar() {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/entries/history?days=30');
        const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(sorted);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading || !user) return null;

  // Calculate Streaks safely based on descending history array
  const calculateStreak = (conditionFn) => {
    let streak = 0;
    const dToday = new Date();
    const todayStr = new Date(dToday.getTime() - dToday.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if (i === 0 && entry.date === todayStr && !conditionFn(entry)) {
        continue; 
      }
      if (conditionFn(entry)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const deepWorkStreak = calculateStreak(e => Number(e.career?.deepWorkBlocks) > 0);
  const sunlightStreak = calculateStreak(e => e.body?.hubermanSunlight === 'yes');
  const gogginsStreak = calculateStreak(e => e.mind?.gogginsHardThing && e.mind.gogginsHardThing.length > 2);

  // Financial Summary (Rolling 30 days)
  let totalSpent = 0;
  let totalInvested = 0;
  history.forEach(e => {
    totalSpent += Number(e.finance?.spent) || 0;
    totalInvested += Number(e.finance?.investAmt) || 0;
  });

  // System Metrics
  const level = user.level || 1;
  const xp = user.xp || 0;

  return (
    <aside className="notion-right-sidebar" style={{ animation: 'smoothDropIn 0.5s ease forwards' }}>
      
      {/* Premium Telemetry Overview */}
      <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
        Telemetry Confidence
      </h3>
      
      <div style={{ marginBottom: '24px', background: 'var(--notion-input-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--notion-text)', letterSpacing: '-0.5px' }}>{history.length} / 30</div>
            <div style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginTop: '2px' }}>Trailing 30 Days Captured</div>
          </div>
          <div style={{ width: '8px', height: '8px', background: history.length > 20 ? '#185FA5' : '#D9730D', borderRadius: '50%', marginTop: '6px' }} />
        </div>
        
        <div style={{ background: 'var(--notion-border)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ background: history.length > 20 ? '#185FA5' : '#D9730D', height: '100%', width: `${Math.min((history.length / 30) * 100, 100)}%`, transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
        Habit Continuity
      </h3>
      
      <div className="stats-card" style={{ border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '1px solid var(--notion-border)', borderRadius: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--notion-text)' }}>Deep Work Protocol</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: deepWorkStreak > 0 ? '#185FA5' : 'var(--notion-gray-text)' }}>
            {deepWorkStreak} Days
          </span>
        </div>
      </div>

      <div className="stats-card" style={{ border: 'none', background: 'transparent', padding: '12px 0', borderBottom: '1px solid var(--notion-border)', borderRadius: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--notion-text)' }}>Morning Sunlight</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: sunlightStreak > 0 ? '#185FA5' : 'var(--notion-gray-text)' }}>
            {sunlightStreak} Days
          </span>
        </div>
      </div>

      <div className="stats-card" style={{ border: 'none', background: 'transparent', padding: '12px 0 0 0', borderRadius: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--notion-text)' }}>High-Friction Tasks</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: gogginsStreak > 0 ? '#185FA5' : 'var(--notion-gray-text)' }}>
            {gogginsStreak} Days
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '32px 0 16px 0' }}>
        30-Day Spending
      </h3>

      <div className="stats-card" style={{ background: '#fef5f5' }}>
        <div style={{ fontSize: '11px', color: '#E03E3E', textTransform: 'uppercase', fontWeight: 600 }}>Total Burned</div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#a02020' }}>${totalSpent.toFixed(2)}</div>
      </div>

      <div className="stats-card" style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--notion-gray-text)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Daily Spend</div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: '#333' }}>${history.length > 0 ? (totalSpent / history.length).toFixed(2) : '0.00'}</div>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--notion-input-bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--notion-gray-text)' }}>
        <strong>Current Objective:</strong><br />
        Focus blindly on maintaining the Deep Work and Hard Thing baseline. Everything else is secondary.
      </div>

    </aside>
  );
}

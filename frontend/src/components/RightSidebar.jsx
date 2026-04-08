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
    const todayStr = new Date().toISOString().split('T')[0];
    
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

  // Gamification Metrics
  const level = user.level || 1;
  const xp = user.xp || 0;
  const nextLevelXp = level * 100 * 1.5;
  const xpProgress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <aside className="notion-right-sidebar" style={{ animation: 'smoothDropIn 0.5s ease forwards' }}>
      
      {/* Player Card Gamification */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(145deg, #0f172a, #1e293b)', padding: '16px', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, fontWeight: 600 }}>Ascension Level</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>{level}</div>
          </div>
          <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🦅
          </div>
        </div>
        
        {/* XP Bar */}
        <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ background: '#38bdf8', height: '100%', width: `${xpProgress}%`, transition: 'width 0.5s ease' }}></div>
        </div>
        <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
          <span>{xp} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
      </div>

      <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
        Live Streaks
      </h3>
      
      <div className="stats-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Deep Work</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: deepWorkStreak > 0 ? '#E03E3E' : 'var(--notion-gray-text)' }}>
            🔥 {deepWorkStreak}
          </span>
        </div>
      </div>

      <div className="stats-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Morning Sun</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: sunlightStreak > 0 ? '#E03E3E' : 'var(--notion-gray-text)' }}>
            🔥 {sunlightStreak}
          </span>
        </div>
      </div>

      <div className="stats-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Doing Hard Things</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: gogginsStreak > 0 ? '#E03E3E' : 'var(--notion-gray-text)' }}>
            🔥 {gogginsStreak}
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

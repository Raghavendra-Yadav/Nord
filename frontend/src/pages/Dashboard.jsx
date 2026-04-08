import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import HistoryTab from '../components/HistoryTab';
import MonthTab from '../components/MonthTab';
import CoachTab from '../components/CoachTab';
import RightSidebar from '../components/RightSidebar';
import ExperimentsTab from '../components/ExperimentsTab';
import ExecutionTab from '../components/ExecutionTab';
import SkinCareTab from '../components/SkinCareTab';

const AREAS = [
  { id: 'body', label: 'Body', icon: '◈' },
  { id: 'mind', label: 'Mind', icon: '◉' },
  { id: 'mood', label: 'Mood', icon: '◐' },
  { id: 'vices', label: 'Vices', icon: '◯' },
  { id: 'career', label: 'Career', icon: '◆' },
  { id: 'finance', label: 'Finance', icon: '💵' },
  { id: 'relations', label: 'Social', icon: '◇' },
  { id: 'environ', label: 'Env', icon: '⌂' },
  { id: 'reflect', label: 'Reflect', icon: '◌' }
];

export default function Dashboard() {
  const { logout, updateXp } = useContext(AuthContext);
  const [mainTab, setMainTab] = useState('log');
  const [activeArea, setActiveArea] = useState('body');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Entire state mapped to MongoDB Schema explicitly 
  const [entry, setEntry] = useState({
    body: { sleepH: '', sleepBedtime: '', sleepWakeTime: '', sleepQ: 7, wakeWithoutAlarm: 'no', workoutType: 'rest', muscleGroup: 'none', exerciseMin: '', zone2Cardio: '', prHit: 'no', steps: '', meals: '', proteinGrams: '', ifFasting: 'no', firstMealTime: '', ateJunk: 'no', water: '', hubermanSunlight: 'no', coldShower: 'no', restingHR: '', hrv: '', weight: '', creatine: 'no', supplements: '' },
    mind: { meditMin: '', journalMin: '', noPhoneFirstHour: 'no', readMin: '', podcastDone: 'no', learnNote: '', gogginsHardThing: '' },
    mood: { mood: '', energy: '', focus: '', anxiety: '', stress: '', feelNote: '', emotionTags: '' },
    vices: { mast: '', porn: '', coffee: '', vaping: '', vapAmt: '', alcohol: '', alcDrinks: '', screenT: '', doomScroll: '' },
    career: { carHours: '', appsOut: '', skillPractice: 'no', projectWork: 'no', leetcode: 'no', networkingDone: 'no', carNote: '', deepWorkBlocks: '0', flowState: 'no' },
    finance: { budget: '', spent: '', spentCat: '', saved: '', income: '', invested: '', investAmt: '', impulse: '', finNote: '' },
    relations: { social: '', meaningConvo: '', calledFamily: '', helpedSomeone: '', connectedWith: '', conflict: '', lonely: '' },
    environ: { roomClean: '', bedMade: '', mornRoutine: '', nightRoutine: '', outdoorTime: '', sunlight: '', phoneFree: '', creative: '' },
    reflect: { wins: '', struggles: '', gratitude: '', intention: '', dayRating: '', notes: '', onePercentBetter: '' }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/entries/${date}`);
        if (data) {
          // Merge API data into our state to prevent undefined object errors
          setEntry(prev => ({
            body: { ...prev.body, ...data?.body },
            mind: { ...prev.mind, ...data?.mind },
            mood: { ...prev.mood, ...data?.mood },
            vices: { ...prev.vices, ...data?.vices },
            career: { ...prev.career, ...data?.career },
            finance: { ...prev.finance, ...data?.finance },
            relations: { ...prev.relations, ...data?.relations },
            environ: { ...prev.environ, ...data?.environ },
            reflect: { ...prev.reflect, ...data?.reflect }
          }));
        } else {
          // Reset if none found
          setEntry({
            body: { sleepH: '', sleepBedtime: '', sleepWakeTime: '', sleepQ: 7, wakeWithoutAlarm: 'no', workoutType: 'rest', muscleGroup: 'none', exerciseMin: '', zone2Cardio: '', prHit: 'no', steps: '', meals: '', proteinGrams: '', ifFasting: 'no', firstMealTime: '', ateJunk: 'no', water: '', hubermanSunlight: 'no', coldShower: 'no', restingHR: '', hrv: '', weight: '', creatine: 'no', supplements: '' },
            mind: { meditMin: '', journalMin: '', noPhoneFirstHour: 'no', readMin: '', podcastDone: 'no', learnNote: '', gogginsHardThing: '' },
            mood: { mood: '', energy: '', focus: '', anxiety: '', stress: '', feelNote: '', emotionTags: '' },
            vices: { mast: '', porn: '', coffee: '', vaping: '', vapAmt: '', alcohol: '', alcDrinks: '', screenT: '', doomScroll: '' },
            career: { carHours: '', appsOut: '', skillPractice: 'no', projectWork: 'no', leetcode: 'no', networkingDone: 'no', carNote: '', deepWorkBlocks: '0', flowState: 'no' },
            finance: { budget: '', spent: '', spentCat: '', saved: '', income: '', invested: '', investAmt: '', impulse: '', finNote: '' },
            relations: { social: '', meaningConvo: '', calledFamily: '', helpedSomeone: '', connectedWith: '', conflict: '', lonely: '' },
            environ: { roomClean: '', bedMade: '', mornRoutine: '', nightRoutine: '', outdoorTime: '', sunlight: '', phoneFree: '', creative: '' },
            reflect: { wins: '', struggles: '', gratitude: '', intention: '', dayRating: '', notes: '', onePercentBetter: '' }
          });
        }
      } catch (err) {
        console.error("Failed to fetch entry", err);
      }
      setLoading(false);
    };
    fetchEntry();
  }, [date]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.put(`/entries/${date}`, entry);
      updateXp(10, 'Saved daily log'); // Reward points for data persistence!
      // Artificial delay so user can see it's saving
      setTimeout(() => {
         setSaving(false);
         setSavedSuccess(true);
         setTimeout(() => setSavedSuccess(false), 2000);
      }, 600);
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save data. " + (err.response?.data?.message || err.message));
      setSaving(false);
    }
  };

  const updateField = (area, field, value) => {
    setEntry(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        [field]: value
      }
    }));
  };

  return (
    <div className="app-wrapper">
      
      {/* Notion-Style Permanent Left Sidebar */}
      <aside className="notion-sidebar">
        {/* Daily Stoic Embedded Quote */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#000' }}>Nord</div>
          <div style={{ fontSize: '11px', color: 'var(--notion-gray-text)', fontStyle: 'italic', marginTop: '2px' }}>Your life, engineered.</div>
        </div>

        <div className="sidebar-section">Tracking Hub</div>
        <button className={`sidebar-link ${mainTab === 'log' ? 'active' : ''}`} onClick={() => setMainTab('log')}>✍️ Daily Log</button>
        <button className={`sidebar-link ${mainTab === 'history' ? 'active' : ''}`} onClick={() => setMainTab('history')}>📊 This Week</button>
        <button className={`sidebar-link ${mainTab === 'month' ? 'active' : ''}`} onClick={() => setMainTab('month')}>🗓️ Month Review</button>
        
        <div className="sidebar-section">Features</div>
        <button className={`sidebar-link ${mainTab === 'coach' ? 'active' : ''}`} onClick={() => setMainTab('coach')}>🤖 AI Sunday Coach</button>
        <button className={`sidebar-link ${mainTab === 'experiments' ? 'active' : ''}`} onClick={() => setMainTab('experiments')}>🧪 Trial Experiments</button>
        <button className={`sidebar-link ${mainTab === 'execution' ? 'active' : ''}`} onClick={() => setMainTab('execution')}>🎯 Execution Matrix</button>
        <button className={`sidebar-link ${mainTab === 'skincare' ? 'active' : ''}`} onClick={() => setMainTab('skincare')}>💧 Skincare Regimen</button>
        <div style={{ flex: 1 }}></div>

        <button onClick={logout} className="sidebar-link" style={{ border: '1px solid var(--notion-border)', justifyContent: 'center' }}>
          Log out
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="notion-main">
        <div className="notion-dashboard">
          
          <header className="dashboard-header">
            <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>
              {mainTab === 'log' && 'Daily Alignment Log'}
              {mainTab === 'history' && '7-Day Insights'}
              {mainTab === 'month' && 'The Habit Scorecard'}
              {mainTab === 'coach' && 'AI Sunday Review'}
              {mainTab === 'execution' && ''}
              {mainTab === 'skincare' && ''}
            </h1>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {mainTab === 'log' && (
                <>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="notion-input"
                    style={{ width: 'auto', border: 'none', background: 'var(--notion-input-bg)', fontWeight: 500 }}
                  />
                  <button 
                    onClick={handleSave} 
                    className="notion-button" 
                    style={{ 
                      margin: 0, padding: '0 16px', height: '32px', width: 'auto', 
                      background: savedSuccess ? '#34C759' : '', 
                      color: savedSuccess ? '#fff' : '',
                      transition: 'all 0.2s'
                    }}
                  >
                    {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Data'}
                  </button>
                </>
              )}
            </div>
          </header>

          {mainTab === 'log' && (
            <div className="dashboard-nav">
              {AREAS.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => setActiveArea(a.id)}
                  className={`area-tab ${activeArea === a.id ? 'active' : ''}`}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          )}

      <div className="dashboard-content">
        {mainTab === 'history' && <HistoryTab />}
        {mainTab === 'month' && <MonthTab />}
        {mainTab === 'coach' && <CoachTab date={date} />}
        {mainTab === 'experiments' && <ExperimentsTab />}
        {mainTab === 'execution' && <ExecutionTab date={date} />}
        {mainTab === 'skincare' && <SkinCareTab date={date} />}
        
        {mainTab === 'log' && (
          loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--notion-gray-text)' }}>Loading data...</div>
          ) : (
            <div style={{ animation: 'smoothDropIn 0.3s ease forwards' }}>
            
            {/* BODY AREA */}
            {activeArea === 'body' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* SLEEP */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>😴</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Sleep</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Hours Slept</label>
                      <input type="number" className="notion-input" value={entry.body.sleepH} onChange={e => updateField('body', 'sleepH', e.target.value)} placeholder="7.5" step="0.5" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Morning Sunlight</label>
                      <select className="notion-input" value={entry.body.hubermanSunlight} onChange={e => updateField('body', 'hubermanSunlight', e.target.value)}>
                        <option value="no">❌ Missed</option>
                        <option value="yes">✅ Done (&lt;30m of wake)</option>
                      </select>
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1', background: 'var(--notion-input-bg)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="notion-label" style={{ marginBottom: 0 }}>Sleep Quality</label>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#185FA5' }}>{entry.body.sleepQ || 7}/10</span>
                      </div>
                      <input type="range" min="1" max="10" className="apple-slider" value={entry.body.sleepQ || 7} onChange={e => updateField('body', 'sleepQ', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* TRAINING */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🏋️</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Training</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Workout Type</label>
                      <select className="notion-input" value={entry.body.workoutType} onChange={e => updateField('body', 'workoutType', e.target.value)}>
                        <option value="rest">😴 Rest Day</option>
                        <option value="strength">💪 Strength</option>
                        <option value="hiit">⚡ HIIT</option>
                        <option value="cardio">🏃 Cardio</option>
                        <option value="yoga">🧘 Yoga / Mobility</option>
                        <option value="sport">⚽ Sport</option>
                        <option value="walk">🚶 Walk / Light</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Muscle Group</label>
                      <select className="notion-input" value={entry.body.muscleGroup} onChange={e => updateField('body', 'muscleGroup', e.target.value)}>
                        <option value="none">— Rest / N/A</option>
                        <option value="push">Push (Chest / Shoulders / Tri)</option>
                        <option value="pull">Pull (Back / Biceps)</option>
                        <option value="legs">Legs</option>
                        <option value="full">Full Body</option>
                        <option value="core">Core</option>
                        <option value="upper">Upper Body</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Duration (mins)</label>
                      <input type="number" className="notion-input" value={entry.body.exerciseMin} onChange={e => updateField('body', 'exerciseMin', e.target.value)} placeholder="60" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Zone 2 Cardio (mins)</label>
                      <input type="number" className="notion-input" value={entry.body.zone2Cardio} onChange={e => updateField('body', 'zone2Cardio', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Steps</label>
                      <input type="number" className="notion-input" value={entry.body.steps} onChange={e => updateField('body', 'steps', e.target.value)} placeholder="8000" />
                    </div>
                  </div>
                </div>

                {/* NUTRITION */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🥗</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Nutrition</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Protein (grams)</label>
                      <input type="number" className="notion-input" value={entry.body.proteinGrams} onChange={e => updateField('body', 'proteinGrams', e.target.value)} placeholder="150" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Water (Litres)</label>
                      <input type="number" className="notion-input" value={entry.body.water} onChange={e => updateField('body', 'water', e.target.value)} placeholder="2.5" step="0.5" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Ate Junk Food?</label>
                      <select className="notion-input" value={entry.body.ateJunk} onChange={e => updateField('body', 'ateJunk', e.target.value)}>
                        <option value="no">✅ Clean</option>
                        <option value="little">⚠️ A little</option>
                        <option value="yes">❌ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Meals Eaten</label>
                      <select className="notion-input" value={entry.body.meals} onChange={e => updateField('body', 'meals', e.target.value)}>
                        <option value="">—</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* RECOVERY */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🧬</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Recovery</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Cold Shower?</label>
                      <select className="notion-input" value={entry.body.coldShower} onChange={e => updateField('body', 'coldShower', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Supplements</label>
                      <input type="text" className="notion-input" value={entry.body.supplements} onChange={e => updateField('body', 'supplements', e.target.value)} placeholder="Vit D, Omega-3, Magnesium..." />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* MIND AREA */}
            {activeArea === 'mind' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* MINDFULNESS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🧘</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Mindfulness</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Meditation (mins)</label>
                      <input type="number" className="notion-input" value={entry.mind.meditMin} onChange={e => updateField('mind', 'meditMin', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Journaling (mins)</label>
                      <input type="number" className="notion-input" value={entry.mind.journalMin} onChange={e => updateField('mind', 'journalMin', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">No Phone First Hour?</label>
                      <select className="notion-input" value={entry.mind.noPhoneFirstHour} onChange={e => updateField('mind', 'noPhoneFirstHour', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LEARNING */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>📚</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Learning</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Reading (mins)</label>
                      <input type="number" className="notion-input" value={entry.mind.readMin} onChange={e => updateField('mind', 'readMin', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Podcast / Audiobook?</label>
                      <select className="notion-input" value={entry.mind.podcastDone} onChange={e => updateField('mind', 'podcastDone', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="notion-label">Key Thing Learned Today</label>
                      <input type="text" className="notion-input" value={entry.mind.learnNote} onChange={e => updateField('mind', 'learnNote', e.target.value)} placeholder="One sentence. What did you actually learn?" />
                    </div>
                  </div>
                </div>

                {/* MENTAL REPS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Mental Reps</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="notion-label">The Hard Thing (Goggins)</label>
                      <input type="text" className="notion-input" value={entry.mind.gogginsHardThing} onChange={e => updateField('mind', 'gogginsHardThing', e.target.value)} placeholder="What sucked today that you did anyway?" />
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* MOOD AREA */}
            {activeArea === 'mood' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* MENTAL STATE SLIDERS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Mental State</span>
                  </div>
                  <div className="form-grid">
                    {[
                      { id: 'mood', label: 'Overall Mood', emoji: '😊' },
                      { id: 'energy', label: 'Energy Level', emoji: '⚡' },
                      { id: 'focus', label: 'Focus', emoji: '🎯' },
                      { id: 'anxiety', label: 'Anxiety', emoji: '😰' },
                      { id: 'stress', label: 'Stress', emoji: '🌡️' },
                    ].map(item => (
                      <div key={item.id} className="notion-form-group" style={{ background: 'var(--notion-input-bg)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <label className="notion-label" style={{ marginBottom: 0 }}>{item.emoji} {item.label}</label>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#185FA5', minWidth: '32px', textAlign: 'right' }}>{entry.mood[item.id] || 5}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1" max="10"
                          className="apple-slider"
                          value={entry.mood[item.id] || 5}
                          onChange={e => updateField('mood', item.id, e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                          <span>Low</span><span>High</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EMOTIONAL SNAPSHOT */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🎭</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Emotional Snapshot</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Dominant Emotion</label>
                      <select className="notion-input" value={entry.mood.emotionTags} onChange={e => updateField('mood', 'emotionTags', e.target.value)}>
                        <option value="">— Select</option>
                        <option value="motivated">🚀 Motivated</option>
                        <option value="content">😌 Content</option>
                        <option value="grateful">🙏 Grateful</option>
                        <option value="happy">😄 Happy</option>
                        <option value="calm">🧘 Calm</option>
                        <option value="anxious">😰 Anxious</option>
                        <option value="frustrated">😤 Frustrated</option>
                        <option value="sad">😞 Sad</option>
                        <option value="bored">😐 Bored</option>
                        <option value="overwhelmed">🌊 Overwhelmed</option>
                        <option value="angry">😠 Angry</option>
                        <option value="lonely">😶 Lonely</option>
                      </select>
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: 'span 1' }}>
                      <label className="notion-label">What's driving today's mood?</label>
                      <input type="text" className="notion-input" value={entry.mood.feelNote} onChange={e => updateField('mood', 'feelNote', e.target.value)} placeholder="One sentence. Root cause." />
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* VICES AREA */}
            {activeArea === 'vices' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* SUBSTANCES */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>💊</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Substances</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Caffeine (cups)</label>
                      <input type="number" className="notion-input" value={entry.vices.coffee} onChange={e => updateField('vices', 'coffee', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Nicotine / Vaping?</label>
                      <select className="notion-input" value={entry.vices.vaping} onChange={e => updateField('vices', 'vaping', e.target.value)}>
                        <option value="no">✅ Clean</option>
                        <option value="yes">❌ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Vape Sessions (est.)</label>
                      <input type="number" className="notion-input" value={entry.vices.vapAmt} onChange={e => updateField('vices', 'vapAmt', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Alcohol?</label>
                      <select className="notion-input" value={entry.vices.alcohol} onChange={e => updateField('vices', 'alcohol', e.target.value)}>
                        <option value="no">✅ None</option>
                        <option value="yes">❌ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Drinks (#)</label>
                      <input type="number" className="notion-input" value={entry.vices.alcDrinks} onChange={e => updateField('vices', 'alcDrinks', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* SCREEN & DIGITAL */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>📱</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Screen & Digital</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Screen Time (hours)</label>
                      <input type="number" className="notion-input" value={entry.vices.screenT} onChange={e => updateField('vices', 'screenT', e.target.value)} placeholder="0" step="0.5" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Doomscrolling?</label>
                      <select className="notion-input" value={entry.vices.doomScroll} onChange={e => updateField('vices', 'doomScroll', e.target.value)}>
                        <option value="no">✅ No</option>
                        <option value="little">⚠️ A bit</option>
                        <option value="yes">❌ Yes, bad</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BEHAVIORAL */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🔐</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Behavioral</span>
                    <span style={{ fontSize: '11px', color: '#bbb', marginLeft: 'auto' }}>Private — only you see this</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Porn</label>
                      <select className="notion-input" value={entry.vices.porn} onChange={e => updateField('vices', 'porn', e.target.value)}>
                        <option value="no">✅ Clean</option>
                        <option value="yes">❌ Relapsed</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Masturbation</label>
                      <select className="notion-input" value={entry.vices.mast} onChange={e => updateField('vices', 'mast', e.target.value)}>
                        <option value="no">✅ Clean</option>
                        <option value="yes">❌ Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            )}



            {/* CAREER AREA */}
            {activeArea === 'career' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* FOCUS & DEEP WORK */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>⏱️</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Focus & Deep Work</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Hours Worked</label>
                      <input type="number" className="notion-input" value={entry.career.carHours} onChange={e => updateField('career', 'carHours', e.target.value)} placeholder="0" step="0.5" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Deep Work Blocks (Cal Newport)</label>
                      <select className="notion-input" value={entry.career.deepWorkBlocks} onChange={e => updateField('career', 'deepWorkBlocks', e.target.value)}>
                        <option value="0">0 — Scattered</option>
                        <option value="1">1 block (~90 mins)</option>
                        <option value="2">2 blocks</option>
                        <option value="3">3 blocks 🔥</option>
                        <option value="4">4+ blocks 💀</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Hit Flow State?</label>
                      <select className="notion-input" value={entry.career.flowState} onChange={e => updateField('career', 'flowState', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* OUTPUT & SKILLS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🚀</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Output & Skills</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Job Applications Sent</label>
                      <input type="number" className="notion-input" value={entry.career.appsOut} onChange={e => updateField('career', 'appsOut', e.target.value)} placeholder="0" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Leetcode / Dev Practice?</label>
                      <select className="notion-input" value={entry.career.leetcode} onChange={e => updateField('career', 'leetcode', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Skill / Course Practice?</label>
                      <select className="notion-input" value={entry.career.skillPractice} onChange={e => updateField('career', 'skillPractice', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Side Project Work?</label>
                      <select className="notion-input" value={entry.career.projectWork} onChange={e => updateField('career', 'projectWork', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="notion-label">Career Win of the Day</label>
                      <input type="text" className="notion-input" value={entry.career.carNote} onChange={e => updateField('career', 'carNote', e.target.value)} placeholder="What did you actually ship or move forward today?" />
                    </div>
                  </div>
                </div>

                {/* NETWORKING */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🤝</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Networking</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Networked Today?</label>
                      <select className="notion-input" value={entry.career.networkingDone} onChange={e => updateField('career', 'networkingDone', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* FINANCE AREA */}
            {activeArea === 'finance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* DAILY SPENDING */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>💸</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Daily Spending</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Amount Spent ($)</label>
                      <input type="number" className="notion-input" value={entry.finance.spent} onChange={e => updateField('finance', 'spent', e.target.value)} placeholder="0.00" step="0.01" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Biggest Spending Area</label>
                      <select className="notion-input" value={entry.finance.spentCat} onChange={e => updateField('finance', 'spentCat', e.target.value)}>
                        <option value="">— None</option>
                        <option value="food">🍔 Food & Dining</option>
                        <option value="groceries">🛒 Groceries</option>
                        <option value="transport">🚗 Transport / Gas</option>
                        <option value="subscriptions">📺 Subscriptions</option>
                        <option value="shopping">🛍️ Shopping</option>
                        <option value="health">💊 Health</option>
                        <option value="entertainment">🎮 Entertainment</option>
                        <option value="bills">🏠 Bills / Utilities</option>
                        <option value="other">📦 Other</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Impulse Purchase?</label>
                      <select className="notion-input" value={entry.finance.impulse} onChange={e => updateField('finance', 'impulse', e.target.value)}>
                        <option value="no">✅ No — Intentional</option>
                        <option value="yes">❌ Yes — Impulse</option>
                      </select>
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="notion-label">What did you buy?</label>
                      <input type="text" className="notion-input" value={entry.finance.finNote} onChange={e => updateField('finance', 'finNote', e.target.value)} placeholder="Coffee, lunch, gas, Amazon..." />
                    </div>
                  </div>
                </div>

                {/* WEALTH BUILDING */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>📈</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Wealth Building</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Invested Today?</label>
                      <select className="notion-input" value={entry.finance.invested} onChange={e => updateField('finance', 'invested', e.target.value)}>
                        <option value="no">❌ No</option>
                        <option value="yes">✅ Yes</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Amount Invested ($)</label>
                      <input type="number" className="notion-input" value={entry.finance.investAmt} onChange={e => updateField('finance', 'investAmt', e.target.value)} placeholder="0.00" step="0.01" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Income Received ($)</label>
                      <input type="number" className="notion-input" value={entry.finance.income} onChange={e => updateField('finance', 'income', e.target.value)} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
                </div>

                {/* FINANCIAL DISCIPLINE */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--notion-border)' }}>
                    <span style={{ fontSize: '16px' }}>🏦</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Financial Discipline</span>
                  </div>
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Stayed in Budget?</label>
                      <select className="notion-input" value={entry.finance.budget} onChange={e => updateField('finance', 'budget', e.target.value)}>
                        <option value="">— N/A</option>
                        <option value="yes">✅ Yes</option>
                        <option value="little_over">⚠️ Slightly Over</option>
                        <option value="no">❌ Overspent</option>
                      </select>
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Saved Today ($)</label>
                      <input type="number" className="notion-input" value={entry.finance.saved} onChange={e => updateField('finance', 'saved', e.target.value)} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* RELATIONS AREA */}
            {activeArea === 'relations' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Social Energy</label>
                  <select className="notion-input" value={entry.relations.social} onChange={e => updateField('relations', 'social', e.target.value)}>
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Meaningful Convo</label>
                  <select className="notion-input" value={entry.relations.meaningConvo} onChange={e => updateField('relations', 'meaningConvo', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Helped Someone</label>
                  <select className="notion-input" value={entry.relations.helpedSomeone} onChange={e => updateField('relations', 'helpedSomeone', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Connected With</label>
                  <input type="text" className="notion-input" value={entry.relations.connectedWith} onChange={e => updateField('relations', 'connectedWith', e.target.value)} placeholder="Name..." />
                </div>
              </div>
            )}

            {/* ENVIRON AREA */}
            {activeArea === 'environ' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Room Clean</label>
                  <select className="notion-input" value={entry.environ.roomClean} onChange={e => updateField('environ', 'roomClean', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Bed Made</label>
                  <select className="notion-input" value={entry.environ.bedMade} onChange={e => updateField('environ', 'bedMade', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Sunlight exposure</label>
                  <select className="notion-input" value={entry.environ.sunlight} onChange={e => updateField('environ', 'sunlight', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Outdoor Time</label>
                  <select className="notion-input" value={entry.environ.outdoorTime} onChange={e => updateField('environ', 'outdoorTime', e.target.value)}>
                    <option value="none">None</option>
                    <option value="some">Some</option>
                    <option value="a lot">A Lot!</option>
                  </select>
                </div>
              </div>
            )}

            {/* REFLECT AREA */}
            {activeArea === 'reflect' && (
              <div className="form-grid">
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Daily Wins</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.reflect.wins} onChange={e => updateField('reflect', 'wins', e.target.value)} placeholder="What went well today?" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Struggles</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.reflect.struggles} onChange={e => updateField('reflect', 'struggles', e.target.value)} placeholder="What was hard?" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Gratitude</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.reflect.gratitude} onChange={e => updateField('reflect', 'gratitude', e.target.value)} placeholder="I am grateful for..." />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">1% Better (James Clear)</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.reflect.onePercentBetter} onChange={e => updateField('reflect', 'onePercentBetter', e.target.value)} placeholder="How did you improve the system 1% today?" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">The ONE Thing (Gary Keller)</label>
                  <input type="text" className="notion-input" value={entry.reflect.intention} onChange={e => updateField('reflect', 'intention', e.target.value)} placeholder="What is the single most important thing tomorrow?" />
                </div>
              </div>
            )}

          </div>
          )
        )}
      </div>
        </div>
      </main>

      {/* Live Streaks & Financial Summary Sidebar */}
      <RightSidebar />

    </div>
  );
}

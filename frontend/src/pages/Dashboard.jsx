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
    body: { steps: '', weight: '', sleepH: '', water: '', sleepQ: '', exercise: '', exerciseMin: '', skAM: '', skPM: '', ateQ: '', meals: '', hubermanSunlight: '', zone2Cardio: '' },
    mind: { meditation: '', meditMin: '', journaling: '', reading: '', readMin: '', learning: '', learnNote: '', gogginsHardThing: '' },
    mood: { mood: '', energy: '', focus: '', anxiety: '', stress: '', feelNote: '', emotionTags: '' },
    vices: { mast: '', porn: '', coffee: '', vaping: '', vapAmt: '', alcohol: '', alcDrinks: '', screenT: '', doomScroll: '' },
    career: { carHours: '', appsOut: '', skillPractice: '', projectWork: '', leetcode: '', networkingDone: '', carNote: '', deepWorkBlocks: '' },
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
            body: { steps: '', weight: '', sleepH: '', water: '', sleepQ: '', exercise: '', exerciseMin: '', skAM: '', skPM: '', ateQ: '', meals: '', hubermanSunlight: '', zone2Cardio: '' },
            mind: { meditation: '', meditMin: '', journaling: '', reading: '', readMin: '', learning: '', learnNote: '', gogginsHardThing: '' },
            mood: { mood: '', energy: '', focus: '', anxiety: '', stress: '', feelNote: '', emotionTags: '' },
            vices: { mast: '', porn: '', coffee: '', vaping: '', vapAmt: '', alcohol: '', alcDrinks: '', screenT: '', doomScroll: '' },
            career: { carHours: '', appsOut: '', skillPractice: '', projectWork: '', leetcode: '', networkingDone: '', carNote: '', deepWorkBlocks: '' },
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
        <div style={{ marginBottom: '32px', background: '#F2F1EE', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--notion-gray-text)' }}>
          "You have power over your mind - not outside events. Realize this, and you will find strength."
          <br /><strong style={{ color: '#aaa', marginTop: '4px', display: 'block' }}>- Marcus Aurelius</strong>
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
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Steps</label>
                  <input type="number" className="notion-input" value={entry.body.steps} onChange={e => updateField('body', 'steps', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Weight (kg/lbs)</label>
                  <input type="number" className="notion-input" value={entry.body.weight} onChange={e => updateField('body', 'weight', e.target.value)} placeholder="0.0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Morning Sunlight (Huberman)</label>
                  <select className="notion-input" value={entry.body.hubermanSunlight} onChange={e => updateField('body', 'hubermanSunlight', e.target.value)}>
                    <option value="no">Missed</option>
                    <option value="yes">Done (&lt;30m wake)</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Zone 2 Cardio (Peter Attia)</label>
                  <input type="number" className="notion-input" value={entry.body.zone2Cardio} onChange={e => updateField('body', 'zone2Cardio', e.target.value)} placeholder="0 mins" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Sleep Hours</label>
                  <input type="number" className="notion-input" value={entry.body.sleepH} onChange={e => updateField('body', 'sleepH', e.target.value)} placeholder="0.0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Water Litres</label>
                  <input type="number" className="notion-input" value={entry.body.water} onChange={e => updateField('body', 'water', e.target.value)} placeholder="0.0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Exercise Type</label>
                  <select className="notion-input" value={entry.body.exercise} onChange={e => updateField('body', 'exercise', e.target.value)}>
                    <option value="">None</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Exercise (mins)</label>
                  <input type="number" className="notion-input" value={entry.body.exerciseMin} onChange={e => updateField('body', 'exerciseMin', e.target.value)} placeholder="0" />
                </div>
              </div>
            )}

            {/* MIND AREA */}
            {activeArea === 'mind' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Meditation</label>
                  <select className="notion-input" value={entry.mind.meditation} onChange={e => updateField('mind', 'meditation', e.target.value)}>
                    <option value="not done">Not Done</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Meditation (mins)</label>
                  <input type="number" className="notion-input" value={entry.mind.meditMin} onChange={e => updateField('mind', 'meditMin', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Read Mins (Naval)</label>
                  <input type="number" className="notion-input" value={entry.mind.readMin} onChange={e => updateField('mind', 'readMin', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">The Hard Thing (Goggins)</label>
                  <input type="text" className="notion-input" value={entry.mind.gogginsHardThing} onChange={e => updateField('mind', 'gogginsHardThing', e.target.value)} placeholder="What sucks that you did anyway?" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Learning Notes</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.mind.learnNote} onChange={e => updateField('mind', 'learnNote', e.target.value)} placeholder="What did you learn today?" />
                </div>
              </div>
            )}

            {/* MOOD AREA */}
            {activeArea === 'mood' && (
              <div className="form-grid">
                {[
                  { id: 'mood', label: 'Overall Mood' },
                  { id: 'energy', label: 'Energy Level' },
                  { id: 'focus', label: 'Focus' },
                  { id: 'anxiety', label: 'Anxiety' }
                ].map(item => (
                  <div key={item.id} className="notion-form-group" style={{ background: 'var(--notion-input-bg)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <label className="notion-label" style={{ marginBottom: 0 }}>{item.label}</label>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#185FA5' }}>{entry.mood[item.id] || 5}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="10" 
                      className="apple-slider" 
                      value={entry.mood[item.id] || 5} 
                      onChange={e => updateField('mood', item.id, e.target.value)} 
                    />
                  </div>
                ))}
                
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Feeling Notes</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.mood.feelNote} onChange={e => updateField('mood', 'feelNote', e.target.value)} placeholder="How do you feel?" />
                </div>
              </div>
            )}

            {/* VICES AREA */}
            {activeArea === 'vices' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Screen Time (hours)</label>
                  <input type="number" className="notion-input" value={entry.vices.screenT} onChange={e => updateField('vices', 'screenT', e.target.value)} placeholder="0.0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Coffee (cups)</label>
                  <input type="number" className="notion-input" value={entry.vices.coffee} onChange={e => updateField('vices', 'coffee', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Alcohol</label>
                  <select className="notion-input" value={entry.vices.alcohol} onChange={e => updateField('vices', 'alcohol', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Drinks (Amt)</label>
                  <input type="number" className="notion-input" value={entry.vices.alcDrinks} onChange={e => updateField('vices', 'alcDrinks', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Vaping</label>
                  <select className="notion-input" value={entry.vices.vaping} onChange={e => updateField('vices', 'vaping', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Doomscrolling</label>
                  <select className="notion-input" value={entry.vices.doomScroll} onChange={e => updateField('vices', 'doomScroll', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            )}

            {/* CAREER AREA */}
            {activeArea === 'career' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Career Hours worked</label>
                  <input type="number" className="notion-input" value={entry.career.carHours} onChange={e => updateField('career', 'carHours', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Job Apps Out</label>
                  <input type="number" className="notion-input" value={entry.career.appsOut} onChange={e => updateField('career', 'appsOut', e.target.value)} placeholder="0" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Skill Practice</label>
                  <select className="notion-input" value={entry.career.skillPractice} onChange={e => updateField('career', 'skillPractice', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Leetcode / Dev</label>
                  <select className="notion-input" value={entry.career.leetcode} onChange={e => updateField('career', 'leetcode', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Deep Work (Cal Newport)</label>
                  <input type="number" className="notion-input" value={entry.career.deepWorkBlocks} onChange={e => updateField('career', 'deepWorkBlocks', e.target.value)} placeholder="Number of 90m blocks" />
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">Career Notes</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.career.carNote} onChange={e => updateField('career', 'carNote', e.target.value)} placeholder="Work reflection..." />
                </div>
              </div>
            )}

            {/* FINANCE AREA */}
            {activeArea === 'finance' && (
              <div className="form-grid">
                <div className="notion-form-group">
                  <label className="notion-label">Amount Spent Today ($)</label>
                  <input type="number" className="notion-input" value={entry.finance.spent} onChange={e => updateField('finance', 'spent', e.target.value)} placeholder="0.00" />
                </div>
                <div className="notion-form-group">
                  <label className="notion-label">Impulse Purchase?</label>
                  <select className="notion-input" value={entry.finance.impulse} onChange={e => updateField('finance', 'impulse', e.target.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="notion-label">What did you buy? (Notes)</label>
                  <textarea className="notion-input" style={{ height: '60px', padding: '12px' }} value={entry.finance.finNote} onChange={e => updateField('finance', 'finNote', e.target.value)} placeholder="Groceries, gas, coffee..." />
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

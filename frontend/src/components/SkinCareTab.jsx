import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';

export default function SkinCareTab({ date }) {
  const { updateXp } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Custom Edit State
  const [editStacks, setEditStacks] = useState([]);
  const [editConcerns, setEditConcerns] = useState('');

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/skincare');
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [date]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const concernsArr = editConcerns.split(',').map(c => c.trim()).filter(Boolean);
      const { data } = await api.put('/skincare/settings', { stacks: editStacks, concerns: concernsArr });
      setProfile(data);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const todayLog = profile?.logs?.find(l => l.date === date) || { amCompleted: [], pmCompleted: [], amStackName: '', pmStackName: '' };
  
  const handleSelectStack = async (type, stackName) => {
    const payload = { date };
    if (type === 'AM') {
      payload.amStackName = stackName;
      payload.amCompleted = []; // switch routine = reset
    } else {
      payload.pmStackName = stackName;
      payload.pmCompleted = [];
    }
    try {
      const { data } = await api.put('/skincare/log', payload);
      setProfile(data);
    } catch (e) { console.error(e); }
  };

  const toggleCheck = async (type, item) => {
    let amC = [...todayLog.amCompleted];
    let pmC = [...todayLog.pmCompleted];
    
    if (type === 'AM') {
      amC.includes(item) ? amC = amC.filter(i => i !== item) : amC.push(item);
    } else {
      pmC.includes(item) ? pmC = pmC.filter(i => i !== item) : pmC.push(item);
    }

    try {
      const { data } = await api.put('/skincare/log', { date, amCompleted: amC, pmCompleted: pmC });
      setProfile(data);
      updateXp(5, 'Skincare checklist logged');
    } catch (e) {
      console.error(e);
    }
  };

  const callAiDerm = async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post('/skincare/analyze');
      setProfile(data);
    } catch (e) {
      alert("AI Analysis Failed: " + (e.response?.data?.message || e.message));
    }
    setAnalyzing(false);
  };

  if (loading || !profile) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading Holistic Interface...</div>;

  const amStacks = profile.stacks.filter(s => s.type === 'AM');
  const pmStacks = profile.stacks.filter(s => s.type === 'PM');
  
  // Select active steps for the day based on user's stack name choice
  const activeAmStack = amStacks.find(s => s.name === todayLog.amStackName) || amStacks[0];
  const activePmStack = pmStacks.find(s => s.name === todayLog.pmStackName) || pmStacks[0];

  const amProgress = activeAmStack?.steps.length ? (todayLog.amCompleted.length / activeAmStack.steps.length) * 100 : 0;
  const pmProgress = activePmStack?.steps.length ? (todayLog.pmCompleted.length / activePmStack.steps.length) * 100 : 0;

  const getHeatColor = (logDate) => {
    const log = profile.logs.find(l => l.date === logDate);
    if (!log) return '#f1f5f9';
    let score = 0;
    if (log.amCompleted.length > 0) score += 0.5;
    if (log.pmCompleted.length > 0) score += 0.5;
    if (score === 0) return '#f1f5f9';
    if (score <= 0.5) return '#bae6fd'; 
    return '#0284c7'; 
  };

  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Holistic Regimen</h1>
          <p style={{ fontSize: '15px', color: 'var(--notion-gray-text)', marginTop: '4px', margin: 0 }}>
            Skin Cycling & Habit Convergence Tracking.
          </p>
        </div>
        {!editMode ? (
          <button className="apple-pill-btn-secondary" onClick={() => {
            setEditStacks(JSON.parse(JSON.stringify(profile.stacks)));
            setEditConcerns(profile.concerns.join(', '));
            setEditMode(true);
          }}>
            ⚙️ Engineer Matrix
          </button>
        ) : (
          <button className="apple-pill-btn" onClick={handleSaveSettings} disabled={saving}>
            {saving ? 'Saving Matrix...' : 'Lock Matrix'}
          </button>
        )}
      </div>

      {/* EDIT MODE STACK BUILDER */}
      {editMode && (
        <div style={{ marginBottom: '32px', animation: 'slideUpFade 0.2s' }}>
          <div className="apple-exp-card" style={{ padding: '24px', marginBottom: '16px' }}>
             <label className="notion-label">Skin Pathologies (Concerns)</label>
             <input type="text" className="notion-input" value={editConcerns} onChange={e => setEditConcerns(e.target.value)} placeholder="Acne, Rosacea, Hyper-pigmentation..." />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Skin Cycling Stacks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {editStacks.map((stack, stackIdx) => (
              <div key={stackIdx} className="apple-exp-card" style={{ padding: '20px', border: stack.type === 'AM' ? '1px solid #fde68a' : '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select className="notion-input" style={{ width: '80px', padding: '8px' }} value={stack.type} onChange={e => { const ns = [...editStacks]; ns[stackIdx].type = e.target.value; setEditStacks(ns); }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <input type="text" className="notion-input" placeholder="Stack Name (e.g. Retinol Night)" value={stack.name} onChange={e => { const ns = [...editStacks]; ns[stackIdx].name = e.target.value; setEditStacks(ns); }} style={{ margin: 0, flex: 1 }} />
                  <button onClick={() => setEditStacks(editStacks.filter((_, i) => i !== stackIdx))} style={{ background: '#fef5f5', border: 'none', borderRadius: '8px', color: '#E03E3E', cursor: 'pointer', padding: '0 12px' }}>X</button>
                </div>
                
                <label className="notion-label" style={{ fontSize: '11px', marginTop: '16px' }}>Layering Steps</label>
                {stack.steps.map((step, stepIdx) => (
                  <div key={stepIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                     <input type="text" className="notion-input" style={{ margin: 0, padding: '8px', fontSize: '14px' }} placeholder="Product..." value={step} onChange={e => { const ns = [...editStacks]; ns[stackIdx].steps[stepIdx] = e.target.value; setEditStacks(ns); }} />
                     <button onClick={() => { const ns = [...editStacks]; ns[stackIdx].steps = ns[stackIdx].steps.filter((_, i) => i !== stepIdx); setEditStacks(ns); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa' }}>x</button>
                  </div>
                ))}
                <button onClick={() => { const ns = [...editStacks]; ns[stackIdx].steps.push(''); setEditStacks(ns); }} style={{ background: 'transparent', border: '1px dashed #ccc', width: '100%', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#666', fontSize: '12px', marginTop: '8px' }}>+ Add Molecule Step</button>
              </div>
            ))}
            
            <button onClick={() => setEditStacks([...editStacks, { id: Date.now().toString(), name: 'New Stack', type: 'PM', steps: [] }])} style={{ background: 'var(--notion-input-bg)', border: '1px dashed var(--notion-border)', height: '100%', minHeight: '120px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontWeight: 600, cursor: 'pointer' }}>
               + Build New Cycle Stack
            </button>
          </div>
        </div>
      )}

      {/* TODAY'S DYNAMIC CHECKLIST */}
      {!editMode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          <div className="apple-exp-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f59e0b' }}>☀️ AM Stack</h3>
                 <select value={activeAmStack?.name || ''} onChange={e => handleSelectStack('AM', e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', fontSize: '12px', fontWeight: 600, color: '#b45309' }}>
                    {amStacks.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                 </select>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#aaa' }}>{Math.round(amProgress)}%</span>
            </div>
            
            {!activeAmStack ? <p style={{ color: '#aaa', fontSize: '14px' }}>No AM stack configured.</p> : activeAmStack.steps.map((item, i) => {
              const isChecked = todayLog.amCompleted.includes(item);
              return (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', background: isChecked ? '#fffbeb' : '#f9f9fb', padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: isChecked ? '#fde68a' : 'rgba(0,0,0,0.04)' }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCheck('AM', item)} style={{ width: '20px', height: '20px', accentColor: '#f59e0b', cursor: 'pointer' }} />
                  <span style={{ fontSize: '15px', fontWeight: 500, color: isChecked ? '#b45309' : '#333', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>{i+1}. {item}</span>
                </div>
              )
            })}
          </div>

          <div className="apple-exp-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#6366f1' }}>🌙 PM Stack</h3>
                 <select value={activePmStack?.name || ''} onChange={e => handleSelectStack('PM', e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>
                    {pmStacks.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                 </select>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#aaa' }}>{Math.round(pmProgress)}%</span>
            </div>
            
            {!activePmStack ? <p style={{ color: '#aaa', fontSize: '14px' }}>No PM stack configured.</p> : activePmStack.steps.map((item, i) => {
              const isChecked = todayLog.pmCompleted.includes(item);
              return (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', background: isChecked ? '#eef2ff' : '#f9f9fb', padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: isChecked ? '#c7d2fe' : 'rgba(0,0,0,0.04)' }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCheck('PM', item)} style={{ width: '20px', height: '20px', accentColor: '#6366f1', cursor: 'pointer' }} />
                  <span style={{ fontSize: '15px', fontWeight: 500, color: isChecked ? '#4338ca' : '#333', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>{i+1}. {item}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* HEATMAP CALENDAR */}
      {!editMode && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>30-Day Adherence Map</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {last30Days.map(d => (
              <div 
                key={d} 
                title={d}
                style={{ 
                  width: '20px', height: '20px', borderRadius: '4px', 
                  background: getHeatColor(d),
                  border: d === date ? '2px solid #000' : '1px solid rgba(0,0,0,0.05)'
                }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* CROSS-DOMAIN HOLISTIC AI */}
      {!editMode && (
        <div className="apple-exp-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#c7d2fe' }}>Holistic Derm AI</h3>
                 <p style={{ margin: 0, fontSize: '14px', color: '#818cf8', opacity: 0.9 }}>Cross-references your skin stacks with your Sleep/Substances logs.</p>
               </div>
               <button className="apple-pill-btn" style={{ background: '#4f46e5', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={callAiDerm} disabled={analyzing}>
                 {analyzing ? 'Synthesizing Logs & Molecules...' : 'Run Holistic Analysis'}
               </button>
            </div>
          </div>
          
          {profile.aiAnalysis && profile.aiAnalysis.routineAnalysis ? (
            <div style={{ padding: '32px', background: '#f8fafc' }}>
               {/* 1. Critique */}
               <div style={{ marginBottom: '24px' }}>
                 <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>Scientific Critique</h4>
                 <div style={{ fontSize: '16px', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{profile.aiAnalysis.routineAnalysis}</div>
               </div>

               {/* 2. Lifestyle */}
               <div style={{ marginBottom: '32px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#ec4899', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🧬 Lifestyle Convergence
                 </h4>
                 <div style={{ fontSize: '15px', color: '#333', lineHeight: 1.5 }}>{profile.aiAnalysis.lifestyleImpact}</div>
               </div>

               {/* 3. Timeline progression */}
               <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '1px', marginBottom: '16px' }}>Ascension Timeline</h4>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', borderTop: '4px solid #f87171' }}>
                     <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>WEEK 2</div>
                     <div style={{ fontSize: '13px', color: '#7f1d1d' }}>{profile.aiAnalysis.timeline?.week2}</div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', borderTop: '4px solid #fbbf24' }}>
                     <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '8px' }}>WEEK 6</div>
                     <div style={{ fontSize: '13px', color: '#92400e' }}>{profile.aiAnalysis.timeline?.week6}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', borderTop: '4px solid #4ade80' }}>
                     <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', marginBottom: '8px' }}>WEEK 12</div>
                     <div style={{ fontSize: '13px', color: '#14532d' }}>{profile.aiAnalysis.timeline?.week12}</div>
                  </div>
               </div>

               {/* 4. Actionable Steps */}
               <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '1px', marginBottom: '12px' }}>Actionable Directives</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {profile.aiAnalysis.tips?.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#1e293b', background: '#e2e8f0', padding: '12px 16px', borderRadius: '8px' }}>
                       <span style={{ fontWeight: 800, color: '#475569' }}>{i+1}.</span>
                       <span>{tip}</span>
                    </div>
                 ))}
               </div>

            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: '#f8fafc' }}>
              Tap "Run Holistic Analysis" to fetch your Lifestyle/Vices data and generate your Timeline.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

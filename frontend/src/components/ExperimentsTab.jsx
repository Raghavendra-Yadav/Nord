import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

export default function ExperimentsTab() {
  const { updateXp } = useContext(AuthContext);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', hypothesis: '', durationDays: 7, frequency: 'Daily' });
  const [checkInText, setCheckInText] = useState('');
  const [activeCheckInId, setActiveCheckInId] = useState(null);

  const fetchExperiments = async () => {
    try {
      const { data } = await api.get('/experiments');
      setExperiments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const createExperiment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/experiments', newExp);
      setNewExp({ title: '', hypothesis: '', durationDays: 7, frequency: 'Daily' });
      setShowForm(false);
      fetchExperiments();
    } catch (err) {
      console.error(err);
    }
  };

  const logCheckIn = async (id) => {
    if (!checkInText) return;
    try {
      await api.post(`/experiments/${id}/checkin`, { notes: checkInText });
      updateXp(20, 'Logged trial observation'); // +20 XP for checking in
      setCheckInText('');
      setActiveCheckInId(null);
      fetchExperiments();
    } catch (err) {
      console.error(err);
    }
  };

  const completeExperiment = async (id, finalStatus) => {
    const finalReflection = prompt('Reflection on this experiment (What did you learn?):');
    try {
      await api.put(`/experiments/${id}/complete`, { status: finalStatus, finalReflection });
      if (finalStatus === 'completed') {
        updateXp(100, 'Successfully completed a trial protocol'); // +100 XP
      } else {
        updateXp(10, 'Abandoned a trial, but learned a lesson'); // +10 XP for abandoning
      }
      fetchExperiments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading...</div>;

  const activeExps = experiments.filter(e => e.status === 'active');
  const pastExps = experiments.filter(e => e.status !== 'active');

  const PROTOCOL_LIBRARY = [
    { 
      title: 'Dopamine Detox', 
      hypothesis: 'Reset receptor baseline by removing hyper-stimulating cheap entertainment.', 
      durationDays: 7, frequency: 'Daily', daysToResults: 3, icon: '📱',
      instructions: '1. Delete ALL algorithmic social media (TikTok, IG Reels, Shorts).\\n2. No video games.\\n3. Replace scrolling time with reading or walking in silence.\\nExpect intense boredom for 48 hours, followed by renewed motivation for difficult tasks.'
    },
    { 
      title: 'Monk Mode', 
      hypothesis: 'Zero alcohol and extreme environmental control to launch a core project.', 
      durationDays: 30, frequency: 'Weekly', daysToResults: 14, icon: '🧘',
      instructions: '1. Zero alcohol or recreational drugs.\\n2. Lock in 2 hours of Deep Work every single day, no exceptions.\\n3. Strictly track sleep matrix.\\nThis is for when you are drastically behind and need massive momentum.'
    },
    { 
      title: 'Carnivore Diet', 
      hypothesis: 'Eliminate plant toxins and grains to resolve brain fog and systemic inflammation.', 
      durationDays: 14, frequency: 'Daily', daysToResults: 5, icon: '🥩',
      instructions: '1. Eat only meat, salt, and water.\\n2. Eliminate ALL sugar, grains, and seed oils.\\n3. Track your morning brain fog and afternoon crash.\\nThe first 4 days will feature keto-adaptation fatigue. Push through it.'
    },
    { 
      title: 'Cold Shower Protocol', 
      hypothesis: 'Build mental callous and spike adrenaline/dopamine by taking cold showers daily.', 
      durationDays: 14, frequency: 'Daily', daysToResults: 1, icon: '🧊',
      instructions: '1. Start shower warm to wash, then switch to absolute coldest setting.\\n2. Stay under water for exactly 3 minutes.\\n3. Focus strictly on slowing down your breath rate.\\nTremendous for morning anxiety reduction.'
    }
  ];

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', animation: 'slideUpFade 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Trials</h1>
          <p style={{ fontSize: '15px', color: 'var(--notion-gray-text)', marginTop: '4px', margin: 0 }}>
            Don't commit blindly. Experiment. Reflect. Repeat.
          </p>
        </div>
        <button className="apple-pill-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Trial'}
        </button>
      </div>

      {/* PROTOCOL LIBRARY */}
      {!showForm && activeExps.length === 0 && (
        <div style={{ marginBottom: '40px', animation: 'slideUpFade 0.4s ease-out', animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 24px 0', letterSpacing: '-0.5px' }}>Explore Protocols</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {PROTOCOL_LIBRARY.map((proto, i) => (
              <div key={i} className="apple-exp-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 12px 32px rgba(0,0,0,0.04)' }}>
                {/* Header portion with soft gray background */}
                <div style={{ background: '#fbfbfd', padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '38px', background: '#fff', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>{proto.icon}</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', color: '#111' }}>{proto.title}</h4>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{proto.durationDays} Days • Results in {proto.daysToResults}d</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', color: '#444', lineHeight: 1.5, fontWeight: 500 }}>{proto.hypothesis}</p>
                </div>
                
                {/* Body portion with white background */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, background: '#fff' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 800 }}>How to Execute</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                    {proto.instructions.split('\\n').map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#333', lineHeight: 1.5 }}>
                        <span style={{ color: '#0071E3', fontWeight: 700 }}>{step.match(/^\\d+\\./) ? step.split('.')[0] : '•'}</span>
                        <span>{step.replace(/^\\d+\\.\\s*/, '')}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      className="apple-pill-btn" 
                      style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}
                      onClick={async (e) => {
                         e.preventDefault();
                         const btn = e.target;
                         const originalText = btn.innerText;
                         btn.innerText = 'Starting...';
                         btn.style.opacity = '0.5';
                         try {
                            await api.post('/experiments', { title: proto.title, hypothesis: proto.hypothesis, durationDays: proto.durationDays, frequency: proto.frequency });
                            await fetchExperiments();
                         } catch(err) { 
                            const errMsg = err.response?.data?.message || err.message;
                            console.error(err); 
                            alert(`Failed to start: ${errMsg}`);
                            btn.innerText = 'Error';
                            setTimeout(() => { btn.innerText = originalText; btn.style.opacity = '1'; }, 2000);
                         }
                      }}
                    >
                      Start Protocol
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANUAL TRIAL BUTTON */}
      {!showForm && activeExps.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
           <button className="apple-pill-btn-secondary" onClick={() => setShowForm(true)}>+ Create Custom Manual Trial</button>
        </div>
      )}
      {!showForm && activeExps.length === 0 && (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
           <button className="apple-pill-btn-secondary" onClick={() => setShowForm(true)}>Wanted something else? Create a Custom Trial.</button>
         </div>
      )}

      {/* NEW EXPERIMENT FORM */}
      {showForm && (
        <form onSubmit={createExperiment} className="apple-exp-card" style={{ marginBottom: '40px', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 24px 0', letterSpacing: '-0.3px' }}>Configure Custom Trial</h2>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="notion-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>Hypothesis (Goal)</label>
              <input type="text" className="notion-input" style={{ fontSize: '16px', padding: '14px', borderRadius: '12px' }} value={newExp.hypothesis} onChange={e => setNewExp({...newExp, hypothesis: e.target.value})} placeholder="e.g., I hope to reduce brain fog by eliminating sugar." />
            </div>
            <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="notion-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>Trial Name</label>
              <input type="text" required className="notion-input" style={{ fontSize: '16px', padding: '14px', borderRadius: '12px' }} value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} placeholder="Zero Sugar Protocol" />
            </div>
            <div className="notion-form-group">
              <label className="notion-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>Duration (Days)</label>
              <input type="number" required className="notion-input" style={{ fontSize: '16px', padding: '14px', borderRadius: '12px' }} value={newExp.durationDays} onChange={e => setNewExp({...newExp, durationDays: Number(e.target.value)})} min="1" max="90" />
            </div>
            <div className="notion-form-group">
              <label className="notion-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>Check-in Frequency</label>
              <select className="notion-input" style={{ height: '48px', fontSize: '16px', padding: '0 14px', borderRadius: '12px' }} value={newExp.frequency} onChange={e => setNewExp({...newExp, frequency: e.target.value})}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="At the end">At the End</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button type="submit" className="apple-pill-btn" style={{ padding: '12px 32px', fontSize: '15px' }}>Start Protocol</button>
          </div>
        </form>
      )}

      {/* ACTIVE EXPERIMENTS */}
      {activeExps.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Active Protocols</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeExps.map((exp, index) => {
               // Stagger animation based on index
              const animStyle = { animationDelay: `${index * 0.1}s` };
              const daysRunning = Math.floor((new Date() - new Date(exp.startDate)) / (1000 * 60 * 60 * 24));
              const progressRatio = Math.min((daysRunning / exp.durationDays) * 100, 100);

              return (
                <div key={exp._id} className="apple-exp-card" style={animStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>{exp.title}</h4>
                      <p style={{ margin: 0, fontSize: '15px', color: '#666', lineHeight: 1.4 }}>{exp.hypothesis}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0071E3' }}>Day {daysRunning} / {exp.durationDays}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', textTransform: 'uppercase', fontWeight: 600 }}>{exp.frequency} Check-in</div>
                    </div>
                  </div>

                  {/* Liquid Apple Progress Bar */}
                  <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '5px', marginTop: '24px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressRatio}%`, height: '100%', background: 'linear-gradient(90deg, #007AFD 0%, #35A3FF 100%)', borderRadius: '5px', transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)' }} />
                  </div>

                  {/* Action Area */}
                  <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
                    {activeCheckInId === exp._id ? (
                      <div style={{ flex: 1, display: 'flex', gap: '12px', animation: 'slideUpFade 0.2s ease forwards' }}>
                        <input type="text" className="notion-input" style={{ flex: 1, borderRadius: '18px', padding: '12px 20px', fontSize: '14px', border: '1px solid rgba(0,0,0,0.1)' }} autoFocus placeholder="Log your observation..." value={checkInText} onChange={e => setCheckInText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') logCheckIn(exp._id) }} />
                        <button className="apple-pill-btn" onClick={() => logCheckIn(exp._id)}>Save</button>
                        <button className="apple-pill-btn-secondary" onClick={() => setActiveCheckInId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button className="apple-pill-btn" style={{ flex: 1 }} onClick={() => setActiveCheckInId(exp._id)}>Log Check-In</button>
                        <button className="apple-pill-btn-secondary" style={{ color: '#3f631a', background: '#f5fbee' }} onClick={() => completeExperiment(exp._id, 'completed')}>Complete</button>
                        <button className="apple-pill-btn-secondary" style={{ color: '#E03E3E', background: '#fef5f5' }} onClick={() => completeExperiment(exp._id, 'abandoned')}>Abandon</button>
                      </>
                    )}
                  </div>

                  {/* History Logs */}
                  {exp.checkIns.length > 0 && (
                    <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: '#f9f9fb', border: '1px solid rgba(0,0,0,0.03)' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', color: '#aaa', fontWeight: 700, letterSpacing: '0.5px' }}>Observation Log</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {exp.checkIns.map((log, i) => (
                          <div key={i} style={{ display: 'flex', fontSize: '14px', lineHeight: 1.4 }}>
                            <span style={{ color: '#aaa', width: '80px', flexShrink: 0, fontWeight: 500 }}>
                              {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ color: '#333' }}>{log.notes}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PAST EXPERIMENTS */}
      {pastExps.length > 0 && (
        <div style={{ opacity: 0.8, animation: 'slideUpFade 0.4s ease-out', animationDelay: '0.4s', animationFillMode: 'both' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Past Protocols</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pastExps.map(exp => (
              <div key={exp._id} style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: '#f9f9fb', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>{exp.title}</span>
                  <span style={{ fontWeight: 800, padding: '4px 12px', borderRadius: '12px', color: exp.status === 'completed' ? '#5b892c' : '#E03E3E', background: exp.status === 'completed' ? '#f5fbee' : '#fef5f5', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                    {exp.status}
                  </span>
                </div>
                <span style={{ fontSize: '14px', color: '#666', marginTop: '8px', lineHeight: 1.5 }}>
                  <strong>Reflection:</strong> {exp.finalReflection || 'No reflection provided.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

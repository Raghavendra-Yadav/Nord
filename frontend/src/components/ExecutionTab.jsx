import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

export default function ExecutionTab({ date }) {
  const { updateXp } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const [tasks, setTasks] = useState({
    frog: { text: '', completed: false },
    ivyTasks: Array(6).fill({ text: '', completed: false, poms: 0 }),
    notToDo: Array(3).fill({ text: '', broken: false })
  });

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/tasks/${date}`);
        if (data) {
          setTasks({
            frog: data.frog || { text: '', completed: false },
            ivyTasks: data.ivyTasks?.length === 6 ? data.ivyTasks : Array(6).fill({ text: '', completed: false, poms: 0 }),
            notToDo: data.notToDo?.length === 3 ? data.notToDo : Array(3).fill({ text: '', broken: false })
          });
        }
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [date]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.put(`/tasks/${date}`, tasks);
      
      // XP Calculation Framework
      let earnedXp = 0;
      if (tasks.frog.completed && tasks.frog.text) earnedXp += 30;
      tasks.ivyTasks.forEach(t => { if (t.completed && t.text) earnedXp += 10; });
      if (earnedXp > 0) updateXp(earnedXp, 'Execution Task Completion');

      setTimeout(() => {
        setSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Failed to save execution matrix');
      setSaving(false);
    }
  };

  const updateFrog = (field, value) => {
    setTasks(prev => ({ ...prev, frog: { ...prev.frog, [field]: value } }));
  };

  const updateIvy = (index, field, value) => {
    setTasks(prev => {
      const newIvy = [...prev.ivyTasks];
      newIvy[index] = { ...newIvy[index], [field]: value };
      return { ...prev, ivyTasks: newIvy };
    });
  };

  const updateNotToDo = (index, field, value) => {
    setTasks(prev => {
      const newNot = [...prev.notToDo];
      newNot[index] = { ...newNot[index], [field]: value };
      return { ...prev, notToDo: newNot };
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading Matrix...</div>;
  }

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Execution Matrix</h2>
          <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px', marginTop: '4px' }}>High-performance action tracking.</p>
        </div>
        <button 
          onClick={handleSave} 
          className="notion-button"
          style={{
            background: savedSuccess ? '#34C759' : '#000',
            color: '#fff',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {saving ? 'Saving...' : savedSuccess ? '✓ Locked In' : 'Commit Matrix'}
        </button>
      </div>

      {/* 1. EAT THE FROG */}
      <div style={{ background: '#FFF5F5', border: '1px solid #FFE3E3', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#E03E3E', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          🐸 Eat the Frog 
        </h3>
        <p style={{ fontSize: '13px', color: '#E03E3E', opacity: 0.8, marginBottom: '16px' }}>
          The absolute hardest, most dreadful task of your day. Do this first.
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            checked={tasks.frog.completed} 
            onChange={e => updateFrog('completed', e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#E03E3E' }}
          />
          <input 
            type="text" 
            className="notion-input" 
            placeholder="Define the Frog..." 
            value={tasks.frog.text}
            onChange={e => updateFrog('text', e.target.value)}
            style={{ 
              margin: 0, 
              background: '#fff', 
              borderColor: tasks.frog.completed ? '#E03E3E' : '#FFE3E3',
              textDecoration: tasks.frog.completed ? 'line-through' : 'none',
              opacity: tasks.frog.completed ? 0.6 : 1,
              flex: 1 
            }}
          />
        </div>
      </div>

      {/* 2. IVY LEE LIST */}
      <div style={{ background: 'var(--notion-input-bg)', border: '1px solid var(--notion-border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>The Ivy Lee 6</h3>
        <p style={{ fontSize: '13px', color: 'var(--notion-gray-text)', marginBottom: '20px' }}>
          Strict limit: 6 tasks maximum. Ordered strictly by importance. 
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.ivyTasks.map((task, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '24px', textAlign: 'center', fontSize: '13px', color: '#aaa', fontWeight: 600 }}>
                {idx + 1}.
              </div>
              <input 
                type="checkbox" 
                checked={task.completed} 
                onChange={e => updateIvy(idx, 'completed', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#000' }}
              />
              <input 
                type="text" 
                className="notion-input" 
                placeholder={`Task ${idx + 1}`} 
                value={task.text}
                onChange={e => updateIvy(idx, 'text', e.target.value)}
                style={{ 
                  margin: 0, 
                  background: '#fff',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.5 : 1,
                  flex: 1 
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>Poms:</span>
                <input 
                  type="number" 
                  min="0"
                  max="10"
                  className="notion-input" 
                  value={task.poms === 0 ? '' : task.poms}
                  onChange={e => updateIvy(idx, 'poms', parseInt(e.target.value) || 0)}
                  style={{ margin: 0, padding: '4px 8px', height: '32px', textAlign: 'center' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. NOT-TO-DO LIST */}
      <div style={{ background: '#F8F9FA', border: '1px solid #E9ECEF', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>The Not-To-Do List</h3>
        <p style={{ fontSize: '13px', color: '#868E96', marginBottom: '20px' }}>
          What 3 things are you absolutely forbidding yourself from doing today?
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.notToDo.map((task, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={task.broken} 
                onChange={e => updateNotToDo(idx, 'broken', e.target.checked)}
                title="Mark if you broke the rule"
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#E03E3E' }}
              />
              <input 
                type="text" 
                className="notion-input" 
                placeholder={`Non-negotiable rule ${idx + 1}`} 
                value={task.text}
                onChange={e => updateNotToDo(idx, 'text', e.target.value)}
                style={{ 
                  margin: 0, 
                  background: task.broken ? '#FFF5F5' : '#fff',
                  borderColor: task.broken ? '#E03E3E' : 'var(--notion-border)',
                  color: task.broken ? '#E03E3E' : '#000',
                  textDecoration: task.broken ? 'line-through' : 'none',
                  flex: 1 
                }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

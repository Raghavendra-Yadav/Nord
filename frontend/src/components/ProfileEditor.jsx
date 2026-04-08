import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

export default function ProfileEditor() {
  const { user, updateUser } = useContext(AuthContext);
  
  // State for the avatar
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePic || null);
  const [avatarFile, setAvatarFile] = useState(null);

  // State for modular sections
  const [modules, setModules] = useState([
    { 
      id: 'identity', 
      title: 'Identity & Bio', 
      visible: true, 
      open: true,
      data: { name: user?.name || '', bio: '', location: '' } 
    },
    { 
      id: 'telemetry', 
      title: 'Live Telemetry (Habit Continuity)', 
      visible: true, 
      open: false,
      data: { shareDeepWork: true, shareReflections: false } 
    },
    { 
      id: 'links', 
      title: 'Links & Artifacts', 
      visible: false, 
      open: false,
      data: { website: '', twitter: '' } 
    }
  ]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingState, setSavingState] = useState('idle'); // idle, saving, success



  // Handle Drag & Drop Reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('moduleIndex', index);
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = e.dataTransfer.getData('moduleIndex');
    if (sourceIndex === '' || Number(sourceIndex) === targetIndex) return;
    
    const newModules = [...modules];
    const [draggedItem] = newModules.splice(sourceIndex, 1);
    newModules.splice(targetIndex, 0, draggedItem);
    
    setModules(newModules);
    setHasUnsavedChanges(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const toggleVisibility = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
    setHasUnsavedChanges(true);
  };

  const toggleOpen = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, open: !m.open } : m));
  };

  const updateModuleData = (id, field, value) => {
    setModules(modules.map(m => {
      if (m.id === id) {
        return { ...m, data: { ...m.data, [field]: value } };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
  };

  // Client-side image "crunching" to save MongoDB space
  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Quality 0.7 JPEG provides excellent compression vs quality balance
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // We can allow larger original files now since we crunch them
    if (file.size > 10 * 1024 * 1024) {
      alert("Please choose an image under 10MB");
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const crunched = await compressImage(reader.result);
      setAvatarPreview(crunched);
      setHasUnsavedChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSavingState('saving');
    try {
      const identityModule = modules.find(m => m.id === 'identity');
      
      // Persist to backend
      const { data } = await api.put('/auth/profile', {
        name: identityModule.data.name,
        profilePic: avatarPreview // Sending base64 for now as simplified implementation
      });

      // Update global context & local storage
      updateUser({
        name: data.name,
        profilePic: data.profilePic
      });
      
      setSavingState('success');
      setHasUnsavedChanges(false);
      setTimeout(() => setSavingState('idle'), 2000);
      
    } catch (err) {
      console.error(err);
      alert("Failed to save profile changes.");
      setSavingState('idle');
    }
  };

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', paddingBottom: '100px', maxWidth: '700px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--notion-text)', marginBottom: '8px' }}>Identity & Settings</h2>
        <p style={{ color: 'var(--notion-gray-text)', fontSize: '14px' }}>Configure your outward-facing system parameters.</p>
      </div>

      {/* AVATAR UPLOAD SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
        <div 
          style={{ 
            width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--notion-input-bg)', 
            border: '2px dashed var(--notion-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', cursor: 'pointer'
          }}
          onClick={() => document.getElementById('avatar-upload').click()}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: '32px', color: '#185FA5', fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() || 'N'}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="avatar-hover-overlay" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(24, 95, 165, 0.8)', color: '#fff', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, opacity: 0, transition: 'opacity 0.2s'
          }}>
            📷 Change
          </div>
          <input id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>System Avatar</h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '12px' }}>JPG, PNG or WebP. Max 5MB. Automatically cropped to perfect circle.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => document.getElementById('avatar-upload').click()} className="notion-button" style={{ margin: 0, height: '28px', padding: '0 12px', fontSize: '12px' }}>
              Upload Image
            </button>
            {avatarPreview && (
              <button 
                onClick={() => { setAvatarPreview(null); setAvatarFile(null); setHasUnsavedChanges(true); }} 
                style={{ background: 'none', border: 'none', color: '#E03E3E', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>


      {/* MODULAR PROFILE SECTIONS */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-gray-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Profile Architecture
        </h3>
        <p style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>Drag sections to reorder. Toggle the eye to hide from public view.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {modules.map((m, index) => (
          <div 
            key={m.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
            style={{ 
              border: `1px solid ${m.open ? '#185FA5' : 'var(--notion-border)'}`, 
              borderRadius: '8px', 
              background: '#fff', 
              opacity: m.visible ? 1 : 0.6,
              transition: 'all 0.2s',
              overflow: 'hidden'
            }}
          >
            {/* Header / Grab Bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px', background: m.open ? 'rgba(24, 95, 165, 0.05)' : '#fff' }}>
              
              <div style={{ cursor: 'grab', marginRight: '16px', color: 'var(--notion-gray-text)', opacity: 0.5, fontSize: '14px', padding: '4px' }} title="Drag to reorder">
                ⠿
              </div>
              
              <button 
                onClick={() => toggleVisibility(m.id)} 
                title={m.visible ? "Make Hidden" : "Make Visible"}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', marginRight: '12px', opacity: m.visible ? 1 : 0.5 }}
              >
                {m.visible ? '👁️' : '✕'}
              </button>
              
              <div style={{ flex: 1, fontWeight: m.open ? 700 : 500, fontSize: '14px', color: m.visible ? 'var(--notion-text)' : 'var(--notion-gray-text)' }}>
                {m.title} {m.visible ? '' : <span style={{ fontSize: '10px', color: '#E03E3E', marginLeft: '6px', fontWeight: 600 }}>HIDDEN</span>}
              </div>
              
              <button 
                onClick={() => toggleOpen(m.id)}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#185FA5', cursor: 'pointer', fontWeight: 600 }}
              >
                {m.open ? 'Close' : 'Edit'}
              </button>
            </div>

            {/* Expander Drawer Content */}
            {m.open && (
              <div style={{ padding: '16px 44px 24px', borderTop: '1px solid var(--notion-border)' }}>
                
                {m.id === 'identity' && (
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Display Name *</label>
                      <input type="text" className="notion-input" value={m.data.name} onChange={e => updateModuleData(m.id, 'name', e.target.value)} maxLength={32} />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">Location</label>
                      <input type="text" className="notion-input" value={m.data.location} onChange={e => updateModuleData(m.id, 'location', e.target.value)} maxLength={64} placeholder="e.g. New York, NY" />
                    </div>
                    <div className="notion-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="notion-label">Life Protocol / Bio</label>
                      <input type="text" className="notion-input" value={m.data.bio} onChange={e => updateModuleData(m.id, 'bio', e.target.value)} maxLength={160} placeholder="A short thesis of your current life objective..." />
                      <div style={{ fontSize: '10px', color: 'var(--notion-gray-text)', textAlign: 'right', marginTop: '4px' }}>{m.data.bio?.length || 0} / 160</div>
                    </div>
                  </div>
                )}

                {m.id === 'telemetry' && (
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--notion-gray-text)', marginBottom: '16px', lineHeight: 1.5 }}>
                      Opt-in to share your raw metrics on your public identity card. Your data proves your system works.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input type="checkbox" id="tlm1" checked={m.data.shareDeepWork} onChange={e => updateModuleData(m.id, 'shareDeepWork', e.target.checked)} />
                      <label htmlFor="tlm1" style={{ fontSize: '13px', cursor: 'pointer' }}>Broadcast Deep Work Continuity Streak</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" id="tlm2" checked={m.data.shareReflections} onChange={e => updateModuleData(m.id, 'shareReflections', e.target.checked)} />
                      <label htmlFor="tlm2" style={{ fontSize: '13px', cursor: 'pointer' }}>Broadcast Daily Text Reflections</label>
                    </div>
                  </div>
                )}

                {m.id === 'links' && (
                  <div className="form-grid">
                    <div className="notion-form-group">
                      <label className="notion-label">Website URL</label>
                      <input type="text" className="notion-input" value={m.data.website} onChange={e => updateModuleData(m.id, 'website', e.target.value)} placeholder="https://" />
                    </div>
                    <div className="notion-form-group">
                      <label className="notion-label">X / Twitter Handle</label>
                      <input type="text" className="notion-input" value={m.data.twitter} onChange={e => updateModuleData(m.id, 'twitter', e.target.value)} placeholder="@" />
                    </div>
                  </div>
                )}

              </div>
            )}
            
          </div>
        ))}
      </div>


      {/* FLOATING ACTION BAR FOR UNSAVED CHANGES */}
      {hasUnsavedChanges && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#185FA5', padding: '12px 24px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(24, 95, 165, 0.4)', color: '#fff',
          display: 'flex', alignItems: 'center', gap: '24px', zIndex: 1000,
          animation: 'slideUp 0.3s ease forwards'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            You have unsaved profile changes.
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={savingState === 'saving'}
              style={{ background: '#fff', color: '#185FA5', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              {savingState === 'saving' ? 'Saving...' : savingState === 'success' ? '✓ Saved' : 'Save Identity'}
            </button>
          </div>
        </div>
      )}

      {/* Basic Keyframe Animations embedded for the UX */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .avatar-hover-overlay:hover {
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
}

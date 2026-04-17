import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { requestPasswordReset } = useContext(AuthContext);

  useEffect(() => {
    document.title = "Forgot Password – Nord";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const data = await requestPasswordReset(email);
      // For development purposes we display the token in the message.
      // In production this would just say email sent.
      setMessage(`Success! Email sent. ${data.token ? `(Dev Token: ${data.token})` : ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting password reset');
    }
  };

  return (
    <div className="notion-layout">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="1" />
          <rect x="16" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.8" />
          <rect x="28" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.6" />
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 4px 0' }}>Forgot Password</h1>
        <p style={{ fontSize: '13px', color: 'rgba(55,53,47,0.5)', margin: 0, letterSpacing: '0.3px' }}>
          Enter your email to receive a reset link.
        </p>
      </div>

      {error && (
        <div style={{ color: '#E03E3E', fontSize: 13, marginBottom: '20px', textAlign: 'center', background: '#FDEAE9', padding: '10px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ color: '#0F7B53', fontSize: 13, marginBottom: '20px', textAlign: 'center', background: '#EDF3F1', padding: '10px', borderRadius: '4px', wordBreak: 'break-all' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="notion-form-group">
          <label className="notion-label">Email</label>
          <input 
            type="email" 
            className="notion-input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter your email address..."
            required
          />
        </div>
        
        <button type="submit" className="notion-button" style={{ marginBottom: '16px' }}>
          Request Reset Link
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 13 }}>
        <Link to="/login" className="notion-link">Back to Log In</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

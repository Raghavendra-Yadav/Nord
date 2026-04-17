import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reset Password – Nord";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token');
    }
  };

  if (success) {
    return (
      <div className="notion-layout" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Password Reset!</h1>
        <p style={{ color: '#0F7B53' }}>Your password has been successfully updated.</p>
        <p style={{ fontSize: '13px' }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="notion-layout">
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 4px 0' }}>Reset Password</h1>
        <p style={{ fontSize: '13px', color: 'rgba(55,53,47,0.5)', margin: 0, letterSpacing: '0.3px' }}>
          Please choose a new, secure password.
        </p>
      </div>

      {error && (
        <div style={{ color: '#E03E3E', fontSize: 13, marginBottom: '20px', textAlign: 'center', background: '#FDEAE9', padding: '10px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="notion-form-group">
          <label className="notion-label">New Password</label>
          <input 
            type="password" 
            className="notion-input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="At least 6 characters"
            required
            minLength={6}
          />
        </div>
        
        <div className="notion-form-group">
          <label className="notion-label">Confirm Password</label>
          <input 
            type="password" 
            className="notion-input" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" className="notion-button" style={{ marginBottom: '16px' }}>
          Update Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

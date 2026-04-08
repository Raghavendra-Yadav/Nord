import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Log in – Life Tracker";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="notion-layout">
      {/* Premium Minimalist SVG Logo: A 3x3 grid specifically representing the 9 Life Areas */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="1" />
          <rect x="16" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.8" />
          <rect x="28" y="4" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.6" />
          <rect x="4" y="16" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.9" />
          <rect x="16" y="16" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.4" />
          <rect x="28" y="16" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.7" />
          <rect x="4" y="28" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.5" />
          <rect x="16" y="28" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.3" />
          <rect x="28" y="28" width="8" height="8" rx="2" fill="#000000" fill-opacity="0.2" />
        </svg>
      </div>

      <h1 className="notion-title">Log in</h1>

      {error && (
        <div style={{ color: '#E03E3E', fontSize: 13, marginBottom: '20px', textAlign: 'center', background: '#FDEAE9', padding: '10px', borderRadius: '4px' }}>
          {error}
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
        
        <div className="notion-form-group">
          <label className="notion-label">Password</label>
          <input 
            type="password" 
            className="notion-input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter your password..."
            required
          />
        </div>

        <button type="submit" className="notion-button">
          Sign In
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 13, marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(55,53,47,0.65)' }}>
        <a href="#" className="notion-link" style={{fontSize: 13, textDecoration: 'none'}}>Forgot password?</a>
        <div>
          Don't have an account? <Link to="/register" className="notion-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

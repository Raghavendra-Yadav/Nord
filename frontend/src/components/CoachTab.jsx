import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';

export default function CoachTab({ date }) {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReview = async () => {
    setLoading(true);
    setError('');
    setReview('');

    try {
      const { data } = await api.post('/reviews/generate', { date });
      setReview(data.review);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("You haven't logged any data for this date yet. Fill out your Daily Log first!");
      } else {
        setError(err.response?.data?.message || "Failed to connect to the AI Coach API. Please ensure your API key is correctly configured.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ animation: 'smoothDropIn 0.3s ease forwards', maxWidth: '700px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Goggins / Huberman / Clear Review</h2>
        <p style={{ fontSize: '14px', color: 'var(--notion-gray-text)' }}>
          Get ruthless, AI-driven actionables for tomorrow based exclusively on today's logged performance.
        </p>

        <button 
          onClick={generateReview}
          disabled={loading}
          style={{
            marginTop: '24px',
            background: loading ? '#888' : '#000',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={e => e.target.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.target.style.transform = 'scale(1)'}
        >
          {loading ? 'Analyzing Today\'s Data...' : `Generate Action Plan for ${new Date(date).toLocaleDateString()}`}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FDEAE9', color: '#E03E3E', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {review && (
        <div style={{ 
          background: 'var(--notion-input-bg)', 
          padding: '32px', 
          borderRadius: '12px', 
          border: '1px solid var(--notion-border)',
          lineHeight: '1.6',
          fontSize: '15px'
        }}>
          <ReactMarkdown>{review}</ReactMarkdown>
        </div>
      )}

    </div>
  );
}

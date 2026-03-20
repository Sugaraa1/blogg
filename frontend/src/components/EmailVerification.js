import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // 🆕 useLocation нэмсэн
import './Auth.css';

function EmailVerification({ onVerified }) {
  const navigate = useNavigate();
  const location = useLocation(); // 🆕 НЭМСЭН
  
  // 🆕 state-аас email авах
  const emailFromState = location.state?.email;
  const messageFromState = location.state?.message;
  
  const [email] = useState(emailFromState || ''); // 🆕 ЗАСВАРЛАСАН
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 🆕 Email байхгүй бол login page руу буцаах
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-email', {
        email,
        code
      });
      
      setSuccess(response.data.message);
      
      // Login хийх
      if (onVerified) {
        onVerified(response.data.user, response.data.token);
      }
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Баталгаажуулалтын алдаа');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-verification', {
        email
      });
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Код илгээхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Email байхгүй бол хоосон screen харуулах
  if (!email) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>✉️ И-мэйл баталгаажуулалт</h1>
        
        {/* 🆕 Success message from registration */}
        {messageFromState && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#86efac',
            padding: '14px 16px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {messageFromState}
          </div>
        )}
        
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px', fontSize: '15px' }}>
          <strong style={{ color: '#fff' }}>{email}</strong> хаяг руу илгээсэн 6 оронтой кодыг оруулна уу
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#86efac',
            padding: '14px 16px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="6 оронтой код"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            style={{ 
              textAlign: 'center', 
              fontSize: '24px', 
              letterSpacing: '8px',
              fontFamily: 'monospace'
            }}
          />
          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Баталгаажуулж байна...' : 'Баталгаажуулах'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
          Код хүлээн аваагүй юу?{' '}
          <button
            onClick={handleResend}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              textDecoration: 'underline',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Дахин илгээх
          </button>
        </p>
        
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            ← Нэвтрэх хуудас руу буцах
          </button>
        </p>
      </div>
    </div>
  );
}

export default EmailVerification;
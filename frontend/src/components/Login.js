import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      // И-мэйл баталгаажаагүй бол verification page руу шилжүүлэх
      if (err.response?.data?.emailNotVerified) {
        navigate('/verify-email', { 
          state: { 
            email: err.response.data.email,
            message: err.response.data.message 
          } 
        });
        return;
      }
      
      setError(err.response?.data?.message || 'Нэвтрэх явцад алдаа гарлаа');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>🐦 Э-Блог системд нэвтрэх</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="И-мэйл хаяг"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Нууц үг"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit">Нэвтрэх</button>
        </form>
        <p>
          Бүртгэлгүй юу? <Link to="/register">Бүртгүүлэх</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Auth.css';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Бүртгэл үүсгэхэд алдаа гарлаа');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>🐦 Бүртгүүлэх</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Хэрэглэгчийн нэр"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Дэлгэцийн нэр"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />
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
          <button type="submit">Бүртгүүлэх</button>
        </form>
        <p>
          Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
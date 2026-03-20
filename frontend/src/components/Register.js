import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, formData);
      
      // Verification page руу шилжүүлэх
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          message: response.data.message 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Бүртгэл үүсгэхэд алдаа гарлаа');
      setLoading(false);
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
            placeholder="Нууц үг (дор хаяж 6 тэмдэгт)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
          </button>
        </form>
        <p>
          Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
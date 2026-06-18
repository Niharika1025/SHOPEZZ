import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role);
      showToast('Registration successful! Welcome to ShopEZ.', 'success');
      
      if (role === 'seller') {
        navigate('/seller-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '40px auto',
      padding: '0 20px'
    }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px' }} className="text-gradient-accent">Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Join ShopEZ marketplace today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              className="glass-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              className="glass-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              className="glass-input"
              placeholder="•••••••• (Min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>I want to register as a:</label>
            <select
              className="glass-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ appearance: 'none', background: 'rgba(10, 11, 30, 0.9)' }}
            >
              <option value="buyer">Buyer (Shop products)</option>
              <option value="seller">Seller (Sell products)</option>
            </select>
          </div>

          <button
            type="submit"
            className="glass-button-primary"
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

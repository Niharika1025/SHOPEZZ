import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      
      // Role-based routing
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'seller') {
        navigate('/seller-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '450px',
      margin: '60px auto',
      padding: '0 20px'
    }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px' }} className="text-gradient-accent">Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Log in to access your ShopEZ account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="glass-button-primary"
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

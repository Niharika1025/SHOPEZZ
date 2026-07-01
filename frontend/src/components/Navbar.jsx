import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getCartCount = () => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  return (
  return (
  <nav
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '18px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0,0,0,.05)'
    }}
  >
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: '1px'
        }} className="text-gradient-accent">
          ShopEZ
        </Link>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Products
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user ? (
          <>
            {user.role === 'buyer' && (
              <>
                <Link to="/cart" style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-primary)'
                }}>
                  Cart
                  {getCartCount() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-16px',
                      background: 'var(--color-secondary)',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                <Link to="/orders" style={{ color: 'var(--text-primary)' }}>
                  My Orders
                </Link>
              </>
            )}

            {user.role === 'seller' && (
              <Link to="/seller-dashboard" style={{
                color: 'var(--color-primary-hover)',
                fontWeight: 600,
                border: '1px solid var(--color-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(138, 43, 226, 0.1)'
              }}>
                Seller Panel
              </Link>
            )}

            {user.role === 'admin' && (
              <Link to="/admin-dashboard" style={{
                color: 'var(--color-secondary)',
                fontWeight: 600,
                border: '1px solid var(--color-secondary)',
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(255, 0, 127, 0.1)'
              }}>
                Admin Panel
              </Link>
            )}

            <Link to="/profile" style={{ color: 'var(--text-secondary)' }}>
              Profile ({user.name})
            </Link>

            <button
              onClick={handleLogout}
              className="glass-button-secondary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Login
            </Link>
            <Link to="/register" className="glass-button-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

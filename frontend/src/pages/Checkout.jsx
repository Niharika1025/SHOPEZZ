import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import API from '../services/api';

const Checkout = () => {
  const { cart } = useCart();
  const { showToast } = useNotifications();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [processing, setProcessing] = useState(false);

  const subtotal = cart?.totalAmount || 0;
  const shipping = subtotal > 100 ? 0 : 10.0;
  const total = subtotal + shipping;
  const items = cart?.items || [];

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    setProcessing(true);
    try {
      const shippingAddress = { street, city, state, zipCode, country };
      const { data } = await API.post('/orders/checkout-session', { shippingAddress });
      
      showToast('Redirecting to secure Stripe payment...', 'info');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to initialize Stripe payment URL');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to initiate checkout session';
      showToast(errMsg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card">
          <h2 className="text-gradient" style={{ marginBottom: '16px' }}>Checkout Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You have no items in your cart to checkout.</p>
          <Link to="/" className="glass-button-primary">Go to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '24px' }}>Checkout</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Shipping Form */}
        <form onSubmit={handlePlaceOrder} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }} className="text-gradient">Shipping Address</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Street Address</label>
            <input
              type="text"
              className="glass-input"
              placeholder="123 Main St"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>City</label>
              <input
                type="text"
                className="glass-input"
                placeholder="Tech City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>State / Province</label>
              <input
                type="text"
                className="glass-input"
                placeholder="California"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Zip / Postal Code</label>
              <input
                type="text"
                className="glass-input"
                placeholder="90210"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Country</label>
              <input
                type="text"
                className="glass-input"
                placeholder="United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="glass-button-primary"
            style={{ padding: '14px', width: '100%', marginTop: '12px' }}
            disabled={processing}
          >
            {processing ? 'Processing Order...' : 'Place Mock Order (Pay Direct)'}
          </button>
        </form>

        {/* Order Summary */}
        <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '20px' }} className="text-gradient">Items Summary</h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '240px',
            overflowY: 'auto',
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: '16px'
          }}>
            {items.map((item) => {
              const prod = item.product || {};
              return (
                <div key={item._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.01)',
                    flexShrink: 0
                  }}>
                    <img
                      src={prod.images?.[0] || 'https://via.placeholder.com/40'}
                      alt={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Qty: {item.quantity} &times; ${prod.price?.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    ${((prod.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
            <span>Total</span>
            <span className="text-gradient-accent">${total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;

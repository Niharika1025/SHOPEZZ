import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleQtyChange = async (productId, currentQty, stock, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;
    if (newQty > stock) {
      showToast(`Cannot exceed available stock (${stock})`, 'warning');
      return;
    }
    try {
      await updateQuantity(productId, newQty);
    } catch (err) {
      showToast('Error updating item quantity', 'error');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      showToast('Item removed from cart', 'success');
    } catch (err) {
      showToast('Error removing item from cart', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--glass-border)',
          borderTop: '3px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || 0;
  const shipping = subtotal > 100 ? 0 : 10.0;
  const total = subtotal + shipping;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '24px' }}>Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '24px' }}>
            Your shopping cart is currently empty.
          </p>
          <Link to="/" className="glass-button-primary" style={{ padding: '12px 32px' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Cart Items Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const prod = item.product || {};
                  return (
                    <tr key={item._id || prod._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--glass-border)',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.01)',
                            flexShrink: 0
                          }}>
                            <img
                              src={prod.images?.[0] || 'https://via.placeholder.com/60'}
                              alt={prod.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                            />
                          </div>
                          <div>
                            <Link to={`/products/${prod._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {prod.name || 'Unknown Product'}
                            </Link>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Stock: {prod.stock || 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>${(prod.price || 0).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <button
                            onClick={() => handleQtyChange(prod._id, item.quantity, prod.stock, false)}
                            style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', color: '#fff' }}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 12px', fontSize: '14px', minWidth: '30px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(prod._id, item.quantity, prod.stock, true)}
                            style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', color: '#fff' }}
                            disabled={item.quantity >= prod.stock}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                        ${((prod.price || 0) * item.quantity).toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemove(prod._id)}
                          style={{
                            background: 'none',
                            color: 'var(--color-error)',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cart Summary */}
          <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px' }} className="text-gradient">Order Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px' }}>
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700 }}>
              <span>Total</span>
              <span className="text-gradient-accent">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="glass-button-primary"
              style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '15px' }}
            >
              Proceed to Checkout
            </button>
            
            <Link to="/" style={{ textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;

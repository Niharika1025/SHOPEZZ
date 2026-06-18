import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await API.get('/orders/my-orders');
        setOrders(data.data || []);
      } catch (err) {
        console.error(err);
        showToast('Error loading your orders', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'processing': return 'badge-pending';
      case 'shipped': return 'badge-success'; // Blue badge if we had one, otherwise green
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-error';
      default: return 'badge-pending';
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

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '24px' }}>My Orders</h1>

      {orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '20px' }}>
            You have not placed any orders yet.
          </p>
          <a href="/" className="glass-button-primary">Start Shopping</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order) => (
            <div key={order._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Order Header Summary */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--glass-border)',
                paddingBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ORDER ID</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>#{order._id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PLACED ON</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL VALUE</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    ${order.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>STATUS</div>
                  <div style={{ marginTop: '2px', textAlign: 'right' }}>
                    <span className={`glass-badge ${getStatusClass(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items.map((item) => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '10px'
                      }}>
                        Image
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Footer */}
              <div style={{
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--glass-border)',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                <strong>Shipping Address:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

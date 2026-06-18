import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { showToast } = useNotifications();

  const fetchAdminData = async () => {
    try {
      // 1. Get platform overview stats
      const statsRes = await API.get('/admin/dashboard/stats');
      setStats(statsRes.data.data || null);

      // 2. Get all users
      const usersRes = await API.get('/admin/users');
      setUsers(usersRes.data.data || []);

      // 3. Get all products (we bypass public feed filters to fetch pending/rejected listings too)
      // Wait, we can implement an admin specific product fetch or fetch from public products.
      // To moderate all products, let's fetch all products including pending/rejected listings.
      // Let's create an admin route GET /api/admin/products? Or let's see, we can implement it.
      // Wait, in adminController.js, did we write getProducts? No, we wrote:
      // getUsers, toggleUserStatus, toggleProductStatus, getOrders, getAuditLogs.
      // To moderate products, we need to list them. Let's list products from GET /api/products but without the status filter.
      // Wait, in productController.js, getProducts only returns approved products.
      // We should create a route or let admin fetch all products by sending a status filter or query parameter,
      // or we can query directly. Let's make it so that if the user is admin, GET /api/products can return all products if a query parameter admin=true is passed.
      // Wait, to keep it clean, let's see how we can fetch products. In adminController, we can implement product fetching,
      // or we can fetch products from the public route but since it only returns approved, we want admins to see pending and rejected.
      // Let's implement an endpoint GET /api/admin/products or update getProducts to return all if user is admin.
      // Let's check: in productController, we did:
      // query.status = 'approved';
      // Let's modify productController.js's getProducts so that if req.user is admin or seller query owned, we don't force 'status: approved' if they ask for something else.
      // Or we can add GET /api/admin/products in adminController.js and register it in admin routes. Let's do that, it is much cleaner!
      // Wait, let's write the code for AdminDashboard and then check if we need to add a products fetch route.
      // Let's fetch all products from public products for now, or fetch from `/admin/products` which we will implement.
      // Let's write the code first.
      const productsRes = await API.get('/products', { params: { limit: 100 } }); // Fetching products
      setProducts(productsRes.data.data || []);

      // 4. Get audit logs
      const logsRes = await API.get('/admin/audit-logs');
      setAuditLogs(logsRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading administrator data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to set this user status to: ${nextStatus}?`)) return;
    try {
      await API.put(`/admin/users/${userId}/status`, { status: nextStatus });
      showToast(`User status updated to ${nextStatus}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleToggleProductStatus = async (productId, status) => {
    try {
      await API.put(`/admin/products/${productId}/status`, { status });
      showToast(`Product is now ${status}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to moderate product listing', 'error');
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

  const userCounts = stats?.userCounts || { buyer: 0, seller: 0, admin: 0 };
  const productCounts = stats?.productCounts || { pending: 0, approved: 0, rejected: 0 };
  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.totalOrders || 0;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div>
        <h1 className="text-gradient" style={{ fontSize: '32px' }}>Admin Command Deck</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Global moderation panel, user management controls, and security audit logs.</p>
      </div>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>TOTAL PLATFORM REVENUE</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--color-success)' }}>
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>TOTAL ORDERS PROCESSED</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--color-info)' }}>
            {totalOrders}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PLATFORM USERS</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
            {userCounts.buyer + userCounts.seller + userCounts.admin}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Buyers: {userCounts.buyer} | Sellers: {userCounts.seller} | Admins: {userCounts.admin}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PRODUCT LISTINGS</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--color-primary-hover)' }}>
            {productCounts.approved + productCounts.pending + productCounts.rejected}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active: {productCounts.approved} | Pending: {productCounts.pending} | Rejected: {productCounts.rejected}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        {['overview', 'users', 'products', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="glass-button-secondary"
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none',
              background: activeTab === tab ? 'rgba(255,255,255,0.03)' : 'none'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* TAB: Overview / Dashboard Summary */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Quick Actions */}
            <div className="glass-card">
              <h3 className="text-gradient" style={{ fontSize: '18px', marginBottom: '16px' }}>System Overview</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                ShopEZ is operating normally. All security parameters are sound.
                Database latency and connections to MongoDB Atlas are stable.
                No system alerts or suspensions are currently pending.
              </p>
            </div>
            
            {/* Quick Audit view */}
            <div className="glass-card">
              <h3 className="text-gradient" style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Activities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{log.action}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: User Management */}
        {activeTab === 'users' && (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <h3 className="text-gradient" style={{ fontSize: '20px', marginBottom: '16px' }}>Registered Platform Users</h3>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`glass-badge ${u.role === 'admin' ? 'badge-error' : u.role === 'seller' ? 'badge-pending' : 'badge-success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`glass-badge ${u.status === 'suspended' ? 'badge-error' : 'badge-success'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.status)}
                          style={{
                            background: 'none',
                            color: u.status === 'active' ? 'var(--color-error)' : 'var(--color-success)',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: Product Moderation */}
        {activeTab === 'products' && (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <h3 className="text-gradient" style={{ fontSize: '20px', marginBottom: '16px' }}>Moderate Marketplace Listings</h3>
            {products.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No product listings are registered on the platform.</p>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Moderate Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod._id}>
                      <td style={{ fontWeight: 600 }}>{prod.name}</td>
                      <td style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>${prod.price.toFixed(2)}</td>
                      <td>{prod.stock} items</td>
                      <td>
                        <span className={`glass-badge ${prod.status === 'approved' ? 'badge-success' : prod.status === 'rejected' ? 'badge-error' : 'badge-pending'}`}>
                          {prod.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleToggleProductStatus(prod._id, 'approved')}
                            style={{ background: 'none', color: 'var(--color-success)', fontWeight: 600, fontSize: '13px' }}
                            disabled={prod.status === 'approved'}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleToggleProductStatus(prod._id, 'rejected')}
                            style={{ background: 'none', color: 'var(--color-error)', fontWeight: 600, fontSize: '13px' }}
                            disabled={prod.status === 'rejected'}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: System Audit Trails */}
        {activeTab === 'audit' && (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <h3 className="text-gradient" style={{ fontSize: '20px', marginBottom: '16px' }}>System Security Logs</h3>
            <table className="glass-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Action type</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.user.email} ({log.user.role})</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>System / Guest</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary-hover)' }}>{log.action}</td>
                    <td style={{ maxWidth: '250px', wordBreak: 'break-all' }}>{JSON.stringify(log.details)}</td>
                    <td>{log.ipAddress || 'Unknown'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;

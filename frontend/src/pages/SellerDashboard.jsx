import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // New Product Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const { data } = await API.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(data.data.url);
      showToast('Image uploaded successfully to Cloudinary!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Image upload failed. Defaulting to placeholder.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch seller statistics and product inventory
      const statsRes = await API.get('/seller/dashboard/stats');
      setStats(statsRes.data.data || null);

      // 2. Fetch all orders for this seller
      const ordersRes = await API.get('/orders/seller-orders');
      setOrders(ordersRes.data.data || []);

      // 3. Fetch categories (for product creation select)
      const catRes = await API.get('/categories');
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading seller dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !description || !price || !stock || !category) {
      showToast('Please fill in all product fields', 'warning');
      return;
    }

    try {
      await API.post('/products', {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        images: imageUrl ? [imageUrl] : ['https://via.placeholder.com/300?text=ShopEZ+Product']
      });

      showToast('Product listed successfully!', 'success');
      setShowAddModal(false);
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('');
      setImageUrl('');

      fetchDashboardData();
    } catch (err) {
      showToast('Failed to list product', 'error');
    }
  };

  const handleEditProductClick = (prod) => {
    setEditProduct(prod);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/products/${editProduct._id}`, {
        name: editProduct.name,
        description: editProduct.description,
        price: Number(editProduct.price),
        stock: Number(editProduct.stock),
        category: editProduct.category?._id || editProduct.category,
        images: editProduct.images
      });

      showToast('Product updated successfully!', 'success');
      setShowEditModal(false);
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await API.delete(`/products/${productId}`);
      showToast('Product listing deleted', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      showToast(`Order status updated to ${newStatus}`, 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
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

  const metrics = stats?.metrics || {};
  const chartData = stats?.chartData || [];
  const products = stats?.products || [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page Title & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '32px' }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Manage your inventory, monitor sales, and process incoming orders.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="glass-button-primary">
          + Add New Product
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px'
      }}>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>TOTAL REVENUE</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--color-success)' }}>
            ${metrics.totalRevenue?.toFixed(2)}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ORDERS RECEIVED</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--color-info)' }}>
            {metrics.totalOrders}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>UNITS SOLD</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
            {metrics.totalItemsSold}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>TOTAL LISTINGS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--color-primary-hover)' }}>
            {metrics.totalProducts}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>OUT OF STOCK</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: metrics.outOfStock > 0 ? 'var(--color-error)' : 'var(--text-primary)' }}>
            {metrics.outOfStock}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="glass-card" style={{ height: '350px' }}>
          <h3 className="text-gradient" style={{ fontSize: '18px', marginBottom: '20px' }}>Sales Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '11px' }} />
              <YAxis stroke="var(--text-muted)" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-dark-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="sales" name="Sales ($)" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grid: Inventory and Orders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
      }}>
        
        {/* Inventory Table */}
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <h3 className="text-gradient" style={{ fontSize: '20px', marginBottom: '16px' }}>My Products Inventory</h3>
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>You haven't listed any products yet.</p>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Ratings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--glass-border)',
                          background: 'rgba(255,255,255,0.01)',
                          flexShrink: 0
                        }}>
                          <img src={prod.images?.[0] || 'https://via.placeholder.com/40'} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{prod.name}</span>
                      </div>
                    </td>
                    <td>{prod.category?.name || 'Unassigned'}</td>
                    <td style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>${prod.price.toFixed(2)}</td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="glass-badge badge-error">Out of Stock</span>
                      ) : (
                        <span>{prod.stock} units</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-warning)' }}>
                      ★ {prod.ratings.average.toFixed(1)} ({prod.ratings.count})
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleEditProductClick(prod)} style={{ background: 'none', color: 'var(--color-info)', fontWeight: 600 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteProduct(prod._id)} style={{ background: 'none', color: 'var(--color-error)', fontWeight: 600 }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orders Table */}
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <h3 className="text-gradient" style={{ fontSize: '20px', marginBottom: '16px' }}>Manage Store Orders</h3>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>No purchases have been made for your products yet.</p>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>My Items (Qty)</th>
                  <th>Total Revenue</th>
                  <th>Status</th>
                  <th>Update Shipping</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const sellerItems = ord.items.filter((item) => item.seller.toString() === stats?.products?.[0]?.seller?.toString() || item.seller.toString() === stats?.products?.[0]?.seller);
                  const revenue = sellerItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
                  return (
                    <tr key={ord._id}>
                      <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>#{ord._id}</td>
                      <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td>
                        {sellerItems.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '13px' }}>
                            {item.name} ({item.quantity}x)
                          </div>
                        ))}
                      </td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>${revenue.toFixed(2)}</td>
                      <td>
                        <span className={`glass-badge badge-pending`}>{ord.orderStatus}</span>
                      </td>
                      <td>
                        <select
                          className="glass-input"
                          value={ord.orderStatus}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          style={{ appearance: 'none', background: 'var(--bg-dark-secondary)', padding: '6px 10px', fontSize: '13px', width: '130px' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal (Simple absolute overlay CSS) */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 15, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleAddProduct} className="glass-card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="text-gradient" style={{ fontSize: '22px' }}>List New Product</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Product Name</label>
              <input type="text" className="glass-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Description</label>
              <textarea className="glass-input" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px' }}>Price ($)</label>
                <input type="number" step="0.01" className="glass-input" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px' }}>Stock Quantity</label>
                <input type="number" className="glass-input" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Category</label>
              <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ appearance: 'none', background: 'var(--bg-dark-secondary)' }}>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Product Image File (Cloudinary Upload)</label>
              <input
                type="file"
                accept="image/*"
                className="glass-input"
                onChange={handleImageUpload}
              />
              {uploadingImage && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Uploading image to Cloudinary...</div>}
              {imageUrl && (
                <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>
                  Image ready: <a href={imageUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all', color: 'var(--color-success)' }}>{imageUrl}</a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="glass-button-secondary" style={{ width: '50%' }}>
                Cancel
              </button>
              <button type="submit" className="glass-button-primary" style={{ width: '50%' }}>
                Create Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 15, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleUpdateProduct} className="glass-card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="text-gradient" style={{ fontSize: '22px' }}>Edit Product Listing</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Product Name</label>
              <input type="text" className="glass-input" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px' }}>Description</label>
              <textarea className="glass-input" rows="3" value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px' }}>Price ($)</label>
                <input type="number" step="0.01" className="glass-input" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px' }}>Stock Quantity</label>
                <input type="number" className="glass-input" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} className="glass-button-secondary" style={{ width: '50%' }}>
                Cancel
              </button>
              <button type="submit" className="glass-button-primary" style={{ width: '50%' }}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;

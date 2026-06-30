import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('-createdAt');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get('/categories');
        setCategories(data.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products whenever filters change
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        sort
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.minRating = minRating;

      const { data } = await API.get('/products', { params });
alert(`Products loaded: ${data.data?.length}`);
      setProducts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products', err);
      showToast('Error loading products from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, minRating, sort, page]); // Triggers immediately on option change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSort('-createdAt');
    setPage(1);
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation(); // Avoid navigating to details page
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      navigate('/login');
      return;
    }
    try {
      await addToCart(productId, 1);
      showToast('Item added to cart successfully!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not add item to cart';
      showToast(errMsg, 'error');
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <header className="glass-card" style={{
        textAlign: 'center',
        padding: '50px 20px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.05) 0%, rgba(255, 0, 127, 0.03) 100%)'
      }}>
        <h1 className="text-gradient-accent" style={{ fontSize: '40px', marginBottom: '12px', fontWeight: 800 }}>
          ShopEZ Marketplace
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          Explore curated items from trusted sellers with responsive UI, real-time filters, and instant checkout.
        </p>
      </header>

      {/* Main Grid: Filters + Products */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Glassmorphism Filters Panel */}
        <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px' }} className="text-gradient">Filters</h3>
            <button
              onClick={handleClearFilters}
              style={{ background: 'none', color: 'var(--color-secondary)', fontSize: '12px', fontWeight: 600 }}
            >
              Reset All
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px' }}
            />
            <button type="submit" className="glass-button-primary" style={{ padding: '8px 12px' }}>
              Go
            </button>
          </form>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Category</label>
            <select
              className="glass-input"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={{ appearance: 'none', background: 'var(--bg-dark-secondary)', padding: '8px 12px' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Price Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                className="glass-input"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ padding: '8px 8px', fontSize: '13px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                className="glass-input"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ padding: '8px 8px', fontSize: '13px' }}
              />
            </div>
            <button
              onClick={() => { setPage(1); fetchProducts(); }}
              className="glass-button-secondary"
              style={{ padding: '6px', fontSize: '12px', width: '100%', marginTop: '4px' }}
            >
              Apply Price
            </button>
          </div>

          {/* Ratings Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Minimum Rating</label>
            <select
              className="glass-input"
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
              style={{ appearance: 'none', background: 'var(--bg-dark-secondary)', padding: '8px 12px' }}
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          {/* Sorting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sort By</label>
            <select
              className="glass-input"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              style={{ appearance: 'none', background: 'var(--bg-dark-secondary)', padding: '8px 12px' }}
            >
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-ratings.average">Top Rated</option>
            </select>
          </div>
        </aside>

        {/* Right Side: Products Grid */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
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
          ) : products.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>No products found matching your criteria.</p>
              <button onClick={handleClearFilters} className="glass-button-primary" style={{ marginTop: '16px' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '24px'
              }}>
                {products.map((prod) => (
                  <div
                    key={prod._id}
                    className="glass-card glass-card-hover"
                    onClick={() => navigate(`/products/${prod._id}`)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Image block */}
                    <div style={{
                      height: '180px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--glass-border)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={prod.images?.[0] || 'https://via.placeholder.com/300'}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                      />
                    </div>

                    {/* Meta info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                      <span className="glass-badge badge-pending" style={{ alignSelf: 'start', fontSize: '10px' }}>
                        {prod.category?.name || 'Category'}
                      </span>
                      <h3 style={{ fontSize: '18px', marginTop: '6px', fontWeight: 600 }}>{prod.name}</h3>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginTop: '4px'
                      }}>
                        {prod.description}
                      </p>
                      {prod.ratings?.count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '13px', color: 'var(--color-warning)' }}>
                          ★ {prod.ratings.average.toFixed(1)} <span style={{ color: 'var(--text-muted)' }}>({prod.ratings.count})</span>
                        </div>
                      )}
                    </div>

                    {/* Footer price & Buy actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)' }}>
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(prod.price)}
</span>
                      {(!user || user.role === 'buyer') && (
                        <button
                          onClick={(e) => handleAddToCart(e, prod._id)}
                          className="glass-button-primary"
                          style={{ padding: '8px 12px', fontSize: '13px' }}
                          disabled={prod.stock === 0}
                        >
                          {prod.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="glass-button-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    &larr; Prev
                  </button>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="glass-button-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;

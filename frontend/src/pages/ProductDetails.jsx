import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart } = useCart();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProductAndReviews = async () => {
    try {
      const prodRes = await API.get(`/products/${id}`);
      setProduct(prodRes.data.data || prodRes.data);

      const reviewRes = await API.get(`/reviews/product/${id}`);
      setReviews(reviewRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      showToast('Only buyers can purchase items', 'error');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      showToast(`${quantity}x item(s) added to cart!`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not add item to cart';
      showToast(errMsg, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please write a review comment', 'warning');
      return;
    }
    setSubmittingReview(true);
    try {
      await API.post('/reviews', {
        productId: product._id,
        rating,
        comment
      });
      showToast('Review submitted successfully!', 'success');
      setComment('');
      setRating(5);
      // Refresh data to show the new review and updated product rating
      fetchProductAndReviews();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit review. Note: Only buyers who purchased this item can review it.';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      showToast('Review deleted', 'success');
      fetchProductAndReviews();
    } catch (err) {
      showToast('Failed to delete review', 'error');
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

  if (!product) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card">
          <h2 className="text-gradient" style={{ marginBottom: '16px' }}>Product Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The product listing does not exist or has been removed.</p>
          <Link to="/" className="glass-button-primary">Back to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', marginBottom: '24px', fontWeight: 500 }}>
        &larr; Back to Catalog
      </Link>

      {/* Main product layout */}
      <div className="glass-card" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 450px) 1fr',
        gap: '40px',
        alignItems: 'start',
        marginBottom: '40px'
      }}>
        {/* Product Image Panel */}
        <div style={{
          borderRadius: 'var(--border-radius-md)',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '350px'
        }}>
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/450'}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/450?text=No+Image'; }}
          />
        </div>

        {/* Product Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <span className="glass-badge badge-pending" style={{ marginBottom: '8px' }}>
              {product.category?.name || 'Category'}
            </span>
            <h1 className="text-gradient" style={{ fontSize: '36px', fontWeight: 700, marginTop: '4px' }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--color-warning)', fontSize: '15px' }}>
              ★ {product.ratings?.average > 0 ? product.ratings.average.toFixed(1) : 'No ratings'} 
              <span style={{ color: 'var(--text-muted)' }}>({product.ratings?.count || 0} customer reviews)</span>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            padding: '20px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Price</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '4px' }}>
                ${product.price?.toFixed(2)}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Availability</div>
              <div style={{ marginTop: '4px' }}>
                {product.stock > 0 ? (
                  <span className="glass-badge badge-success">In Stock ({product.stock})</span>
                ) : (
                  <span className="glass-badge badge-error">Out of Stock</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }} className="text-gradient">Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>
              {product.description}
            </p>
          </div>

          {/* Seller details */}
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Listed by: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{product.seller?.name || 'Seller'}</span>
          </div>

          {/* Purchase actions */}
          {(!user || user.role === 'buyer') && product.stock > 0 && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
              {/* Quantity Select */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 16px', color: '#fff' }}
                >
                  -
                </button>
                <span style={{ padding: '0 16px', fontSize: '16px', minWidth: '40px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 16px', color: '#fff' }}
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddToCart}
                className="glass-button-primary"
                style={{ flexGrow: 1, padding: '14px 28px' }}
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add to Shopping Cart'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: user?.role === 'buyer' ? '380px 1fr' : '1fr',
        gap: '40px',
        alignItems: 'start'
      }}>
        {/* Write Review Form (Only for buyers) */}
        {user?.role === 'buyer' && (
          <form onSubmit={handleReviewSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="text-gradient" style={{ fontSize: '20px' }}>Leave a Review</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rating Stars</label>
              <select
                className="glass-input"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ appearance: 'none', background: 'var(--bg-dark-secondary)', padding: '10px' }}
              >
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
                <option value="2">★★☆☆☆ (2 Stars)</option>
                <option value="1">★☆☆☆☆ (1 Star)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your Feedback</label>
              <textarea
                className="glass-input"
                rows="4"
                placeholder="Share your experience with this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                style={{ resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              className="glass-button-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="text-gradient" style={{ fontSize: '20px' }}>Customer Feedback ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>No reviews have been submitted for this product yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map((rev) => (
                <div key={rev._id} style={{
                  padding: '16px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--glass-border)'
                      }}>
                        <img
                          src={rev.user?.avatar || 'https://via.placeholder.com/32'}
                          alt={rev.user?.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{rev.user?.name || 'Anonymous'}</span>
                    </div>
                    
                    <span style={{ color: 'var(--color-warning)', fontSize: '14px' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px', lineHeight: '1.5' }}>
                    {rev.comment}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    
                    {(user && (user._id === rev.user?._id || user.role === 'admin')) && (
                      <button
                        onClick={() => handleReviewDelete(rev._id)}
                        style={{ background: 'none', color: 'var(--color-error)', fontWeight: 600 }}
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;

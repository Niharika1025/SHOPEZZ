import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  // Calculate local total amount
  const calculateTotal = (items) => {
    return items.reduce((acc, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return acc + price * quantity;
    }, 0);
  };

  // Fetch Cart from Backend
  const fetchCart = async () => {
    if (!user || user.role !== 'buyer') {
      setCart({ items: [], totalAmount: 0 });
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.get('/cart');
      const cartData = data.data || data;
      setCart({
        items: cartData.items || [],
        totalAmount: calculateTotal(cartData.items || [])
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Add Item to Cart
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      throw new Error('Please login to add items to cart');
    }
    if (user.role !== 'buyer') {
      throw new Error('Only buyers can purchase items');
    }
    try {
      const { data } = await API.post('/cart/items', { productId, quantity });
      const cartData = data.data || data;
      setCart({
        items: cartData.items || [],
        totalAmount: calculateTotal(cartData.items || [])
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      const { data } = await API.put(`/cart/items/${productId}`, { quantity });
      const cartData = data.data || data;
      setCart({
        items: cartData.items || [],
        totalAmount: calculateTotal(cartData.items || [])
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    try {
      const { data } = await API.delete(`/cart/items/${productId}`);
      const cartData = data.data || data;
      setCart({
        items: cartData.items || [],
        totalAmount: calculateTotal(cartData.items || [])
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  // Clear Cart locally and backend
  const clearCart = () => {
    setCart({ items: [], totalAmount: 0 });
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.data || data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Show a temporary visual toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, toasts, showToast, markAsRead, markAllAsRead, fetchNotifications }}
    >
      {children}
      {/* Render active toasts */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        maxWidth: '350px'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-card"
            style={{
              padding: '16px 20px',
              borderLeft: `4px solid var(--color-${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'primary'})`,
              animation: 'slideIn 0.3s ease forwards',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{
                background: 'none',
                color: 'var(--text-secondary)',
                marginLeft: '12px',
                fontSize: '16px',
                lineHeight: 1
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

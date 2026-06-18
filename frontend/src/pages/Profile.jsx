import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="text-gradient">My Profile</h2>
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="glass-badge badge-success">{user.role}</span></p>
          </div>
        ) : (
          <p>Please log in to view your profile.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import DeliveriesPage from './pages/DeliveriesPage';
import TrackPage from './pages/TrackPage';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('droply_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current page state: 'auth' | 'deliveries' | 'track'
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('droply_user');
    return saved ? 'deliveries' : 'auth';
  });

  const [selectedTracking, setSelectedTracking] = useState('');

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('droply_user', JSON.stringify(userData));
    setPage('deliveries');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('droply_user');
    setSelectedTracking('');
    setPage('auth');
  };

  const handleGoToTracking = (trackingId = '') => {
    setSelectedTracking(trackingId);
    setPage('track');
  };

  const handleBackFromTracking = () => {
    if (user) {
      setPage('deliveries');
    } else {
      setPage('auth');
    }
  };

  return (
    <div className="app-root">
      {page === 'auth' && (
        <AuthPage
          onLogin={handleLogin}
          onGoToTrack={() => handleGoToTracking('')}
        />
      )}

      {page === 'deliveries' && user && (
        <DeliveriesPage
          user={user}
          onLogout={handleLogout}
          onSelectTracking={handleGoToTracking}
        />
      )}

      {page === 'track' && (
        <TrackPage
          initialTrackingNumber={selectedTracking}
          user={user}
          onBack={handleBackFromTracking}
        />
      )}
    </div>
  );
}

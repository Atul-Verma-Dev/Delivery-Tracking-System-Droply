import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function DeliveriesPage({ user, onLogout, onSelectTracking }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDeliveries(user.phone);
      setDeliveries(data.deliveries || []);
    } catch (err) {
      setError(err.message || 'Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.phone) {
      fetchDeliveries();
    }
  }, [user?.phone]);

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title || !recipientName || !recipientPhone || !destinationAddress) {
      setError('Please fill in all delivery details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createDelivery({
        senderPhone: user.phone,
        title: title.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        destinationAddress: destinationAddress.trim()
      });

      setSuccessMsg(`Package created! Tracking ID: ${res.delivery.tracking_number}`);
      // Reset form
      setTitle('');
      setRecipientName('');
      setRecipientPhone('');
      setDestinationAddress('');
      setShowCreateModal(false);
      // Reload list
      fetchDeliveries();
    } catch (err) {
      setError(err.message || 'Failed to create delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'badge-success';
      case 'In Transit':
      case 'Out for Delivery':
        return 'badge-info';
      case 'Picked Up':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="page-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">📦</span>
          <span className="brand-name">Droply</span>
        </div>
        <div className="navbar-user">
          <span className="user-pill">
            👤 {user.name} ({user.phone})
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelectTracking('')}
          >
            🔍 Track by ID
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Deliveries</h1>
            <p className="page-subtitle">Manage and dispatch shipments seamlessly</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(!showCreateModal)}
          >
            {showCreateModal ? '✕ Close Form' : '+ New Shipment'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* New Shipment Card / Form */}
        {showCreateModal && (
          <div className="create-card">
            <h2 className="card-heading">Dispatch a New Package</h2>
            <form onSubmit={handleCreateDelivery} className="create-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Package Description / Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop Charger & Mouse"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Recipient Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Samantha Ray"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Recipient Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Destination Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Skyline Towers, Sector 12"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Generating Tracking ID...' : 'Confirm & Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deliveries List */}
        {loading ? (
          <div className="loading-state">Loading your shipments...</div>
        ) : deliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📫</div>
            <h3>No shipments dispatched yet</h3>
            <p>Click "+ New Shipment" above to send your first package.</p>
          </div>
        ) : (
          <div className="deliveries-grid">
            {deliveries.map((del) => (
              <div key={del.id} className="delivery-card">
                <div className="card-top">
                  <span className="tracking-badge">
                    {del.tracking_number}
                  </span>
                  <span className={`status-badge ${getStatusClass(del.status)}`}>
                    {del.status}
                  </span>
                </div>

                <h3 className="delivery-title">{del.title}</h3>

                <div className="delivery-details">
                  <div className="detail-item">
                    <span className="detail-label">Recipient:</span>
                    <span className="detail-value">{del.recipient_name} ({del.recipient_phone})</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Destination:</span>
                    <span className="detail-value">{del.destination_address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dispatched:</span>
                    <span className="detail-value">
                      {new Date(del.created_at).toLocaleDateString()} at{' '}
                      {new Date(del.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn btn-primary btn-sm btn-full"
                    onClick={() => onSelectTracking(del.tracking_number)}
                  >
                    View Live Tracking Timeline →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { api } from '../api';

const TRACKING_STEPS = [
  { key: 'Created', label: 'Order Registered' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered', label: 'Delivered' }
];

export default function TrackPage({ initialTrackingNumber, user, onBack }) {
  const [trackingInput, setTrackingInput] = useState(initialTrackingNumber || '');
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Status updater state (for workshop demo/courier simulation)
  const [nextStatus, setNextStatus] = useState('In Transit');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTracking = async (numberToTrack) => {
    const num = (numberToTrack || trackingInput).trim();
    if (!num) {
      setError('Please enter a tracking number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.getDeliveryByTracking(num);
      setDeliveryData(res.delivery);
    } catch (err) {
      setError(err.message || 'Shipment not found. Please check tracking code.');
      setDeliveryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingNumber) {
      setTrackingInput(initialTrackingNumber);
      fetchTracking(initialTrackingNumber);
    }
  }, [initialTrackingNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(trackingInput);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!deliveryData) return;

    setUpdating(true);
    setError('');
    try {
      const res = await api.updateDeliveryStatus(
        deliveryData.tracking_number,
        nextStatus,
        location || 'Local Droply Hub',
        note || `Package marked as ${nextStatus}`
      );
      setDeliveryData(res.delivery);
      setLocation('');
      setNote('');
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = () => {
    if (deliveryData?.tracking_number) {
      navigator.clipboard.writeText(deliveryData.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine active step index
  const currentStepIndex = deliveryData
    ? TRACKING_STEPS.findIndex((s) => s.key === deliveryData.status)
    : -1;

  return (
    <div className="page-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">📦</span>
          <span className="brand-name">Droply Live Tracking</span>
        </div>
        <div className="navbar-user">
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            ← {user ? 'Back to My Deliveries' : 'Back to Login'}
          </button>
        </div>
      </header>

      {/* Main Track View */}
      <main className="main-content">
        {/* Search Bar */}
        <div className="track-search-card">
          <h2 className="search-title">Track Any Package Live</h2>
          <p className="search-subtitle">
            Enter your Droply tracking number to check real-time transit status
          </p>
          <form onSubmit={handleSearch} className="track-search-form">
            <input
              type="text"
              placeholder="e.g. DROP-106727"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="track-input"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Track Parcel'}
            </button>
          </form>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tracking Details View */}
        {deliveryData && (
          <div className="tracking-results">
            {/* Header Status Card */}
            <div className="card tracking-header-card">
              <div className="tracking-header-top">
                <div>
                  <div className="tracking-id-row">
                    <span className="tracking-id-text">{deliveryData.tracking_number}</span>
                    <button type="button" className="copy-btn" onClick={handleCopy}>
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                  <h2 className="package-title">{deliveryData.title}</h2>
                </div>
                <div className="status-pill-big">
                  Current Status: <strong>{deliveryData.status}</strong>
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div className="steps-container">
                <div className="steps-track">
                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={step.key}
                        className={`step-item ${isCompleted ? 'step-completed' : ''} ${
                          isCurrent ? 'step-current' : ''
                        }`}
                      >
                        <div className="step-circle">
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meta details */}
              <div className="tracking-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Recipient</span>
                  <span className="meta-val">{deliveryData.recipient_name}</span>
                  <span className="meta-sub">{deliveryData.recipient_phone}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Destination</span>
                  <span className="meta-val">{deliveryData.destination_address}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Sender</span>
                  <span className="meta-val">{deliveryData.sender_phone}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-val">
                    {new Date(deliveryData.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit History Timeline & Status Simulation */}
            <div className="tracking-bottom-grid">
              {/* Event History Logs */}
              <div className="card timeline-card">
                <h3 className="section-title">📍 Transit Activity Log</h3>
                <div className="timeline-list">
                  {(deliveryData.updates || []).map((update, idx) => (
                    <div key={update.id || idx} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-status">{update.status}</div>
                        <div className="timeline-location">🏢 {update.location}</div>
                        {update.note && <div className="timeline-note">{update.note}</div>}
                        <div className="timeline-date">
                          {new Date(update.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Status Updater (Simulation) */}
              <div className="card updater-card">
                <h3 className="section-title">⚡ Quick Status Updater</h3>
                <p className="updater-desc">
                  Simulate courier scanning and transit checkpoints in real time:
                </p>
                <form onSubmit={handleUpdateStatus} className="updater-form">
                  <div className="form-group">
                    <label>New Status</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                    >
                      <option value="Picked Up">Picked Up</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Current Location / Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. North Gateway Sorting Center"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Checkpoint Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Package arrived at local depot"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Push Status Update'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


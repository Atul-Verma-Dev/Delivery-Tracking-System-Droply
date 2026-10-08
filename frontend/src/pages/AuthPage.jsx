import React, { useState } from 'react';
import { api } from '../api';

export default function AuthPage({ onLogin, onGoToTrack }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(phone.trim());
      setMessage(res.message || 'OTP sent successfully!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || code.trim().length < 4) {
      setError('Please enter the OTP received.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.trim(), code.trim(), name.trim());
      setMessage('Authenticated successfully!');
      if (res.user) {
        onLogin(res.user);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-header">
          <div className="brand-badge">📦 Droply</div>
          <h1 className="brand-title">Delivery Tracking System</h1>
          <p className="brand-subtitle">
            Instant, transparent parcel dispatch & tracking
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-info">{message}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Your Name (for registration)</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Mobile Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210 or +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <span className="input-hint">
                Minimoth sends a secure OTP via WhatsApp or SMS.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>

            <div className="auth-footer-nav">
              <span>Have a tracking number?</span>
              <button
                type="button"
                className="btn-link"
                onClick={onGoToTrack}
              >
                Track package without login →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="phone-confirm-pill">
              <span>Sending code to: <strong>{phone}</strong></span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
              >
                Change
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="otp">Enter 6-digit OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP & Enter Droply'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


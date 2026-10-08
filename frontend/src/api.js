const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth endpoints (Minimoth OTP)
  sendOtp: (phone) => request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  }),

  verifyOtp: (phone, code, name) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, name })
  }),

  // Deliveries endpoints
  getDeliveries: (senderPhone) => {
    const query = senderPhone ? `?senderPhone=${encodeURIComponent(senderPhone)}` : '';
    return request(`/deliveries${query}`);
  },

  getDeliveryByTracking: (trackingNumber) => {
    return request(`/deliveries?trackingNumber=${encodeURIComponent(trackingNumber)}`);
  },

  createDelivery: (payload) => request('/deliveries', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateDeliveryStatus: (trackingNumber, status, location, note) => request(`/deliveries/${encodeURIComponent(trackingNumber)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, location, note })
  })
};


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { UserModel, DeliveryModel, TrackingUpdateModel } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to normalize phone numbers to E.164
function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

// Helper to check if using live Minimoth or dev sandbox
function isLiveMinimothKey(key) {
  return key && key !== 'your_minimoth_api_key_here' && key !== 'sandbox' && key !== 'mock' && key.trim().length > 5;
}

// -------------------------------------------------------------
// ENDPOINT 1: POST /api/auth/send-otp
// Requests OTP for user registration or login via Minimoth API
// -------------------------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Valid phone number is required.' });
    }

    const formattedPhone = normalizePhone(phone);
    const apiKey = process.env.MINIMOTH_API_KEY;

    if (isLiveMinimothKey(apiKey)) {
      // Call Minimoth API to dispatch OTP
      const resp = await fetch('https://api.minimoth.dev/v1/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey.trim()
        },
        body: JSON.stringify({ phone: formattedPhone })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status).json({
          error: data.error || 'Failed to dispatch OTP via Minimoth API.'
        });
      }

      return res.json({
        success: true,
        message: data.message || 'OTP sent successfully to your WhatsApp/SMS.'
      });
    }

    // Development sandbox mode if Minimoth API key is not yet set
    console.log(`[Droply Auth Dev Mode] OTP sent to ${formattedPhone}. Sandbox Code: 123456`);
    return res.json({
      success: true,
      message: 'Dev Sandbox: OTP sent! Use test code 123456 (or set MINIMOTH_API_KEY in .env).',
      devMode: true
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ error: 'Internal server error while sending OTP.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 2: POST /api/auth/verify-otp
// Verifies OTP code with Minimoth API and logs in / registers user
// -------------------------------------------------------------
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and 6-digit OTP code are required.' });
    }

    const formattedPhone = normalizePhone(phone);
    const apiKey = process.env.MINIMOTH_API_KEY;
    const cleanCode = String(code).trim();

    let verified = false;

    if (isLiveMinimothKey(apiKey)) {
      const resp = await fetch('https://api.minimoth.dev/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey.trim()
        },
        body: JSON.stringify({ phone: formattedPhone, code: cleanCode })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status || 400).json({
          error: data.error || 'Invalid or expired OTP code.'
        });
      }
      verified = true;
    } else {
      // Sandbox verify check
      if (cleanCode === '123456') {
        verified = true;
      } else {
        return res.status(400).json({ error: 'Invalid OTP code. In dev mode, use 123456.' });
      }
    }

    if (verified) {
      // Find or create User entity
      let user = UserModel.findByPhone(formattedPhone);
      if (!user) {
        user = UserModel.create({
          phone: formattedPhone,
          name: name ? name.trim() : 'Droply User'
        });
      }

      return res.json({
        success: true,
        message: 'Verified successfully.',
        user
      });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ error: 'Internal server error while verifying OTP.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 3: GET /api/deliveries
// List deliveries for a sender OR look up a specific tracking number
// -------------------------------------------------------------
app.get('/api/deliveries', (req, res) => {
  try {
    const { trackingNumber, senderPhone } = req.query;

    if (trackingNumber) {
      const delivery = DeliveryModel.findByTrackingNumber(trackingNumber.trim().toUpperCase());
      if (!delivery) {
        return res.status(404).json({ error: `Package with tracking number ${trackingNumber} not found.` });
      }
      const updates = TrackingUpdateModel.getByTrackingNumber(delivery.tracking_number);
      return res.json({ delivery: { ...delivery, updates } });
    }

    if (senderPhone) {
      const normalized = normalizePhone(senderPhone);
      const deliveries = DeliveryModel.findBySenderPhone(normalized);
      return res.json({ deliveries });
    }

    // Default: list all deliveries
    const deliveries = DeliveryModel.listAll();
    return res.json({ deliveries });
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    return res.status(500).json({ error: 'Failed to fetch deliveries.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 4: POST /api/deliveries
// Creates a new delivery shipment and initial tracking update
// -------------------------------------------------------------
app.post('/api/deliveries', (req, res) => {
  try {
    const { senderPhone, title, recipientName, recipientPhone, destinationAddress } = req.body;

    if (!senderPhone || !title || !recipientName || !recipientPhone || !destinationAddress) {
      return res.status(400).json({
        error: 'Missing required fields: senderPhone, title, recipientName, recipientPhone, and destinationAddress.'
      });
    }

    const normalizedSender = normalizePhone(senderPhone);
    const normalizedRecipient = normalizePhone(recipientPhone);

    const delivery = DeliveryModel.create({
      senderPhone: normalizedSender,
      title: title.trim(),
      recipientName: recipientName.trim(),
      recipientPhone: normalizedRecipient,
      destinationAddress: destinationAddress.trim()
    });

    // Record initial tracking event
    const initialUpdate = TrackingUpdateModel.create({
      deliveryId: delivery.id,
      trackingNumber: delivery.tracking_number,
      status: 'Created',
      location: 'Droply Origin Facility',
      note: 'Shipment created and registered in the Droply system.'
    });

    return res.status(201).json({
      success: true,
      delivery: {
        ...delivery,
        updates: [initialUpdate]
      }
    });
  } catch (err) {
    console.error('Error creating delivery:', err);
    return res.status(500).json({ error: 'Failed to create delivery.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 5: PATCH /api/deliveries/:trackingNumber/status
// Updates delivery status and records a tracking timeline event
// -------------------------------------------------------------
app.patch('/api/deliveries/:trackingNumber/status', (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, location, note } = req.body;

    const validStatuses = ['Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const cleanTracking = trackingNumber.trim().toUpperCase();
    const existing = DeliveryModel.findByTrackingNumber(cleanTracking);
    if (!existing) {
      return res.status(404).json({ error: `Package ${cleanTracking} not found.` });
    }

    const updated = DeliveryModel.updateStatus(cleanTracking, status);
    const updateEvent = TrackingUpdateModel.create({
      deliveryId: existing.id,
      trackingNumber: cleanTracking,
      status,
      location: location ? location.trim() : 'Droply Transit Hub',
      note: note ? note.trim() : `Package status updated to ${status}`
    });

    const allUpdates = TrackingUpdateModel.getByTrackingNumber(cleanTracking);

    return res.json({
      success: true,
      delivery: {
        ...updated,
        updates: allUpdates
      }
    });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    return res.status(500).json({ error: 'Failed to update delivery status.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Droply backend server running on http://localhost:${PORT}`);
});


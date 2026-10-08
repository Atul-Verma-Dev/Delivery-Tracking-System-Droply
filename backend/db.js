const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');

// Initialize SQLite database stored locally in backend/droply.db
const dbPath = path.join(__dirname, 'droply.db');
const db = new DatabaseSync(dbPath);

// Execute schema creation for the 3 entities: User, Delivery, TrackingUpdate
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    tracking_number TEXT UNIQUE NOT NULL,
    sender_phone TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tracking_updates (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    note TEXT,
    created_at TEXT NOT NULL
  );
`);

// Helper to generate IDs
const uid = (prefix) => `${prefix}_${crypto.randomBytes(4).toString('hex')}`;

// Entity 1: User Model
const UserModel = {
  findByPhone(phone) {
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone) || null;
  },
  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  },
  create({ phone, name }) {
    const id = uid('usr');
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, phone, name, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, phone, name || 'User', createdAt);
    return { id, phone, name: name || 'User', created_at: createdAt };
  }
};

// Entity 2: Delivery Model
const DeliveryModel = {
  create({ senderPhone, title, recipientName, recipientPhone, destinationAddress }) {
    const id = uid('del');
    // Generate clean tracking code like DROP-783921
    const trackingNumber = `DROP-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const status = 'Created';

    const stmt = db.prepare(`
      INSERT INTO deliveries (
        id, tracking_number, sender_phone, recipient_name, 
        recipient_phone, destination_address, title, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, trackingNumber, senderPhone, recipientName,
      recipientPhone, destinationAddress, title, status, now, now
    );

    return {
      id,
      tracking_number: trackingNumber,
      sender_phone: senderPhone,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      destination_address: destinationAddress,
      title,
      status,
      created_at: now,
      updated_at: now
    };
  },
  findByTrackingNumber(trackingNumber) {
    const stmt = db.prepare('SELECT * FROM deliveries WHERE tracking_number = ?');
    return stmt.get(trackingNumber) || null;
  },
  findBySenderPhone(senderPhone) {
    const stmt = db.prepare('SELECT * FROM deliveries WHERE sender_phone = ? ORDER BY created_at DESC');
    return stmt.all(senderPhone) || [];
  },
  listAll() {
    const stmt = db.prepare('SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50');
    return stmt.all() || [];
  },
  updateStatus(trackingNumber, status) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE deliveries 
      SET status = ?, updated_at = ? 
      WHERE tracking_number = ?
    `);
    stmt.run(status, now, trackingNumber);
    return this.findByTrackingNumber(trackingNumber);
  }
};

// Entity 3: TrackingUpdate Model
const TrackingUpdateModel = {
  create({ deliveryId, trackingNumber, status, location, note }) {
    const id = uid('trk');
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO tracking_updates (id, delivery_id, tracking_number, status, location, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, deliveryId, trackingNumber, status, location || 'Droply Hub', note || '', createdAt);
    return { id, delivery_id: deliveryId, tracking_number: trackingNumber, status, location, note, created_at: createdAt };
  },
  getByTrackingNumber(trackingNumber) {
    const stmt = db.prepare('SELECT * FROM tracking_updates WHERE tracking_number = ? ORDER BY created_at ASC');
    return stmt.all(trackingNumber) || [];
  }
};

module.exports = {
  UserModel,
  DeliveryModel,
  TrackingUpdateModel
};


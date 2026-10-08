# Delivery Tracking System - Droply 📦

A lightweight, GitHub-ready full-stack delivery tracking system built for a **45-minute workshop session**.

Droply demonstrates real-world logistics workflows with minimal code footprint: phone number OTP authentication via the **Minimoth API**, shipment creation, unique tracking code generation, visual delivery milestone progression, and live package status updates.

---

## ⚡ Workshop Architecture Highlights

* **Frontend:** React (Vite) — **3 pages max**
* **Backend:** Node.js (Express) — **5 REST API endpoints max**
* **Database:** SQLite (zero-config, local persistence) — **3 models max**
* **Authentication:** Passwordless OTP delivery via **Minimoth API** (WhatsApp & SMS) with built-in development sandbox fallback

---

## 📑 3 Frontend Pages

1. **Authentication Page (`AuthPage`)**: Phone number input & registration with 6-digit OTP verification powered by Minimoth API. Direct link to guest tracking.
2. **Deliveries Dashboard (`DeliveriesPage`)**: View all shipments dispatched by the user, status badges, tracking codes, and quick shipment creation form.
3. **Live Tracking Page (`TrackPage`)**: Search any tracking ID (e.g. `DROP-106727`), view the 5-step visual delivery progress bar (`Created` ➔ `Picked Up` ➔ `In Transit` ➔ `Out for Delivery` ➔ `Delivered`), audit activity log, and interactive courier status updater.

---

## 🔌 5 Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Sends WhatsApp/SMS OTP via Minimoth API |
| `POST` | `/api/auth/verify-otp` | Verifies OTP with Minimoth API and logs in/registers user |
| `GET` | `/api/deliveries` | List user's shipments (`?senderPhone=...`) or search package by ID (`?trackingNumber=...`) |
| `POST` | `/api/deliveries` | Dispatches new shipment and registers initial tracking event |
| `PATCH` | `/api/deliveries/:trackingNumber/status` | Updates package status and logs timestamped milestone event |

---

## 🗄️ 3 Database Models

1. **`User`**: `id`, `phone`, `name`, `created_at`
2. **`Delivery`**: `id`, `tracking_number`, `sender_phone`, `recipient_name`, `recipient_phone`, `destination_address`, `title`, `status`, `created_at`, `updated_at`
3. **`TrackingUpdate`**: `id`, `delivery_id`, `tracking_number`, `status`, `location`, `note`, `created_at`

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher recommended; v24 supported natively)
* **npm**

### 2. Configure Environment Variables

#### Backend Configuration:
Copy `.env.example` in `backend/` to `.env`:
```bash
cp backend/.env.example backend/.env
```
Inside [backend/.env](file:///backend/.env):
```env
PORT=5000
MINIMOTH_API_KEY=your_minimoth_api_key_here
```
> **Tip for Workshop Attendees:** 
> * If you have a [Minimoth API Key](https://minimoth.dev), paste it into `MINIMOTH_API_KEY`.
> * If you don't have a key yet or are testing offline, leave the placeholder or set it to `sandbox`. The backend will automatically activate **Sandbox Mode** where test OTP code `123456` verifies instantly.

#### Frontend Configuration:
Copy `.env.example` in `frontend/` to `.env`:
```bash
cp frontend/.env.example frontend/.env
```
Inside [frontend/.env](file:///frontend/.env):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 3. Installation & Running

#### Option A: Quick Run from Project Root
```bash
# Install dependencies
npm run install:all

# Run backend (Terminal 1)
npm run backend

# Run frontend (Terminal 2)
npm run frontend
```

#### Option B: Run Services Individually
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

* **Frontend:** Open [http://localhost:5173](http://localhost:5173) in your browser.
* **Backend:** Running at [http://localhost:5000](http://localhost:5000).

---

## 🧪 Testing the Complete Flow

1. **Sign Up / Log In:**
   * Go to [http://localhost:5173](http://localhost:5173).
   * Enter your name and 10-digit mobile number.
   * Click **Send Verification OTP**.
   * Enter your received OTP (or use sandbox OTP `123456`).
2. **Create a Delivery:**
   * Click **+ New Shipment** on the dashboard.
   * Fill in title (e.g., "Developer Starter Kit"), recipient details, and address.
   * Click **Confirm & Create Shipment**.
3. **Track Live:**
   * Click **View Live Tracking Timeline →** on your shipment card.
   * Review the 5-step progress bar and timeline log.
4. **Simulate Status Updates:**
   * In the **Quick Status Updater** on the tracking page, select the next status (e.g. `In Transit`, `Delivered`), add a location note, and click **Push Status Update**.
   * Watch the progress step light up and the transit log update immediately!

---

## 📂 Project Structure

```text
droply/
├── backend/
│   ├── .env               # Backend environment variables
│   ├── .env.example       # Example template
│   ├── db.js              # SQLite database (User, Delivery, TrackingUpdate)
│   ├── server.js          # Express app with 5 endpoints & Minimoth OTP
│   └── package.json
├── frontend/
│   ├── .env               # Frontend environment variables
│   ├── .env.example       # Example template
│   ├── index.html         # Entry HTML
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── api.js         # Minimal API client
│       ├── App.jsx        # Root component with 3-page state router
│       ├── App.css        # Clean responsive styling
│       ├── index.css      # Design tokens and reset
│       ├── main.jsx
│       └── pages/
│           ├── AuthPage.jsx        # Page 1: Minimoth OTP Login/Register
│           ├── DeliveriesPage.jsx  # Page 2: Shipments List & Creation
│           └── TrackPage.jsx       # Page 3: Live Progress Tracker & Simulator
├── package.json           # Root convenience scripts
├── .gitignore
└── README.md
```


# DeskGuard — Library Seat Booking & Anti-Hoarding App

DeskGuard is a robust, production-ready library desk occupancy management system designed to eliminate "bag-camping" and hoarding. It secures library desks in real-time, monitors student occupancy states, automatically frees abandoned desks, and provides a powerful print-ready QR check-in sheet generator for library administrators.

---

## 🚀 Key Features

*   **🔒 Secure Authentication & JWT Sessions**: Dedicated registration and login portals for Students and Librarians. Passwords are securely hashed on the backend using `bcryptjs` and session states are verified on API endpoints using JSON Web Tokens (JWT).
*   **⚡ Real-Time Map & Data Synchronization**: Integrated with **Server-Sent Events (SSE)**. Whenever a student books/releases a desk, steps away, or when a session auto-expires, the live interactive SVG map updates across all active screens instantly.
*   **🏷️ Printable QR Code Label Sheet Generator**: Librarians can generate and print professional label sheets containing desk IDs, step-by-step check-in instructions, and dynamic QR codes pointing to desk check-in links.
*   **📱 Frictionless QR Code Check-In**: Students scan desk QR codes to automatically trigger booking check-ins. URL parameters are cleaned immediately after activation to prevent refresh loops.
*   **⏳ Server-Side Anti-Hoarding Sweeper**: A background checker runs on the server every 10 seconds to release seats when students exceed away timers (20 minutes max).
*   **🔌 Supabase PostgreSQL Integration with Local JSON Fallback**: Supports seamless transition to production databases (Supabase / Postgres) via environment variables, falling back to a lightweight local JSON database for easy zero-setup local runs.

---

## 🛠️ Technology Stack

### Frontend
- **React (Vite)**: Modern fast component rendering.
- **Lucide React**: Clean developer-first modern icon packs.
- **Vanilla CSS**: Curated Zinc palette inspired by Linear and Vercel, smooth hover micro-animations, and CSS print media stylesheets.
- **React Router DOM**: Secure segment routing.

### Backend
- **Node.js & Express**: API gateway routing and SSE connection streams.
- **PostgreSQL (`pg`)**: Scalable, persistent cloud database connectivity.
- **JSON Web Tokens (`jsonwebtoken`)**: Stateless secure session tokens.
- **Bcrypt (`bcryptjs`)**: Strong password hashing algorithms.
- **Dotenv**: Centralized configuration parameters.

---

## 📁 Project Directory Layout

```
DeskGuard/
├── frontend/             # React Client Application (Vite)
│   ├── src/              # Source code
│   │   ├── pages/        # Views (StudentView, LibrarianDashboard)
│   │   ├── components/   # Interactive Library Map SVG
│   │   └── App.jsx       # Auth wrapper and SSE subscription
│   └── package.json      # Client dependencies
├── backend/              # Node.js Express Server
│   ├── server.js         # API Routing & Background Sweeper
│   ├── db.js             # Supabase / Local database client
│   └── package.json      # Server dependencies
└── README.md             # This Documentation Guide
```

---

## 💻 Local Setup & Running Instructions

### 1. Backend Server Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend development server (starts on `http://localhost:5000`):
   ```bash
   npm run dev
   ```
   *Note: Without a `DATABASE_URL` environment variable configured, the server will automatically seed and write to a local file database (`backend/deskguard_db.json`).*

### 2. Frontend Client Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite developer server (starts on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment Guide

### 🎨 Frontend Deployment (Vercel)
1. Import your GitHub repository to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add the following environment variable under settings:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com` (your deployed Render URL)
4. Trigger a **Redeploy** to build the bundle with the new endpoint.

### ⚙️ Backend Deployment (Render or Railway)
1. Deploy a new Web Service pointing to your repository.
2. Set the **Root Directory** to `backend`.
3. Set the build parameters:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following environment variables:
   - `DATABASE_URL` = `your_supabase_postgresql_connection_uri`
   - `JWT_SECRET` = `your_secure_jwt_random_key`
5. Trigger deploy! Database tables and default test credentials will seed automatically on start.

---

## 🔑 Default Test Accounts
Use these pre-seeded login credentials to test out the prototype:
*   **Chief Librarian**: `admin@library.edu` / `AdminPass123!`
*   **Test Student**: `student@university.edu` / `StudentPass123!`

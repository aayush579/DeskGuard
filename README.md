# DeskGuard — Library Seat Booking & Anti-Hoarding App

DeskGuard is a library space occupancy management solution that helps students secure desks in real time, prevents anti-hoarding behavior with automatic timeouts, and provides a powerful dashboard for library administrators.

This repository is split into two main sections:
- **`frontend/`**: The modern React client application built with Vite, Tailwind/Vanilla CSS, Lucide icons, and an interactive SVG map.
- **`backend/`**: An Express API server integrated with SQLite (using `better-sqlite3`) to handle active desk states, check-ins, away periods, and automated background clean-up tasks.

---

## 📁 Repository Structure

```
DeskGuard/
├── frontend/             # React application (Vite)
│   ├── src/              # Components, pages, assets
│   ├── index.html        # Main HTML
│   └── package.json      # Frontend dependencies
├── backend/              # Node.js Express server
│   ├── server.js         # API and background task runner
│   └── package.json      # Backend dependencies
└── README.md             # This guide
```

---

## 🚀 Local Development Setup

To run both services locally:

### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs on `http://localhost:5000`):
   ```bash
   npm run dev
   ```

### 2. Frontend App Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment Instructions

By separating the project into separate frontend and backend directories, they can be deployed independently to your preferred cloud hosts:

### 🎨 Frontend Deployment (Vercel)
The React app is built with Vite. It can be easily deployed to **Vercel** for free:
1. Go to [vercel.com](https://vercel.com/) and log in.
2. Click **Add New** -> **Project**.
3. Select your GitHub repository.
4. When configuring the project settings, set the **Root Directory** to `frontend`.
5. Click **Deploy**. Vercel will automatically build the static assets and host the application!

### ⚙️ Backend Deployment (Railway or Render)
The Express backend can be deployed to services like **Railway**, **Render**, or **Heroku**:

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app/) and sign in.
2. Create a **New Project** and choose **Deploy from GitHub repo**.
3. Select this repo.
4. In the Railway dashboard settings, set the **Root Directory** of the service to `backend`.
5. Railway will automatically build and host the Node.js project using the start command defined in `package.json`.

#### Option B: Render
1. Go to [render.com](https://render.com/) and create a free account.
2. Create a new **Web Service** and connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `npm start`.
6. Click **Create Web Service**.

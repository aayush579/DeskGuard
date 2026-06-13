# DeskGuard Prototype Information

## 🔗 Live Deployments
* **Live Web App (Vercel)**: [https://desk-guard-ten.vercel.app/](https://desk-guard-ten.vercel.app/)
* **Backend API (Render)**: [https://deskguard-backend.onrender.com](https://deskguard-backend.onrender.com) (or your configured Render URL)

---

## 🎨 User Interface Preview
We have included a prototype preview image (`deskguard_preview.png`) in this folder to show the responsive library map, active reservation cards, and librarian dashboards.

---

## 🚀 How to Run the Prototype Locally

To run the frontend and backend servers locally, follow these steps:

### 1. Run the Backend Server
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   *The server runs locally on `http://localhost:5000`.*

### 2. Run the Frontend App
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
   *The app runs locally on `http://localhost:5173`.*

---

## ⚙️ Tech Stack Summary
- **Frontend**: React, Vite, CSS Variables, Lucide Icons, React Router DOM, Interactive SVG floor plan.
- **Backend**: Node.js, Express, Cors, File-based persistent JSON Database.

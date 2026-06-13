# DeskGuard

DeskGuard is a library seat booking & anti-hoarding app. This is the frontend application built with React and Vite.

## Features
- **Student Portal**: Check into a desk, pause session ("Away"), and check out.
- **Librarian Dashboard**: Monitor all desks in real-time, spot abandoned desks, and force reset.
- **Live Map**: Real-time visual representation of desk status.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel

This frontend is perfectly configured for a seamless deployment on Vercel.

1. Push this code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect that it's a Vite project. The default settings are correct:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

Within minutes, your DeskGuard frontend will be live!

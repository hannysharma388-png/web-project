# 🚀 University Management Portal Deployment Guide

This guide will walk you through deploying your MERN stack application for **FREE** using MongoDB Atlas, Render (Backend), and Vercel (Frontend).

---

## 🏗️ Folder Structure Reminder
Your project should look like this:
```text
/root-folder
  ├── client/ (React + Vite)
  └── server/ (Node + Express)
```

---

## 1️⃣ Phase 1: Database (MongoDB Atlas)
1.  **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  **Create Cluster**: Choose the **FREE (Shared)** cluster. Pick a region near you (e.g., AWS / N. Virginia).
3.  **Security (Network Access)**:
    *   Go to **Network Access** > **Add IP Address**.
    *   Select **Allow Access From Anywhere** (0.0.0.0/0) for now. This is required for Render/Railway dynamic IPs.
4.  **Security (Database Access)**:
    *   Go to **Database Access** > **Add New Database User**.
    *   Create a user (e.g., `admin`) and set a strong password. **Write it down!**
5.  **Get Connection String**:
    *   Go to **Deployments** > **Database**.
    *   Click **Connect** > **Drivers** > **Node.js**.
    *   Copy the URL. It looks like: `mongodb+srv://admin:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
    *   Replace `<password>` with your actual password.

---

## 2️⃣ Phase 2: Backend Deployment (Render)
1.  **Create Repository**: Push your code to GitHub.
2.  **Render Dashboard**: Sign up for [Render](https://render.com/) using GitHub.
3.  **New Web Service**:
    *   Click **New +** > **Web Service**.
    *   Connect your repository.
    *   **Root Directory**: `server`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   Click **Advanced** > **Add Environment Variable**:
        *   `MONGODB_URI`: *Your Atlas connection string*
        *   `JWT_SECRET`: *Any random string*
        *   `PORT`: `10000` (Render's default)
        *   `NODE_ENV`: `production`
        *   `CLIENT_URL`: *Leave this for now (will add later)*
5.  **Deploy**: Once deployed, Render will give you a URL like `https://university-backend.onrender.com`.

---

## 3️⃣ Phase 3: Frontend Deployment (Vercel)
1.  **Vercel Dashboard**: Sign up for [Vercel](https://vercel.com/) with GitHub.
2.  **New Project**:
    *   Click **Add New** > **Project**.
    *   Connect your repository.
    *   **Root Directory**: `client`
    *   **Framework Preset**: `Vite`
3.  **Environment Variables**:
    *   Add `VITE_API_BASE_URL`: `https://university-backend.onrender.com/api` (Use YOUR Render URL).
4.  **Deploy**: Vercel will give you a URL like `https://university-portal.vercel.app`.

---

## 4️⃣ Phase 4: Final Connection (CORS Setup)
1.  Go back to **Render Dashboard** for your backend.
2.  Go to **Environment Variables**.
3.  Update (or Add) `CLIENT_URL`: `https://university-portal.vercel.app` (Use YOUR Vercel URL).
4.  Render will automatically redeploy.

---

## 🛠️ Common Troubleshooting
*   **CORS Error**: Ensure `CLIENT_URL` in Render matches your Vercel URL exactly (no trailing slash).
*   **Database Not Connecting**: Double-check the password in your MongoDB string and ensure IP Access is set to `0.0.0.0/0`.
*   **Vite Build Failed**: Ensure all dependencies are in `dependencies`, not `devDependencies` if they are needed at runtime (though Vite builds static files, so `devDependencies` are usually fine locally).

---

## 📊 Sample Data Seeding
To populate your new database with sample students and faculty:
1.  Install [MongoDB Compass](https://www.mongodb.com/products/compass) on your PC.
2.  Once you have your local `.env` pointing to your Atlas URI, run:
    ```bash
    cd server
    npm run seed
    ```

**Congratulations! Your University Portal is now live and secure.**

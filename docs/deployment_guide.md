# ShopEZ Deployment & DevOps Guide

This guide provides instructions for deploying the **ShopEZ** e-commerce marketplace to production. It explains our Docker configurations, CI/CD pipelines, and hosting setups.

---

## 1. Prerequisites & Reference Materials

Before beginning, please review the following guides:
- **Environment Setup**: Read [environment_setup.md](file:///d:/shopez/docs/environment_setup.md) to learn how to configure MongoDB Atlas, Stripe API keys, Cloudinary upload folders, and SMTP mail delivery.
- **Production Audit Checklist**: Review [production_checklist.md](file:///d:/shopez/docs/production_checklist.md) to verify that database indexes, security middleware, and rate limits are fully operational.

---

## 2. Docker Containerization Setup

We configure multi-stage Docker builds to support both **local development** and **production testing**.

### A. Local Development Mode (with Hot Reloading)
This setup mounts the source code inside the containers and uses `nodemon` (backend) and `vite` (frontend) to immediately apply code edits.
1. Copy the `.env.example` in `backend/` to `.env` and fill in your local/test credentials.
2. In the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Access:
   - Frontend Client: [http://localhost:5173](http://localhost:5173) (with HMR)
   - Backend API: [http://localhost:5000](http://localhost:5000)

### B. Production Container Setup (Immutable Image Build)
This compiles the frontend code to static assets served by an Nginx server on port 80 and runs the backend in production mode.
1. Run the production compose file:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```
2. Access:
   - Frontend Client: [http://localhost](http://localhost) (routed through Nginx)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

## 3. Production Deployment Targets

### Frontend (Vercel Hosting)
Vercel is optimal for hosting static React apps compiled with Vite.
1. Push your repository to GitHub.
2. Connect Vercel to your GitHub account and import the repository.
3. Choose the **Root Directory** as `frontend`.
4. Configure the **Build Commands**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`
5. Configure the **Environment Variables**:
   - `VITE_API_URL` = `https://your-backend-api-url.onrender.com/api`
6. Click **Deploy**. Vercel will compile and host the files, automatically handling React Router path rewrites through `frontend/vercel.json`.

### Backend (Render Hosting)
Render is an excellent option for Node.js API services.
1. Connect Render to your GitHub repository and click **New Web Service**.
2. Select your repository. Configure the following parameters:
   - **Runtime**: `Node`
   - **Root Directory**: `backend` (or leave root and configure command folders)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Enter all required environment variables listed in the environment setup guide. We recommend generating cryptographically secure values for `JWT_SECRET` and `JWT_REFRESH_SECRET` inside the Render configuration console.
4. Render will deploy and start your backend service, exposing a public HTTPS URL. Use this URL to update your Vercel `VITE_API_URL` environment parameter.

### Database (MongoDB Atlas)
Use MongoDB Atlas for hosting your production database:
1. Whitelist dynamic access IPs (`0.0.0.0/0`) on your Atlas project dashboard network settings.
2. Feed the connection URI string to the backend's environment variables (`MONGODB_URI`).
3. Deploy the backend and run the seed script:
   - In Render, you can run a shell command or execute it locally using the production database connection string to prepopulate categories, administrative accounts, and product listings.

---

## 4. CI/CD Workflows

Every pull request or push event to the `main` branch triggers the GitHub Actions pipeline defined in [.github/workflows/ci-cd.yml](file:///d:/shopez/.github/workflows/ci-cd.yml).
- **Backend Job**: Starts a MongoDB docker sidecar container, installs Node.js, installs dependencies, and runs all integration test suites.
- **Frontend Job**: Installs dependencies and verifies that Vite compiles static assets without errors.

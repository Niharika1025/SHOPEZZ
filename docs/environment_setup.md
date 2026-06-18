# ShopEZ Environment Setup Guide

This guide describes how to configure environment variables for both **local development** and **production deployments** of the ShopEZ platform.

---

## 1. Environment Variables Reference

ShopEZ requires several configuration variables. Copy `backend/.env.example` to `backend/.env` for local testing.

| Variable | Description | Required in Production | Default / Sample |
| :--- | :--- | :--- | :--- |
| `PORT` | The port on which the Express server runs. | Yes | `5000` |
| `NODE_ENV` | Running mode: `development`, `production`, or `test`. | Yes | `development` |
| `MONGODB_URI` | Connection URI string for the MongoDB instance. | Yes | `mongodb://127.0.0.1:27017/shopez` |
| `JWT_SECRET` | Secret key used to sign JWT Access Tokens. | Yes | *Cryptographically secure string* |
| `JWT_REFRESH_SECRET` | Secret key used to sign JWT Refresh Tokens. | Yes | *Cryptographically secure string* |
| `CLIENT_URL` | Root URL of the frontend client (for CORS security). | Yes | `http://localhost:5173` |
| `STRIPE_SECRET_KEY` | Private secret key retrieved from the Stripe Dashboard. | Yes | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to verify webhook signatures. | Yes | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud account name. | Yes | *Cloud name from dashboard* |
| `CLOUDINARY_API_KEY` | Cloudinary credentials access key. | Yes | *API Key from dashboard* |
| `CLOUDINARY_API_SECRET` | Cloudinary credentials access secret. | Yes | *API Secret from dashboard* |
| `EMAIL_HOST` | Host of SMTP email server (e.g. mailtrap, sendgrid, resend).| No (Falls back to Console) | `sandbox.smtp.mailtrap.io` |
| `EMAIL_PORT` | Port of SMTP email server. | No | `2525` |
| `EMAIL_USER` | Username credential for email authentication. | No | *SMTP User string* |
| `EMAIL_PASS` | Password credential for email authentication. | No | *SMTP Password string* |
| `EMAIL_FROM` | Sender address shown in transactional emails. | No | `noreply@shopez.com` |

---

## 2. Step-by-Step Integrations Configuration

### A. MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register or log in.
2. Create a new shared project cluster (Free Tier "M0" is sufficient).
3. Under **Database Access**, select **Add New Database User**. Set the password, and configure the user's role to **Read and write to any database**.
4. Under **Network Access**, choose **Add IP Address**. For production deploy, configure `0.0.0.0/0` (allow access from anywhere) because cloud host providers (like Render) dynamic allocate IP ranges.
5. Head to **Database** page, click **Connect** on your cluster, and choose **Drivers** (Node.js).
6. Copy the MONGODB connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).
7. Paste this string as your `MONGODB_URI` environment variable, making sure to replace `<username>` and `<password>` with the user credentials you created in step 3.

### B. Stripe Integration (Payments)
1. Go to the [Stripe Dashboard](https://dashboard.stripe.com) and create or log into a developer account. Ensure you are in **Test Mode** (toggle at the top right).
2. Go to the **Developers** -> **API keys** tab.
3. Copy the **Secret key** (starts with `sk_test_...`) and save it to `STRIPE_SECRET_KEY`.
4. To listen to checkout success events in real-time, configure a webhook:
   - **Local testing**: Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), log in, and run:
     ```bash
     stripe listen --forward-to localhost:5000/api/orders/webhook
     ```
     Copy the webhook signing secret from the terminal (starts with `whsec_...`) and save it to `STRIPE_WEBHOOK_SECRET`.
   - **Production deployment**: Go to the **Webhooks** page in your Stripe dashboard, click **Add endpoint**, set the URL to `https://your-backend-domain.com/api/orders/webhook`, and select the `checkout.session.completed` event. Copy the signing secret from the dashboard and set it as `STRIPE_WEBHOOK_SECRET` in your hosting console.

### C. Cloudinary Integration (Image Uploads)
1. Log into [Cloudinary](https://cloudinary.com) (or register for a free account).
2. From your main dashboard console, retrieve the following parameters:
   - **Cloud Name** -> set as `CLOUDINARY_CLOUD_NAME`
   - **API Key** -> set as `CLOUDINARY_API_KEY`
   - **API Secret** -> set as `CLOUDINARY_API_SECRET`
3. The backend uploads images securely using Mongoose/Multer memory streams directly to Cloudinary. It automatically resizes and compresses them for page loading speed optimization.

### D. SMTP Nodemailer (Transaction Email Alerts)
1. ShopEZ features pre-configured HTML templates for buyer registrations, invoice order confirmations, and shipping updates.
2. For testing, create a free account on [Mailtrap](https://mailtrap.io). In the **Email Testing** menu, copy your SMTP settings and fill in `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS`.
3. In production, configure an active mail delivery provider like SendGrid, Amazon SES, or Resend.
4. **Development Fallback**: If `EMAIL_USER` or `EMAIL_PASS` is not defined in the `.env` variables, the backend will print the HTML content directly to the console terminal to prevent checkout process failure.

---

## 3. Local Development Startup Example

1. Copy `.env.example` in `backend/` to `.env`.
2. Generate secure JWT secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Assign values to `JWT_SECRET` and `JWT_REFRESH_SECRET`.
4. Save the file.
5. In the `frontend/` directory, create a `.env` file with:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

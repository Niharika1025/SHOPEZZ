# ShopEZ Production Readiness Checklist

This checklist acts as a final audit check before deploying the ShopEZ marketplace to production web servers.

---

## 1. Security Checklist

- [x] **Helmet Headers Active**: Helmet middleware is initialized globally on the backend app to prevent standard clickjacking, XSS, and MIME-type sniffing.
- [x] **NoSQL Injection Block**: `express-mongo-sanitize` is configured to automatically strip query selectors containing `$` and `.` characters.
- [x] **CORS Origin Check**: CORS is configured with strict origin restrictions on production. The `CLIENT_URL` is mapped to prevent unauthorized external cross-domain calls.
- [x] **API Rate Limits**:
  - Global endpoints: Limited to 100 requests per 15 minutes.
  - Auth endpoints (`/api/auth/login`, `/api/auth/register`): Limited to 20 attempts per 15 minutes to block brute-force password scanning.
- [x] **JWT Token Encryption**: Cryptographically secure keys are generated and stored inside environment variables. Access tokens have short lifespans (15 mins), and refresh tokens are securely stored in HTTP-Only, Secure, SameSite cookies.
- [x] **Stripe Webhook Signature Verification**: Webhook payloads are verified against the Stripe signing key before processing checkout success state. The raw request body is captured to ensure signature accuracy.
- [x] **Role-Based Routing Protection**: RBAC routing middleware is implemented. Operations like moderation, adding products, and reading administrative logs require authenticated Admin/Seller validation.

---

## 2. Performance & Database Tuning

- [x] **Category Slug Indexing**: `Category.slug` is configured as a unique index to support rapid category filtering.
- [x] **Product Lookups Indexing**: `Product.name`, `Product.category`, and `Product.seller` fields are indexed to support text queries and aggregations.
- [x] **Order Trail Indexing**: `Order.buyer` and `Order.paymentIntentId` are indexed to speed up user history queries and webhook lookup matching.
- [x] **User Email Indexing**: `User.email` is marked as unique, creating a B-Tree index to perform fast login credentials matching.
- [x] **Review Compound Indexing**: Reviews have a unique compound index: `{ product: 1, user: 1 }` to prevent buyers from writing multiple reviews on the same listing.
- [x] **Media Asset Optimization**: Image streams to Cloudinary use automatic image quality compression and cropping (`limit` to 800x800 size) to reduce page loading latency.

---

## 3. DevOps & Deployment Verification

- [x] **Multi-Stage Containerization**: Dockerfiles decouple development environments (volume mapped, nodemon live reloaded) from production builds (static assets served by Nginx, backend runs single-process node server).
- [x] **CI/CD Pipeline Success**: GitHub Actions pipeline runs automated lint, backend test suites with MongoDB container service, and frontend static assets compilation.
- [x] **Transactional Email Fallback**: Nodemailer fails gracefully to terminal console writing if SMTP keys are absent, preventing transactional workflow blockages in testing.
- [x] **Environment Key Validation**: Environment configuration matches exactly between `.env.example` records and local configurations.

---

## 4. Final Deployment Steps

1. Configure Cluster database inside **MongoDB Atlas**. Whitelist dyn IP range.
2. Spin up backend API server on **Render**. Feed database and auth key secrets.
3. Hook Webhook endpoints on **Stripe Dashboard** linking to backend URL.
4. Deploy frontend package on **Vercel** with `VITE_API_URL` pointing to Render API.
5. Seed database using the command line tool `npm run seed`.

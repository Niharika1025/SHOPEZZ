# ShopEZ E-Commerce Marketplace

ShopEZ is a production-grade, full-stack e-commerce marketplace. It is designed to offer a premium, modern user experience using a responsive, dark glassmorphism design.

The platform provides dedicated workflows for three primary user roles:
1. **Buyers**: Browse products with advanced filters, manage shopping carts, complete purchases securely via Stripe, write reviews, and track order histories.
2. **Sellers**: Add and edit product listings with Cloudinary-optimized image uploads, track inventory levels, process orders, and view sales metrics with interactive revenue charts.
3. **Administrators**: Moderate product listings (approve/reject), manage user accounts (suspend/activate), inspect global sales metrics, and review system-wide audit logs.

---

## 🗺️ Project Structure

```
shopez/
├── backend/                  # Node.js / Express API Service
│   ├── src/
│   │   ├── config/           # Database, Stripe, and Cloudinary setups
│   │   ├── controllers/      # Route controllers (MVC pattern logic)
│   │   ├── middleware/       # JWT auth, RBAC, input validators, security filters
│   │   ├── models/           # Mongoose schemas (User, Product, Cart, Order, etc.)
│   │   ├── routes/           # Express routers
│   │   └── utils/            # Transactional emails, logger, seeding scripts
│   ├── tests/                # Jest & Supertest API integration tests
│   ├── Dockerfile            # Multi-stage backend Docker setup
│   └── package.json
│
├── frontend/                 # Vite / React Client Application
│   ├── src/
│   │   ├── components/       # Common UI elements (Navbar, Toast, GlassCard, etc.)
│   │   ├── context/          # State providers (Auth, Cart, Toast notifications)
│   │   ├── pages/            # View pages (Marketplace, detail views, dashboards)
│   │   ├── styles/           # Global theme variables, animations, and typography
│   │   └── App.jsx           # Main routing entrypoint
│   ├── Dockerfile            # Multi-stage frontend Docker & Nginx setup
│   ├── nginx.conf            # Nginx config for client path fallback routing
│   └── package.json
│
├── docs/                     # Guides and Documentation
│   ├── deployment_guide.md   # Setup Render, Vercel, and Docker guides
│   ├── environment_setup.md  # Detailed third-party integrations credentials guide
│   ├── production_checklist.md # Security audit and database indexing checklist
│   ├── api_guide.md          # REST API endpoints & payload documentations
│   ├── admin_guide.md        # Administrator dashboard control guide
│   ├── seller_guide.md       # Inventory and analytics dashboard manual
│   └── user_guide.md         # Buyer catalog & checkout walkthrough
│
├── docker-compose.yml        # Development Docker boot composition
├── docker-compose.prod.yml   # Production Nginx/API Docker boot composition
└── render.yaml               # Render configuration blueprints
```

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router (v7), Context API, Axios, Recharts, CSS Custom Properties (Glassmorphic Theme).
- **Backend**: Node.js, Express.js, JWT Authentication (HTTP-Only Refresh Cookie + Memory Access Tokens), Joi (Input validation), Winston/Morgan.
- **Database**: MongoDB Atlas, Mongoose ODM (Indexes, pre-save/post-remove recalculation hooks).
- **Integrations**: Stripe Payments (Checkout sessions + webhook listeners), Cloudinary (Image uploads + scale auto-crop), Nodemailer (HTML emails with console fallback).
- **Security**: Helmet, Express Mongo Sanitize, rate limiters, bcryptjs (12 rounds).
- **Testing**: Jest, Supertest.
- **DevOps**: Docker, Nginx, GitHub Actions, Vercel, Render.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- MongoDB running locally or a MongoDB Atlas Cluster URL

### Option A: Manual Setup (Local Node Server)

#### 1. Setup Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required credentials.
4. Run the database seed script to set up default categories and testing accounts:
   ```bash
   npm run seed
   ```
5. Start the development server (runs with nodemon):
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`.

#### 2. Setup Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create a `.env` file and set the backend API path:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The client application will run at `http://localhost:5173`.

---

### Option B: Docker Orchestration Startup

#### 1. Development Mode (with Hot Reloading & Volume Mounts)
To start development containers that apply local source changes instantly:
1. Complete your `backend/.env` file.
2. From the project root, run:
   ```bash
   docker-compose up --build
   ```
   - Frontend Client: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

#### 2. Production Mode (Served via Nginx)
To build production-ready images where the frontend is served via Nginx:
1. From the project root, run:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```
   - Frontend Client: [http://localhost](http://localhost) (Port 80)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Testing

We provide full backend integration coverage for authentication, product management, reviews, shopping carts, orders, and Stripe checkout:
1. Navigate to the `backend/` directory.
2. Run the test suite:
   ```bash
   npm run test
   ```

---

## 👤 Seeding & Test Credentials

The database seeder generates accounts for each role (with password `admin123` for administrative accounts and `seller123` / `buyer123` for others):

| Role | Username / Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shopez.com` | `admin123` | Platform oversight, product moderation, user bans, log review |
| **Seller 1** | `seller@shopez.com` | `seller123` | Store catalog creation, inventory editing, sales tracking |
| **Seller 2** | `seller2@shopez.com` | `seller123` | Additional store inventory testing |
| **Buyer 1** | `buyer@shopez.com` | `buyer123` | Checkout sessions, reviews writing, product purchases |
| **Buyer 2** | `buyer2@shopez.com` | `buyer123` | Multi-user checkout & reviews tests |

---

## 📄 Documentation Links

- [Deployment Guide](file:///d:/shopez/docs/deployment_guide.md)
- [Environment Configurations Guide](file:///d:/shopez/docs/environment_setup.md)
- [Production Readiness Audit Checklist](file:///d:/shopez/docs/production_checklist.md)
- [Backend REST API Specifications](file:///d:/shopez/docs/api_guide.md)
- [Administrator Operations Manual](file:///d:/shopez/docs/admin_guide.md)
- [Seller Management Manual](file:///d:/shopez/docs/seller_guide.md)
- [Buyer Platform Guide](file:///d:/shopez/docs/user_guide.md)

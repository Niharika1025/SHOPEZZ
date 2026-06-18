# ShopEZ Administrative Guide

This guide details the operations and dashboard options available to ShopEZ administrators.

---

## 1. Entering the Admin Panel

To log in as an Admin:
1. Access the login screen at `/login`.
2. Input admin credentials (e.g. `admin@shopez.com` / `password123`).
3. Upon authentication, you will be redirected to the **Admin Dashboard** (`/admin-dashboard`).

---

## 2. Admin Operations & Tabs

The dashboard is structured into four main operational tabs:

### A. Overview Dashboard
- **Platform Analytics**: Monitor overall platform transaction volume (in USD), total order counts, total user base (broken down by Buyer, Seller, and Admin roles), and total product listings (Approved vs Pending vs Rejected).
- **Recent Activities Feed**: Quick list of the latest system operations logged.

### B. User Management
- **Audit Users**: View a complete table of registered users.
- **Suspend Users**: Click the **Suspend** action next to any buyer or seller account to block their access. Suspended users will be immediately logged out, denied access tokens on refresh requests, and blocked from logging in with a `403 Forbidden` error.
- **Activate Users**: Click **Activate** on any suspended user to restore access immediately.

### C. Product Listing Moderation
- **Moderate Products**: Review the product list showing prices, stock levels, and status.
- **Approve Listings**: Approve listings to make them instantly visible in the public buyer catalog.
- **Reject Listings**: Reject listings to hide them from search results and catalogs.

### D. Security Audit Logs
- **System Activity Tracking**: Review the audit log table tracking administrative actions (e.g. logins, registrations, profile edits, product approvals, user suspensions) along with details, IP addresses, and timestamps.
- **Log Permanence**: These entries are written directly to MongoDB Atlas and are immutable for record-keeping.

# ShopEZ Seller Operations Guide

This guide describes how to manage your store, upload listings, track stock levels, and fulfill orders as a ShopEZ seller.

---

## 1. Entering the Seller Panel

To register and log in as a Seller:
1. Go to `/register` and choose **Seller** from the role dropdown.
2. Log in using your email and password at `/login`.
3. You will be redirected to the **Seller Dashboard** (`/seller-dashboard`).

---

## 2. Store Management Features

### A. Sales Analytics & Trends
- **Store Metrics**: Track your Total Revenue, Orders Received, Units Sold, and Out of Stock alerts.
- **Sales Trends Chart**: Recharts visualization mapping date-grouped sales values over the last 30 days.

### B. Product Inventory Management
- **Add Product Listing**: Click **+ Add New Product**. You can choose name, description, price, stock, category, and pick an image file from your device. The image is uploaded directly to Cloudinary.
- **Edit Listing**: Click **Edit** to modify names, descriptions, pricing, and stock levels.
- **Delete Listing**: Click **Delete** to permanently remove listings from the marketplace.

### C. Fulfilling Orders
- **Order Tracking**: Review the "Manage Store Orders" table to see orders containing your products.
- **Update Shipping Status**: When an order is placed, it is in `pending` status. You can update it to:
  - `processing` (when preparing to ship)
  - `shipped` (when dispatched, triggers buyer notification and status update email)
  - `delivered` (when delivered)
  - `cancelled`

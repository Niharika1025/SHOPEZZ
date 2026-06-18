# ShopEZ API Reference Guide

This document lists the REST API endpoints, roles restrictions, payloads, and response payloads for the ShopEZ backend services.

---

## Base URL
All API routes are prefixed with `/api`.

---

## 1. Authentication & Users

### Register User
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "buyer" // or "seller"
  }
  ```
* **Response (201 Created)**: Returns `accessToken` and `user` object. Sets `refreshToken` cookie.

### Login User
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
* **Response (200 OK)**: Returns `accessToken` and `user` object. Sets `refreshToken` cookie.

### Logout User
* **URL**: `/api/auth/logout`
* **Method**: `POST`
* **Access**: Private

---

## 2. Product Catalog

### Get Products
* **URL**: `/api/products`
* **Method**: `GET`
* **Access**: Public
* **Query Parameters**: `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `sort`, `page`, `limit`.

### Get Product details
* **URL**: `/api/products/:id`
* **Method**: `GET`
* **Access**: Public

### Create Product Listing
* **URL**: `/api/products`
* **Method**: `POST`
* **Access**: Private (Seller only)
* **Payload**:
  ```json
  {
    "name": "Product Name",
    "description": "Product Description Details",
    "price": 99.99,
    "category": "category_id_string",
    "stock": 10,
    "images": ["https://cloudinary-url.com/image.jpg"]
  }
  ```

---

## 3. Cart Management

### Get Cart
* **URL**: `/api/cart`
* **Method**: `GET`
* **Access**: Private (Buyer only)

### Add / Update Item
* **URL**: `/api/cart/items`
* **Method**: `POST`
* **Access**: Private (Buyer only)
* **Payload**: `{ "productId": "id", "quantity": 2 }`

---

## 4. Checkout & Orders

### Create Checkout Session
* **URL**: `/api/orders/checkout-session`
* **Method**: `POST`
* **Access**: Private (Buyer only)
* **Payload**:
  ```json
  {
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Tech City",
      "state": "California",
      "zipCode": "90210",
      "country": "USA"
    }
  }
  ```
* **Response (200 OK)**: Returns `{ url: "stripe_checkout_url", sessionId: "cs_..." }`

### Stripe Webhook Receiver
* **URL**: `/api/orders/webhook`
* **Method**: `POST`
* **Access**: Public (Called by Stripe servers)

---

## 5. Media Uploads

### Upload Single Image
* **URL**: `/api/upload/single`
* **Method**: `POST`
* **Access**: Private (Seller/Admin only)
* **Payload**: Form data with key `image` holding file buffer.
* **Response (200 OK)**: `{ "status": "success", "data": { "url": "url", "publicId": "id" } }`

---

## 6. Admin Controls

### Toggle User Status
* **URL**: `/api/admin/users/:id/status`
* **Method**: `PUT`
* **Access**: Private (Admin only)
* **Payload**: `{ "status": "suspended" }` // or "active"

### Toggle Product Moderation status
* **URL**: `/api/admin/products/:id/status`
* **Method**: `PUT`
* **Access**: Private (Admin only)
* **Payload**: `{ "status": "rejected" }` // or "approved"

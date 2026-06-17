# LUXE — Full-Stack Clothing E-Commerce

A complete clothing store built with **Next.js** (storefront), **Express + MongoDB** (REST API), JWT **authentication**, and **Stripe + Cash-on-Delivery** checkout.

![stack](https://img.shields.io/badge/stack-Next.js%20%C2%B7%20Express%20%C2%B7%20MongoDB%20%C2%B7%20Stripe-1a1a1a)

## Features

- Curated clothing catalog (Men, Women, Accessories, Footwear) with real product photography
- Search, category filter, sort, and a featured collection on the home page
- Product detail pages with size/quantity selection
- Persistent shopping cart (survives refresh)
- JWT auth: register, login, logout, protected routes
- **Guest checkout** — place an order with just an email, no account required
- **Voucher / coupon codes** with expiry, minimum-order and usage limits (percentage or fixed amount), managed from the admin panel — signed-in users only, redeemable once per user
- Multiple payment methods: **Stripe card payments**, **JazzCash / Easypaisa / bank transfer** (manual), and **Cash on Delivery**
- Stripe orders are created **only after payment is confirmed** (amount verified server-side against the PaymentIntent)
- **Order emails** — confirmation to the customer and a notification to the admin on every order (via SMTP / Resend)
- Server-side price recalculation (cart totals can't be tampered with)
- Order history and order detail pages
- **Admin dashboard**: revenue/order stats, product CRUD, order status management, manual payment confirmation
- Seed script with 16 products + demo admin/customer accounts

## Tech Stack

| Layer     | Tech                                              |
|-----------|---------------------------------------------------|
| Frontend  | Next.js 14 (App Router), React 18, Tailwind CSS   |
| Backend   | Node.js, Express 4, Mongoose 8                     |
| Database  | MongoDB                                            |
| Auth      | JWT (httpOnly cookie + Bearer token), bcrypt       |
| Payments  | Stripe PaymentIntents + Cash on Delivery          |

## Project Structure

```
luxe-ecommerce/
├── backend/                 # Express + MongoDB API
│   ├── config/db.js
│   ├── models/              # User, Product, Order
│   ├── controllers/         # auth, product, order, payment
│   ├── middleware/          # auth (JWT), error handling
│   ├── routes/
│   ├── seed/seedProducts.js
│   └── server.js
└── frontend/                # Next.js storefront
    ├── app/                 # home, products, cart, checkout, login, orders
    ├── components/          # Navbar, Footer, ProductCard
    ├── context/             # AuthContext, CartContext
    └── lib/                 # api client, formatting
```

## Prerequisites

- Node.js 18+
- A running MongoDB (local `mongod`, or a free MongoDB Atlas cluster)
- A Stripe account (test mode) for card payments — optional; COD works without it

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit values
npm run seed                  # loads products + demo accounts
npm run dev                   # http://localhost:5000
```

`.env` values:

```
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/luxe
JWT_SECRET=<long random string>
STRIPE_SECRET_KEY=sk_test_...      # from dashboard.stripe.com/test/apikeys
STRIPE_CURRENCY=usd
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then edit values
npm run dev                        # http://localhost:3000
```

`.env.local` values:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Demo Accounts (created by the seed script)

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Admin    | admin@luxe.test     | admin123    |
| Customer | customer@luxe.test  | customer123 |

## Testing Payments

Use Stripe's test card at checkout:

- **Card:** `4242 4242 4242 4242`
- **Expiry:** any future date · **CVC:** any 3 digits · **ZIP:** any

Or choose **JazzCash / Easypaisa / Bank Transfer** (manual) or **Cash on Delivery** to place an order with no card.

## How payment works

- **Stripe:** at checkout the server computes the amount and creates a Stripe PaymentIntent (no order yet). The customer pays; only after the payment **succeeds** does the client create the order, and the server verifies the PaymentIntent is `succeeded` and its amount matches the order total before saving. So no unpaid Stripe orders are ever created, and the amount can't be tampered with.
- **JazzCash / Easypaisa / Bank transfer:** the customer transfers to your configured account and enters their transaction ID. The order is placed *pending*; an admin verifies the transfer and clicks **Mark as paid**.
- **Cash on Delivery:** order placed immediately; paid on delivery.

## Admin Dashboard

Sign in as the admin demo account (`admin@luxe.test / admin123`) and an **Admin** link appears in the navbar, or go to `/admin` directly. Non-admins are redirected away.

- `/admin` — revenue, order counts and recent orders
- `/admin/products` — list, create, edit and delete products
- `/admin/orders` — view all orders and change their status (Pending → Processing → Shipped → Delivered → Cancelled). Marking a COD order *Delivered* also marks it paid.

## API Overview

| Method | Endpoint                     | Auth   | Purpose                        |
|--------|------------------------------|--------|--------------------------------|
| POST   | `/api/auth/register`         | —      | Create account                 |
| POST   | `/api/auth/login`            | —      | Log in                         |
| GET    | `/api/auth/me`               | user   | Current user                   |
| GET    | `/api/products`              | —      | List/search/filter/sort        |
| GET    | `/api/products/featured`     | —      | Featured products              |
| GET    | `/api/products/:id`          | —      | Product detail                 |
| POST   | `/api/products`              | admin  | Create product                 |
| POST   | `/api/orders`                | optional | Create order (Stripe: verifies payment first) |
| GET    | `/api/orders/mine`           | user   | My orders                      |
| GET    | `/api/orders/:id`            | optional | Order detail (guest-friendly)|
| GET    | `/api/orders`                | admin  | All orders                     |
| PUT    | `/api/orders/:id/status`     | admin  | Update order status            |
| PUT    | `/api/orders/:id/confirm-payment` | admin | Mark a manual transfer paid |
| GET    | `/api/orders/admin/stats`    | admin  | Revenue & order stats          |
| POST   | `/api/payment/create-intent` | optional | Stripe PaymentIntent from cart |
| POST   | `/api/vouchers/validate`     | user   | Validate a voucher code        |

## Deployment

The app is deployed on **Vercel** (frontend + serverless API) with **MongoDB Atlas** — see **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** for the full no-credit-card walkthrough. A `render.yaml` blueprint and **[DEPLOYMENT.md](./DEPLOYMENT.md)** are also included as an alternative Render-based path.

## Notes

- Product images are served from Unsplash via URL; a built-in SVG fallback renders if any image fails to load.
- Order totals (items, shipping, tax) are always recomputed on the server from the database to prevent client tampering.
- This is a demo/portfolio project. Before production, consider: a Stripe webhook as a fallback to reconcile payments where the client drops out after paying, rate limiting, stronger input validation, and HTTPS.
```

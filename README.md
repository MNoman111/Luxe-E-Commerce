# LUXE — Full-Stack Clothing E-Commerce

A complete clothing store built with **Next.js** (storefront), **Express + MongoDB** (REST API), JWT **authentication**, and **Stripe + Cash-on-Delivery** checkout.

![stack](https://img.shields.io/badge/stack-Next.js%20%C2%B7%20Express%20%C2%B7%20MongoDB%20%C2%B7%20Stripe-1a1a1a)

## Features

- Curated clothing catalog (Men, Women, Accessories, Footwear) with real product photography
- Search, category filter, sort, and a featured collection on the home page
- Product detail pages with size/quantity selection
- Persistent shopping cart (survives refresh)
- JWT auth: register, login, logout, protected routes
- Checkout with **Stripe card payments** *and* **Cash on Delivery**
- Server-side price recalculation (cart totals can't be tampered with)
- Order history and order detail pages
- **Stripe webhook** that confirms payments server-side (the source of truth)
- **Admin dashboard**: revenue/order stats, product CRUD, order status management
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

Or choose **Cash on Delivery** to place an order with no card required.

## Stripe Webhook (server-side confirmation)

The order is marked **paid by a verified Stripe webhook**, not by the browser — so a manipulated client can never fake a payment. To receive events locally, use the Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/payment/webhook
```

The CLI prints a signing secret (`whsec_...`); put it in the backend `.env` as `STRIPE_WEBHOOK_SECRET`. The webhook listens for `payment_intent.succeeded`. In production, register `https://your-api/api/payment/webhook` in the Stripe Dashboard instead. (If no secret is set, the endpoint still works in dev but skips signature verification.)

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
| POST   | `/api/orders`                | user   | Create order (totals on server)|
| GET    | `/api/orders/mine`           | user   | My orders                      |
| GET    | `/api/orders/:id`            | user   | Order detail                   |
| PUT    | `/api/orders/:id/pay`        | user   | Mark paid after Stripe         |
| GET    | `/api/orders`                | admin  | All orders                     |
| PUT    | `/api/orders/:id/status`     | admin  | Update order status            |
| GET    | `/api/orders/admin/stats`    | admin  | Revenue & order stats          |
| POST   | `/api/payment/create-intent` | user   | Stripe PaymentIntent           |
| POST   | `/api/payment/webhook`       | Stripe | Verified payment confirmation  |

## Deployment

The repo includes a `render.yaml` blueprint that deploys both services to **Render** (free tier) with **MongoDB Atlas** as the database. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide (Atlas setup, GitHub push, Render blueprint, env vars, Stripe webhook, and seeding production).

## Notes

- Product images are served from Unsplash via URL; a built-in SVG fallback renders if any image fails to load.
- Order totals (items, shipping, tax) are always recomputed on the server from the database to prevent client tampering.
- This is a demo/portfolio project. Before production: add a Stripe webhook to confirm payments, rate limiting, input validation hardening, and HTTPS.
```

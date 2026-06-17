# Deploying LUXE (Render + MongoDB Atlas)

This guide takes you from local code to a public, live store in about 15–20 minutes on **free tiers**. You provision everything under your own accounts — that part can't be automated for you.

What you'll create:

- a **MongoDB Atlas** free cluster (the database)
- a **GitHub** repo (Render deploys from it)
- two **Render** web services from the included `render.yaml`: `luxe-api` (Express) and `luxe-web` (Next.js)
- **Stripe** test API keys for card payments

---

## 0. Prerequisites

- Free accounts: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), [Render](https://render.com), [GitHub](https://github.com), [Stripe](https://dashboard.stripe.com/register)
- Git installed locally, and Node 18+ (only needed to seed the database once)

---

## 1. Create the MongoDB Atlas database

1. In Atlas, **Build a Database → M0 (Free)**, pick a cloud/region, create the cluster.
2. **Database Access → Add New Database User**: create a username + password (save them).
3. **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`). Render's IPs are dynamic on the free plan, so this is the simplest option.
4. **Database → Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert your password and add a database name (`luxe`) before the `?`:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/luxe?retryWrites=true&w=majority
   ```
   Keep this string — it's your `MONGO_URI`.

---

## 2. Push the code to GitHub

From the `luxe-ecommerce` folder:

```bash
git init
git add .
git commit -m "LUXE e-commerce"
git branch -M main
git remote add origin https://github.com/<you>/luxe-ecommerce.git
git push -u origin main
```

> `render.yaml` lives at the repo root and references `rootDir: backend` and `rootDir: frontend`, so keep both folders in the same repo. The `.gitignore` files already exclude `node_modules`, `.env`, and `.next`.

---

## 3. Deploy both services on Render (Blueprint)

1. Render Dashboard → **New → Blueprint**.
2. Connect your GitHub account and select the `luxe-ecommerce` repo.
3. Render reads `render.yaml` and shows two services: **luxe-api** and **luxe-web**. Click **Apply**.
4. The first build will start. It will pause for the env vars marked "sync: false" — set them in step 4. `JWT_SECRET` is generated automatically.

---

## 4. Set environment variables

In each service's **Environment** tab:

**luxe-api**

| Key | Value |
|-----|-------|
| `MONGO_URI` | your Atlas string from step 1 |
| `STRIPE_SECRET_KEY` | `sk_test_...` (from Stripe → Developers → API keys) |
| `STRIPE_CURRENCY` | `usd` |
| `CLIENT_URL` | *(fill after first deploy — your luxe-web URL)* |

**luxe-web**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://luxe-api.onrender.com/api` *(use your actual api URL)* |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

> **Order matters.** After the services deploy you'll know their real URLs (e.g. `https://luxe-api-abcd.onrender.com`). Go back and set `CLIENT_URL` on the API to the web URL, and `NEXT_PUBLIC_API_URL` on the web to `https://<api-url>/api`, then trigger a redeploy of each (the web one **must** rebuild because `NEXT_PUBLIC_*` values are baked in at build time).

---

## 5. Seed the production database (once)

Run the seed script locally, pointed at Atlas, to load the 16 products and demo accounts:

```bash
cd backend
npm install
MONGO_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/luxe?retryWrites=true&w=majority" npm run seed
```

This creates the catalog plus `admin@luxe.test / admin123` and `customer@luxe.test / customer123`.
**Change or delete the demo admin password before sharing the site publicly.**

---

## 6. Go live & test

Open your `luxe-web` URL and verify:

- products load on the home page (confirms web → api → Atlas all connect)
- register / login works
- add to cart → checkout with test card `4242 4242 4242 4242` (any future date/CVC)
- the order is created and shows **Paid** (Stripe orders are only created after payment succeeds)
- sign in as the admin and open `/admin` to manage products and orders

---

## Notes & gotchas

- **Free-tier cold starts:** Render free services sleep after ~15 min idle; the first request then takes ~30–50s. Upgrade to a paid instance to keep services warm.
- **Changing `NEXT_PUBLIC_API_URL` later** requires a frontend **rebuild**, not just a restart, because Next.js inlines public env vars at build time.
- **Going from test to live payments:** swap `sk_test_`/`pk_test_` for `sk_live_`/`pk_live_`.
- **Custom domain:** add it under each Render service's **Settings → Custom Domains**, then update `CLIENT_URL` / `NEXT_PUBLIC_API_URL` accordingly and redeploy.
- **Security before real public use:** rotate/disable the seeded demo accounts, keep `0.0.0.0/0` only if acceptable (or restrict to Render egress IPs on a paid plan), and consider adding rate limiting and request validation.

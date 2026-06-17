# Deploying LUXE on Vercel (no credit card)

This deploys the whole app with **no payment method anywhere**: Next.js storefront and Express API both on **Vercel Hobby** (free, no card), data on **MongoDB Atlas** (free), payments via **Stripe test mode** (free).

You create **two Vercel projects from the same GitHub repo** — one for `frontend/`, one for `backend/`.

> Prerequisites already done: code on GitHub, Atlas connection string (`MONGO_URI`), Stripe test keys (`pk_test_…`, `sk_test_…`).

---

## 1. Create the Vercel account

Go to [vercel.com/signup](https://vercel.com/signup) and **Continue with GitHub**. Authorize Vercel. The Hobby plan is selected automatically — no card requested.

---

## 2. Deploy the BACKEND project (Express API)

1. Vercel dashboard → **Add New… → Project**.
2. Find your **`luxe-ecommerce`** repo → **Import**. (If it's not listed, click **Adjust GitHub App Permissions** and grant access.)
3. **IMPORTANT — set the Root Directory:** click **Edit** next to "Root Directory" and choose **`backend`**. This tells Vercel to deploy only the API.
4. **Framework Preset:** Vercel auto-detects **Express** (the backend default-exports the app from `app.js`, so it deploys as one serverless function with **no `vercel.json` needed**). If it shows "Other", that's fine too — leave build/output settings at their defaults.
5. Expand **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | any long random string (e.g. mash the keyboard 40+ chars) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `STRIPE_SECRET_KEY` | your `sk_test_…` |
   | `STRIPE_CURRENCY` | `usd` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://luxe-web.vercel.app` *(placeholder — fix in step 4)* |

6. Click **Deploy**. When it finishes, open the project's domain (e.g. `https://luxe-ecommerce-backend.vercel.app`). Visiting it should show `{"status":"ok","service":"LUXE API"}`. **Copy this backend URL.**

---

## 3. Deploy the FRONTEND project (Next.js)

1. Dashboard → **Add New… → Project** → import the **same `luxe-ecommerce`** repo again.
2. **Set Root Directory to `frontend`.** Vercel auto-detects **Next.js** — leave the build settings as detected.
3. Add Environment Variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_API_URL` | your backend URL from step 2 **+ `/api`** → e.g. `https://luxe-ecommerce-backend.vercel.app/api` |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | your `pk_test_…` |

4. Click **Deploy**. When done you get the storefront URL, e.g. `https://luxe-ecommerce-frontend.vercel.app`. **This is the public link you share.**

---

## 4. Connect the two projects (CORS) and redeploy

Right now the API still has the placeholder `CLIENT_URL`. Point it at the real storefront:

1. Open the **backend** project → **Settings → Environment Variables** → edit **`CLIENT_URL`** to your real frontend URL (no trailing slash), e.g. `https://luxe-ecommerce-frontend.vercel.app`.
2. Go to the backend project's **Deployments** tab → on the latest deployment click the **⋯ menu → Redeploy**.

(If you ever change `NEXT_PUBLIC_API_URL`, you must **redeploy the frontend** too — Next.js bakes public env vars in at build time.)

---

## 4b. Order emails with Resend (optional but recommended)

The store sends a confirmation email to the customer and a notification to the admin whenever an order is placed. It uses plain SMTP, so any provider works; these steps use **Resend** (free, no card).

1. Sign up at [resend.com](https://resend.com) (GitHub login works).
2. **API Keys → Create API Key** → copy it (starts with `re_…`). This is your SMTP password.
3. **Sender address:**
   - *Quick test:* you can send from `onboarding@resend.dev`, but Resend will only deliver to the email address you signed up with. Fine for trying it out.
   - *Real use:* **Domains → Add Domain**, add the DNS records Resend shows you, and once verified you can send from e.g. `orders@yourdomain.com` to anyone.
4. In the **backend** Vercel project → **Settings → Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `SMTP_HOST` | `smtp.resend.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `resend` |
   | `SMTP_PASS` | your `re_…` API key |
   | `EMAIL_FROM` | `LUXE <onboarding@resend.dev>` (or `orders@yourdomain.com` once verified) |
   | `ADMIN_EMAIL` | the address that should receive new-order notifications |

5. **Redeploy** the backend project.

If you skip this, the store still works — it just logs "Email not configured" and sends nothing.

## 5. Seed the database (once)

Load the 16 products and demo accounts. Run locally, pointed at Atlas:

```bash
cd backend
npm install
MONGO_URI="your-atlas-connection-string" npm run seed
```

Creates the catalog plus `admin@luxe.test / admin123` and `customer@luxe.test / customer123`.
**Change the admin password before sharing the site publicly.**

---

## 6. Test the live site

Open your **frontend** URL and check:

- products load on the home page (confirms frontend → backend → Atlas all connect)
- register / log in works
- add to cart → checkout with test card **`4242 4242 4242 4242`** (any future expiry / CVC)
- the order then shows **Paid**, and appears under **My Orders**
- sign in as `admin@luxe.test` and open `/admin` to manage products and orders

That's it — your store is public. 🎉

---

## Notes & limits (free tier)

- **Cold starts:** the serverless API may take a second or two to wake on first hit after idle. Normal on Hobby.
- **Payment confirmation:** the app marks orders paid right after Stripe confirms in the browser, so checkout works fully. The optional `STRIPE_WEBHOOK_SECRET` server-side webhook is best left **unset** on Vercel (serverless functions don't preserve the raw body Stripe needs to verify signatures). For bulletproof webhook verification, run the backend on a long-running host (see `DEPLOYMENT.md` for the Render setup) and add the webhook there.
- **Function duration:** Hobby serverless functions run up to ~10s — plenty for these endpoints.
- **Going to real payments later:** swap to `sk_live_`/`pk_live_` keys and activate your Stripe account.
- **Custom domain:** add it free under the frontend project's **Settings → Domains**, then update `CLIENT_URL` (backend) + `NEXT_PUBLIC_API_URL` (frontend) and redeploy.

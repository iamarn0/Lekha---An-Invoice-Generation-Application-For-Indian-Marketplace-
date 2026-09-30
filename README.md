# LEKHA

GST invoices for Indian businesses.

LEKHA is an invoicing workspace for freelancers, agencies, and small businesses. It covers clients, invoices, a dashboard, and analytics, and bills the way an Indian business does: GSTIN, PAN, place of supply, CGST/SGST or IGST, HSN/SAC, UPI, and INR.

The demo workspace is **Kaavya Studio**, Bengaluru.

- Email: `demo@lekha.app`
- Password: `Demo1234!`

## Architecture

One Express process serves the API and, in production, the built React app. The browser calls `/api`. A signed JWT lives in an httpOnly cookie. Every record belongs to the signed-in user.

```text
client/   React, Vite, Tailwind, TanStack Query
server/   Express, Mongoose, JWT, PDFKit
```

Invoice totals are calculated on the server. The client previews the same formula while you type.

If `MONGO_URI` is unreachable in development, the API starts an in-memory MongoDB and seeds the demo workspace. Production requires a real `MONGO_URI` and does not use that fallback.

## Features

- Marketing pages, registration, login, logout, and password reset
- Dashboard: revenue, outstanding, paid invoices, clients, charts, and activity
- Clients: search, sort, filter, pagination, create, edit, and delete
- Invoices: line items, GST slabs, CGST/SGST/IGST, HSN/SAC, discounts, status changes, duplicate, send, and delete
- Quotations and proformas, with conversion to a tax invoice
- UPI on the bill. A Razorpay key ID can be stored; it does not create a charge
- PDF download, with amounts in words. Amounts print as `Rs.` because standard PDF fonts have no rupee glyph
- Analytics for 6 or 12 months, global search, settings, logo upload, and an activity history

Statuses are draft, sent, paid, overdue, and cancelled. A sent invoice past its due date is marked overdue the next time that workspace is read. Quotations and proformas are excluded from revenue and outstanding. A client with invoices cannot be deleted; mark them inactive instead.

## Tech stack

**Frontend:** React, Vite, React Router, Tailwind CSS, TanStack Query, Axios, Framer Motion, Recharts, Lucide.

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Helmet, CORS, rate limiting, PDFKit.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a workspace |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Start a reset |
| POST | `/api/auth/reset-password` | Set a new password |
| GET, POST | `/api/clients` | List or create clients |
| GET, PUT, DELETE | `/api/clients/:id` | Read, update, or delete a client |
| GET, POST | `/api/invoices` | List or create invoices |
| GET, PUT, DELETE | `/api/invoices/:id` | Read, update, or delete an invoice |
| POST | `/api/invoices/:id/send` | Mark an invoice sent |
| POST | `/api/invoices/:id/duplicate` | Copy an invoice into a new draft |
| POST | `/api/invoices/:id/convert` | Turn a quotation or proforma into a tax invoice |
| PATCH | `/api/invoices/:id/status` | Change status |
| GET | `/api/invoices/:id/pdf` | Download the PDF |
| GET | `/api/analytics/dashboard` | Dashboard metrics |
| GET | `/api/analytics?months=6` | Analytics for 6 or 12 months |
| GET | `/api/activity` | Activity feed |
| GET | `/api/search?q=` | Search invoices and clients |
| PUT | `/api/settings` | Business profile |
| PUT | `/api/settings/password` | Change password |
| POST, DELETE | `/api/settings/logo` | Upload or remove a logo |
| POST | `/api/contact` | Marketing contact form |

List endpoints accept `page`, `limit`, `sort`, `order`, and `search`. Invoice lists also accept `status`, `documentType`, `client`, `from`, `to`, `minAmount`, and `maxAmount`. Client lists accept `status` of `active`, `inactive`, or `outstanding`.

Success: `{ success, data }`. Errors: `{ success: false, message }`. Responses do not include stack traces. Passwords are bcrypt hashes and are never returned.

## Data

**User** — profile, GSTIN, PAN, state, UPI ID, Razorpay key ID, logo, currency (INR by default), GST slab, invoice prefix, and next number.

**Client** — name, company, email, phone, address, GSTIN, PAN, state, and active or inactive.

**Invoice** — client snapshot, document type, place of supply, HSN/SAC lines, GST split, discount, totals, outstanding amount, UPI ID, notes, status, and sent/paid dates.

**Activity** — a short history entry for the workspace.

## Setup

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET`.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `5000`. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Signing secret. Required in production. |
| `JWT_EXPIRES_IN` | Token lifetime. Default `7d`. |
| `CLIENT_URL` | Allowed browser origin. Default `http://localhost:5173`. |
| `NODE_ENV` | `production` serves the built client and requires MongoDB. |

`VITE_API_URL` is optional. In development, Vite proxies `/api` and `/uploads` to the API using `PORT` from `server/.env`.

```powershell
npm install
npm run install:all
Copy-Item server\.env.example server\.env
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000/api/health

The first development start may download a MongoDB binary when no local server is running. Then sign in with the demo account or register an empty workspace.

## Deployment

```powershell
npm run build
$env:NODE_ENV = "production"
$env:MONGO_URI = "your-mongodb-connection-string"
$env:JWT_SECRET = "a-long-random-string"
$env:CLIENT_URL = "https://your-domain"
npm start
```

The API serves `client/dist`. Use MongoDB Atlas or another hosted database, and HTTPS so the auth cookie can be `Secure`.

“Send invoice” records the status. It does not email the PDF or collect a payment.

## Deploy on Vercel

The React app is the static site. The Express API runs as a Vercel function in `api/[...path].js`. Vercel has no local disk and no in-memory MongoDB, so production needs MongoDB Atlas.

1. In Atlas, create a free cluster and a database user. Allow network access from anywhere (`0.0.0.0/0`) so Vercel can connect.
2. From the project root, install the CLI and deploy:

```powershell
npm install -g vercel
vercel login
vercel
```

3. In the Vercel project settings, set:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | A long random string |
| `CLIENT_URL` | Your Vercel URL, such as `https://your-app.vercel.app` |

`NODE_ENV` is `production` on Vercel. Do not set it to `development`.

The first request to an empty database seeds the Kaavya Studio demo. Logo uploads on Vercel are stored in the database, because the function filesystem is temporary.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | API and Vite together |
| `npm run build` | Production client build |
| `npm start` | Production server |
| `npm run seed` | Seed the demo workspace |
| `npm run smoke` | API smoke test against a running server |

# SoleTracker — Sneaker Business Dashboard

A sneaker reselling business management app built with **Next.js 14**, **SQLite**, and **TypeScript** that runs entirely on your own computer.

---

## Features

- **Dashboard** — Revenue, profit, stock value, charts, low-stock alerts, recent sales
- **Inventory** — Full CRUD with search, filter, sort, image upload, profit preview
- **Sales** — Record sales with automatic profit calculation, link to inventory & customers
- **Expenses** — Track business expenses by category
- **Customers** — Customer database with purchase history
- **Reports** — Analytics by month, brand, platform, model with charts and export
- **Excel Import** — Import inventory, sales, and expenses from .xlsx/.xls/.csv files with column mapping
- **Excel Export** — Export any dataset to Excel
- **Dark/Light Mode** — Toggle between themes
- **Authentication** — Local accounts with sign up, login and password change
- **Local Storage** — All data stored in a SQLite file on your computer; each account only sees its own data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| UI Components | Radix UI, custom components |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Database | SQLite (local file, via Node's built-in `node:sqlite`) |
| Auth | Local accounts (scrypt-hashed passwords, session cookies) |
| File Storage | Local folder (`data/uploads`) |
| Excel | xlsx library |

Everything runs on your own computer — no cloud account, no database server, nothing to deploy.

---

## Quick Start

### 1. Install Node.js

You need **Node.js 22.13 or newer** (it includes SQLite). Download the LTS version from [nodejs.org](https://nodejs.org), or on Windows:

```bash
winget install OpenJS.NodeJS.LTS
```

### 2. Install and run

```bash
cd sneaker-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Create one free**, and sign up. Your account and all your data live only on this computer.

For everyday use you can run the faster production build instead:

```bash
npm run build
npm start
```

### 3. (Optional) Add demo data

```bash
npm run seed -- you@example.com
```

---

## Your Data

- The database is a single file: `data/soletracker.db`. Uploaded product photos are in `data/uploads/`.
- **Back up** by copying the `data` folder (stop the app first). Restore by putting it back.
- To keep your data somewhere else (e.g. a OneDrive folder), set `DATA_DIR` in a `.env.local` file — see `.env.example`.
- Tables are created automatically the first time the app starts.
- The `data` folder is git-ignored, so your business data never gets pushed to GitHub.

### Forgot your password?

There's no email server, so reset it from a terminal in the project folder:

```bash
npm run reset-password -- you@example.com newpassword
```

---

## Excel Import Format

### Inventory
| Column | Required | Notes |
|--------|----------|-------|
| Brand | ✅ | Nike, Adidas, Jordan, etc. |
| Model | ✅ | Air Jordan 1, Yeezy 350, etc. |
| Colorway | | e.g. Chicago, Zebra |
| SKU | | Your internal SKU |
| Size | | e.g. 10, 10.5 |
| Purchase Price | | Number |
| Selling Price | | Number |
| Quantity | | Number (default: 1) |
| Purchase Date | | YYYY-MM-DD |
| Status | | In Stock, Sold, Reserved, Returned |

### Sales
| Column | Required | Notes |
|--------|----------|-------|
| Selling Price | ✅ | Number |
| Purchase Cost | | Number |
| Sale Date | | YYYY-MM-DD |
| Platform | | In-store, Instagram, etc. |

### Expenses
| Column | Required | Notes |
|--------|----------|-------|
| Amount | ✅ | Number |
| Date | | YYYY-MM-DD |
| Category | | Rent, Ads, Packaging, etc. |
| Description | | Text |

---

## Database Schema

```
users             — Local accounts
sessions          — Login sessions
products          — Sneaker inventory
sales             — Sales records (with profit calculation)
customers         — Customer profiles
expenses          — Business expenses
suppliers         — Supplier info
imported_files    — Import history log
notifications     — In-app alerts
user_settings     — Per-user preferences
```

The schema lives in `src/lib/schema.ts`. Open `data/soletracker.db` with any SQLite tool (e.g. [DB Browser for SQLite](https://sqlitebrowser.org)) to inspect or query your data directly.

---

## Project Structure

```
sneaker-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Signup, Forgot Password
│   │   ├── (dashboard)/     # All dashboard pages
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── layout/          # Sidebar, Header, ThemeProvider
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── db.ts            # SQLite connection + query helpers
│   │   ├── schema.ts        # Database tables
│   │   ├── auth.ts          # Local accounts & sessions
│   │   ├── utils.ts         # Utility functions
│   │   └── excel.ts         # Excel import/export logic
│   ├── middleware.ts        # Redirects to /login when signed out
│   └── types/               # TypeScript types
├── scripts/                 # seed + reset-password
├── data/                    # Your database & uploads (created on first run)
└── README.md
```

---

## License

MIT — free to use for your business.

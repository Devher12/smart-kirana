# Smart Kirana

A full-stack MIS (Management Information System) web application for Pakistani kirana (grocery) store owners. Built with React, Express, MySQL, and Sequelize.

## Features

- **Dashboard** — Live KPIs, revenue charts, low-stock and expiry alerts
- **POS** — Barcode scanning, product search, cart, cash/credit checkout
- **Inventory** — Product CRUD, stock tracking, category/supplier filters
- **Sales History** — Paginated sales with date filters and PDF invoices
- **Customer Credit Ledger** — Track credit sales and record payments
- **Supplier Management** — Suppliers and purchase orders with stock updates
- **Reports** — Top products, category breakdown, trends, PDF export
- **Settings** — Store info, password change, user management
- **Reorder Engine** — Daily cron job for intelligent stock alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2 + Sequelize ORM) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Charts | Recharts |
| PDF | PDFKit |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Create MySQL database

```bash
mysql -u root -p -e "CREATE DATABASE smart_kirana;"
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment

Edit `.env` in the project root:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_kirana
DB_USER=root
DB_PASS=yourpassword
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. Run migrations + seed

```bash
cd server && node seeders/seed.js
```

### 5. Start backend

```bash
cd server && npm run dev
```

Server runs on `http://localhost:5000`

### 6. Start frontend

```bash
cd client && npm run dev
```

App runs on `http://localhost:5173`

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@smartkirana.pk | Admin@1234 |
| Cashier | cashier@smartkirana.pk | Cashier@1234 |

## Project Structure

```
smart-kirana/
├── client/          # React frontend
│   └── src/
│       ├── api/         # Axios + API calls
│       ├── components/  # UI + layout components
│       ├── context/     # AuthContext
│       ├── pages/       # Route pages
│       └── utils/       # Formatters, helpers
├── server/          # Express backend
│   ├── config/      # Database config
│   ├── controllers/ # Route handlers
│   ├── middleware/  # Auth + error handling
│   ├── models/      # Sequelize models
│   ├── routes/      # API routes
│   ├── jobs/        # Cron jobs (reorder engine)
│   └── seeders/     # Database seed script
├── .env
└── README.md
```

## API Endpoints

All routes are under `/api/v1/`:

- `POST /auth/login` — Login
- `GET /products` — List products
- `POST /sales` — Create sale (transactional)
- `GET /dashboard` — Dashboard KPIs (owner only)
- `GET /reports/pdf/daily` — Daily PDF report (owner only)

See source code in `server/routes/` for the full API.

## License

MIT

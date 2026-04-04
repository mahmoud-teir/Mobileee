# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack mobile phone shop management system ("SmartStore POS"). Manages inventory, sales, repairs, customers, suppliers, expenses, installments, and user accounts.

## Commands

### Frontend (React — root directory)
```bash
npm start       # Dev server on port 3000
npm run build   # Production build
npm test        # Run Jest tests
```

### Backend (Express — `backend/` directory)
```bash
cd backend
npm start       # Start with node (production)
npm run dev     # Start with nodemon (development, auto-reload)
```

### Environment Setup
Copy or create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mobile_shop
JWT_SECRET=<strong-secret>
```

Frontend reads `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

## Architecture

### Two-process setup
- **Frontend**: React 19 SPA served on port 3000, proxies API calls to the backend.
- **Backend**: Express 4 REST API on port 5000, connected to MongoDB via Mongoose.

Both must be running simultaneously during development.

### Frontend (`src/`)
| File | Role |
|------|------|
| `App.js` | Root router; wraps everything in `AuthProvider` |
| `AuthContext.js` | JWT auth state, 10-min session timeout logic |
| `api.js` | All `fetch` calls to backend; attaches `Authorization` header |
| `storage.js` | Thin abstraction over `api.js` used by components |
| `MobileShopManagement.js` | Main shell that renders the active section |
| `components/` | One file per business module |

### Backend (`backend/`)
| Directory | Role |
|-----------|------|
| `server.js` | Express app, middleware (CORS, JSON), mounts all routers |
| `models/` | 12 Mongoose schemas: User, Phone, Screen, Accessory, Sticker, Sale, Repair, Return, Customer, Supplier, Expense, Installment |
| `routes/` | 15 Express routers, one per domain; thin — validation + DB calls only |
| `middleware/` | Auth middleware (JWT verification) |

### Authentication flow
1. `POST /api/auth/login` → backend returns JWT (7-day expiry) + user object.
2. Frontend stores both in `localStorage`; `AuthContext` hydrates on mount.
3. Every subsequent API call attaches `Authorization: Bearer <token>` via `api.js`.
4. After 10 minutes of inactivity, `AuthContext` shows a warning then auto-logs out.

### Role-based access
Users have one of three roles: `admin`, `manager`, `employee`. Role checks are enforced in backend route middleware and reflected in frontend UI visibility.

## Key Libraries
- **UI**: Tailwind CSS 3, Lucide React icons, Recharts for dashboards
- **Export**: jsPDF + jsPdf-AutoTable (PDF), XLSX (Excel), DOCX (Word), html2canvas
- **Print**: react-to-print, custom `PrintTemplates.js`
- **Barcodes**: react-barcode (generation), BarcodeScanner component

## RTL / Arabic UI
The UI is Arabic-first (RTL). All user-facing strings are in Arabic. Comments in source files may also be in Arabic.

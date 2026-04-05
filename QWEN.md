# QWEN.md — SmartStore POS Context

## Project Overview

**SmartStore POS** (نظام إدارة المحلات الذكي) is a full-stack **Point of Sale & Inventory Management System** built for mobile phone retail shops. It is a **Next.js 15 (App Router)** application with a **unified frontend + API backend** architecture (no separate Express server — API routes live under `app/api/`).

### Key Capabilities
- **Multi-tenant SaaS**: Store isolation via subdomain-based routing (`[storeSlug]`) with per-store data, users, and settings.
- **Multi-language & RTL/LTR**: Dynamic Arabic (RTL) / English (LTR) switching using locale files in `locales/`.
- **Inventory Management**: Screens, Phones, Accessories, Stickers, and custom Categories with barcode support.
- **Repairs Tracking**: Full repair lifecycle — status tracking, customer notifications, pricing.
- **Sales & Finances**: POS transactions, expense tracking, installments, returns, and PDF/Excel/DOCX exports.
- **Role-Based Access Control**: Roles include `super_admin`, `owner`, `admin`, `manager`, `employee`.
- **Subscription Tiers**: Free / Pro / Enterprise plans with feature gating (`lib/planLimits.js`).
- **Dashboard & Analytics**: Business stats, profit analysis, low-stock alerts, sales trends (Recharts).
- **Backup/Restore**: Full data export and import with support for up to 10 MB payloads.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS 3 |
| **Database** | MongoDB Atlas + Mongoose 9 |
| **Auth** | Stateless JWT (`jsonwebtoken`) + bcrypt |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Exports** | jsPDF, jsPDF-AutoTable, XLSX, DOCX, html2canvas |
| **Barcodes** | react-barcode, BarcodeScanner component |
| **Printing** | react-to-print, custom PrintTemplates |
| **Notifications** | Sonner |
| **Fonts** | Cairo (Arabic) + Inter (English) via Google Fonts |

## Project Structure

```
mobile-shop-management/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers (Next.js server actions)
│   │   ├── auth/                 # Login, register, logout, me, change-password, init
│   │   ├── screens|phones|accessories|stickers|products/  # Inventory APIs
│   │   ├── customers|suppliers/  # CRM APIs
│   │   ├── sales|repairs|returns|installments/  # Business operation APIs
│   │   ├── expenses/             # Expense tracking
│   │   ├── dashboard/            # Dashboard summary & analytics
│   │   ├── backup/               # Export/import data
│   │   ├── categories/           # Custom product categories
│   │   ├── admin|users/          # Admin & user management
│   │   ├── store/                # Store-level settings
│   │   └── health/               # Health check endpoint
│   ├── [storeSlug]/              # Dynamic store-scoped pages
│   ├── register-store/           # New store registration
│   ├── layout.jsx                # Root layout (RTL, Providers, fonts)
│   ├── page.jsx                  # Entry: auth check → Login or Dashboard
│   └── globals.css               # Global styles
├── components/                   # React client components
│   ├── AuthContext.js            # JWT auth state, session timeout
│   ├── LanguageContext.js        # i18n context (ar/en toggle)
│   ├── Providers.js              # Wraps all context providers
│   ├── Login.js                  # Login form
│   ├── MobileShopManagement.js   # Main dashboard shell / navigation
│   ├── Dashboard.js              # Dashboard view with stats & charts
│   ├── Inventory.js              # Inventory management UI
│   ├── Sales.js                  # Sales/POS UI
│   ├── Repairs.js                # Repairs management UI
│   ├── Customers.js              # Customer management
│   ├── Suppliers.js              # Supplier management
│   ├── Expenses.js               # Expense tracking
│   ├── Installments.js           # Installment plan management
│   ├── Returns.js                # Return processing
│   ├── Reports.js                # Reporting & export
│   ├── Invoice.js                # Invoice generation & printing
│   ├── Settings.js               # Store & user settings
│   ├── UsersManagement.js        # User CRUD & role assignment
│   ├── SystemAdmin.js            # Super-admin panel
│   ├── BackupManager.js          # Data backup & restore
│   ├── CategoryManager.js        # Custom category management
│   ├── BarcodeGenerator.js       # Barcode generation
│   ├── BarcodeScanner.js         # Barcode scanning UI
│   ├── PrintTemplates.js         # Print layout templates
│   ├── DatabaseViewer.js         # Database inspection tool
│   └── ConfirmationModal.js      # Reusable confirmation modal
├── lib/                          # Shared utilities
│   ├── api.js                    # Client-side API wrappers (fetch)
│   ├── auth.js                   # Server-side auth helpers (JWT, getAuthUser, requireRole)
│   ├── mongodb.js                # Mongoose connection with caching
│   ├── storage.js                # localStorage + API abstraction
│   └── planLimits.js             # Subscription tier feature flags & limits
├── models/                       # Mongoose schemas
│   ├── User.js                   # User + Store schemas (Store defined here)
│   ├── Phone.js, Screen.js, Accessory.js, Sticker.js  # Inventory models
│   ├── Product.js                # Generic product model
│   ├── Category.js               # Custom categories
│   ├── Customer.js, Supplier.js  # CRM models
│   ├── Sale.js, Repair.js, Return.js  # Transaction models
│   ├── Expense.js, Installment.js  # Financial models
├── locales/                      # Internationalization
│   ├── ar.json                   # Arabic translations
│   └── en.json                   # English translations
├── middleware.js                 # Next.js middleware (JWT guard, store slug extraction)
├── next.config.js                # Next.js config (body size limit for backups)
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json                  # Dependencies & scripts
```

## Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Clean build cache & node_modules cache
npm run clean
```

## Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.abcde.mongodb.net/smartstore_pos?retryWrites=true&w=majority
JWT_SECRET=your_strong_secret_key_here
```

## Architecture Notes

### Request Flow
1. **Middleware** (`middleware.js`) intercepts all `/api/*` requests, extracts store slug from `x-store-slug` header or subdomain, and validates JWT presence.
2. **API routes** (`app/api/**`) use `getAuthUser()` from `lib/auth.js` to decode the token, verify the user belongs to the target store, and enforce role-based access via `requireRole()`.
3. **Client components** call APIs through the wrappers in `lib/api.js`, which attach the `Authorization: Bearer <token>` header automatically.

### Authentication
- JWT tokens expire after **7 days**.
- `AuthContext.js` manages session state with a **10-minute inactivity timeout** warning before auto-logout.
- Passwords are hashed with **bcrypt** (10 salt rounds).

### Multi-Tenancy
- Each store has a unique **slug** (URL-safe identifier).
- Store resolution: subdomain → `x-store-slug` header → user's default store.
- Data is scoped per-store via `storeId` references on all business models.
- `super_admin` users bypass store scoping and can manage all stores.

### Subscription Plans
| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Max Users | 1 | 5 | Unlimited |
| Core modules (inventory, sales, repairs, etc.) | ✅ | ✅ | ✅ |
| Installments | ❌ | ✅ | ✅ |
| Reports & exports | ❌ | ✅ | ✅ |
| User management | ❌ | ✅ | ✅ |

### Localization
- Default language is **Arabic (RTL)**.
- `LanguageContext.js` provides runtime switching between `ar` and `en`.
- Locale files (`locales/ar.json`, `locales/en.json`) contain all UI strings.
- The HTML root element defaults to `dir="rtl"` and `lang="ar"`.

## Coding Conventions

- **Components**: Functional React components using `useState`, `useEffect`, and custom context hooks.
- **API routes**: Next.js App Router route handlers (`export async function GET/POST/PUT/DELETE/PATCH`).
- **Error handling**: Client-side `fetchAPI()` in `lib/api.js` throws on non-2xx responses; components catch and display toast alerts (Sonner).
- **Naming**: PascalCase for components, camelCase for utilities/API functions, kebab-case for API endpoint directories.
- **i18n**: All user-facing strings go through the `LanguageContext` — never hardcode display text.
- **Styling**: Tailwind CSS utility classes exclusively; no inline styles except for dynamic values.

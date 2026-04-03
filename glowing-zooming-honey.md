# Next.js 14+ Migration Plan: كرزة موبايل

## Context
Migrating a MERN stack mobile shop management system to Next.js 14+ App Router. The current app has a React 19 SPA frontend (port 3000) and Express 4 backend (port 5000) with MongoDB/Mongoose. The goal is a single Next.js app that collapses both processes into one, with Express routes becoming Next.js API route handlers.

**Key findings that simplify migration:**
- No React Router (tab-based nav) → no client-side routing to migrate
- No WebSockets → no real-time complexity
- No file uploads (no Multer) → no multipart form handling
- 20 components all need `'use client'` (all use hooks/state/events)

---

## Section 1: Preparation & Analysis

### Current Structure Summary
```
project/
├── src/                    # React frontend
│   ├── App.js              # Root: loading → Login → MobileShopManagement
│   ├── AuthContext.js      # JWT auth, 10-min timeout, localStorage
│   ├── api.js              # fetchAPI + 13 domain API objects
│   ├── storage.js          # MongoStorage class + useStorage hook
│   ├── MobileShopManagement.js  # Main shell (12 tabs)
│   ├── index.css           # Tailwind + custom utilities
│   └── components/         # 20 component files
├── backend/
│   ├── server.js           # Express app
│   ├── models/             # 12 Mongoose schemas
│   ├── routes/             # 15 Express routers
│   └── middleware/auth.js  # JWT protect + requireRole
├── package.json            # React app deps
└── tailwind.config.js
```

### Target Structure
```
project-next/
├── app/
│   ├── layout.jsx          # Root layout: AuthProvider + RTL + Cairo font
│   ├── page.jsx            # Replaces App.js (login gate)
│   ├── globals.css         # Move src/index.css here
│   └── api/                # All Express routes become API handlers
│       ├── auth/
│       │   ├── login/route.js
│       │   ├── register/route.js
│       │   ├── logout/route.js
│       │   ├── me/route.js
│       │   ├── init/route.js
│       │   └── change-password/route.js
│       ├── screens/
│       │   ├── route.js           # GET (list) + POST (create)
│       │   ├── [id]/route.js      # GET + PUT + DELETE
│       │   ├── [id]/quantity/route.js  # PATCH
│       │   └── alerts/low-stock/route.js
│       ├── phones/            # same pattern as screens
│       ├── accessories/       # same pattern
│       ├── stickers/          # same pattern
│       ├── customers/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   ├── [id]/purchase/route.js
│       │   └── search/[query]/route.js
│       ├── suppliers/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   └── search/[query]/route.js
│       ├── sales/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   ├── range/route.js
│       │   ├── range/delete/route.js
│       │   └── stats/summary/route.js
│       ├── repairs/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   ├── [id]/status/route.js
│       │   ├── [id]/pay/route.js
│       │   ├── [id]/notify/route.js
│       │   ├── status/[status]/route.js
│       │   └── stats/summary/route.js
│       ├── expenses/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   ├── range/route.js
│       │   ├── category/[category]/route.js
│       │   └── stats/summary/route.js
│       ├── returns/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   └── sale/[saleId]/route.js
│       ├── installments/
│       │   ├── route.js
│       │   ├── [id]/route.js
│       │   ├── [id]/payment/[paymentId]/route.js
│       │   └── status/pending/route.js
│       ├── dashboard/
│       │   ├── summary/route.js
│       │   ├── alerts/low-stock/route.js
│       │   ├── alerts/ready-repairs/route.js
│       │   ├── trends/monthly/route.js
│       │   ├── inventory/summary/route.js
│       │   ├── database-stats/route.js
│       │   └── collection/[name]/route.js
│       ├── backup/
│       │   ├── export/route.js
│       │   ├── import/route.js
│       │   └── clear/route.js
│       └── users/
│           ├── route.js
│           ├── [id]/route.js
│           ├── [id]/toggle-active/route.js
│           └── [id]/reset-password/route.js
├── components/             # Move from src/components/
│   └── [all 20 components with 'use client' at top]
├── lib/
│   ├── mongodb.js          # Connection singleton
│   ├── auth.js             # JWT sign/verify utilities
│   └── apiHandler.js      # Shared request parsing helper
├── models/                 # Move from backend/models/
│   └── [all 12 Mongoose models unchanged]
├── middleware.js           # Next.js middleware for auth
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Section 2: Project Setup

### Step 1: Create new Next.js project alongside existing
```bash
# From the parent directory of your current project
npx create-next-app@latest mobile-shop-next \
  --js \
  --tailwind \
  --app \
  --no-src-dir \
  --no-import-alias

cd mobile-shop-next
```

### Step 2: Install all dependencies
```bash
npm install mongoose bcryptjs jsonwebtoken \
  recharts lucide-react \
  jspdf jspdf-autotable html2canvas \
  react-to-print react-barcode \
  xlsx docx file-saver
```

### Step 3: package.json result (key deps)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "recharts": "^3.5.0",
    "lucide-react": "^0.555.0",
    "jspdf": "^3.0.4",
    "jspdf-autotable": "^5.0.2",
    "html2canvas": "^1.4.1",
    "react-to-print": "^3.2.0",
    "react-barcode": "^1.6.1",
    "xlsx": "^0.18.5",
    "docx": "^9.5.1",
    "file-saver": "^2.0.5"
  }
}
```

---

## Section 3: Database Connection

### File: `lib/mongodb.js`
This singleton prevents creating new connections on every hot-reload or serverless invocation.

```js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Global cache persists across hot-reloads in dev
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,          // serverless: limit connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Why this works in serverless:** Vercel/serverless functions may reuse the same Node.js process. `global.mongoose` persists the connection across invocations within the same process, avoiding MongoDB's connection limit.

---

## Section 4: Migrating Models

Models are 100% reusable — copy them unchanged.

```bash
# From your new Next.js project root
cp -r ../mobile-shop-management/backend/models ./models
```

No changes needed. Mongoose schemas are framework-agnostic.

---

## Section 5: Auth Utilities

### File: `lib/auth.js`
Replaces `backend/middleware/auth.js`. Returns user data instead of calling `next()`.

```js
import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Call this inside API route handlers instead of using middleware
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(user) {
  if (!user) {
    return Response.json({ message: 'غير مصرح' }, { status: 401 });
  }
  return null; // null means auth passed
}

export function requireRole(user, ...roles) {
  const authError = requireAuth(user);
  if (authError) return authError;
  if (!roles.includes(user.role)) {
    return Response.json({ message: 'غير مصرح لك' }, { status: 403 });
  }
  return null;
}
```

---

## Section 6: API Route Handlers

### Pattern: Every Express route file → multiple Next.js `route.js` files

**Express pattern:**
```js
// backend/routes/screens.js
router.get('/', protect, async (req, res) => { ... })
router.post('/', protect, async (req, res) => { ... })
router.get('/:id', protect, async (req, res) => { ... })
```

**Next.js pattern:**
```js
// app/api/screens/route.js  (handles GET + POST /api/screens)
// app/api/screens/[id]/route.js  (handles GET + PUT + DELETE /api/screens/:id)
```

### Example: `app/api/screens/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../lib/auth';
import Screen from '../../../models/Screen';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const screens = await Screen.find().sort({ createdAt: -1 });
  return NextResponse.json(screens);
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const body = await request.json();
  const screen = await Screen.create(body);
  return NextResponse.json(screen, { status: 201 });
}
```

### Example: `app/api/screens/[id]/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../lib/auth';
import Screen from '../../../../models/Screen';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const screen = await Screen.findById(params.id);
  if (!screen) return NextResponse.json({ message: 'غير موجود' }, { status: 404 });
  return NextResponse.json(screen);
}

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const body = await request.json();
  const screen = await Screen.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
  if (!screen) return NextResponse.json({ message: 'غير موجود' }, { status: 404 });
  return NextResponse.json(screen);
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const screen = await Screen.findByIdAndDelete(params.id);
  if (!screen) return NextResponse.json({ message: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ message: 'تم الحذف' });
}
```

### Example: `app/api/screens/[id]/quantity/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Screen from '../../../../../models/Screen';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();
  const { quantity } = await request.json();
  const screen = await Screen.findByIdAndUpdate(
    params.id,
    { $inc: { quantity } },
    { new: true }
  );
  return NextResponse.json(screen);
}
```

### Example: `app/api/auth/login/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { signToken } from '../../../../lib/auth';
import User from '../../../../models/User';

export async function POST(request) {
  await connectDB();
  const { username, password } = await request.json();

  const user = await User.findOne({ username });
  if (!user || !user.isActive) {
    return NextResponse.json({ message: 'بيانات خاطئة' }, { status: 401 });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return NextResponse.json({ message: 'بيانات خاطئة' }, { status: 401 });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;

  return NextResponse.json({ token, user: userObj });
}
```

### Example: `app/api/auth/me/route.js`
```js
import { NextResponse } from 'next/server';
import { getAuthUser, requireAuth } from '../../../../lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  return NextResponse.json(user);
}
```

### Example: `app/api/users/route.js` (admin-only)
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getAuthUser, requireRole } from '../../../lib/auth';
import User from '../../../models/User';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;

  await connectDB();
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return NextResponse.json(users);
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;

  await connectDB();
  const body = await request.json();
  const newUser = await User.create(body);
  const result = newUser.toObject();
  delete result.password;
  return NextResponse.json(result, { status: 201 });
}
```

### Example: `app/api/dashboard/summary/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../lib/auth';
import Sale from '../../../../models/Sale';
import Repair from '../../../../models/Repair';
import Expense from '../../../../models/Expense';
import Customer from '../../../../models/Customer';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySales, pendingRepairs, todayExpenses, totalCustomers] = await Promise.all([
    Sale.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    Repair.countDocuments({ status: { $nin: ['مسلم', 'ملغي'] } }),
    Expense.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Customer.countDocuments()
  ]);

  return NextResponse.json({
    todaySales: todaySales[0] || { total: 0, count: 0 },
    pendingRepairs,
    todayExpenses: todayExpenses[0]?.total || 0,
    totalCustomers
  });
}
```

### Example: `app/api/backup/export/route.js`
```js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireRole } from '../../../../lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;

  await connectDB();
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const backup = {};

  for (const col of collections) {
    backup[col.name] = await db.collection(col.name).find({}).toArray();
  }

  return new Response(JSON.stringify(backup), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-${Date.now()}.json"`
    }
  });
}
```

**Apply the same pattern to all 80+ endpoints.** The logic is identical to the Express handlers — just replace `res.json()` with `NextResponse.json()` and `req.body` with `await request.json()`.

---

## Section 7: Frontend Migration

### Step 1: Environment Variables
```bash
# .env.local (new file at project root)
MONGODB_URI=mongodb://localhost:27017/mobile_shop
JWT_SECRET=your_jwt_secret_key_here_change_in_production
# No REACT_APP_API_URL needed — all API calls use relative /api paths
```

### Step 2: Update `api.js`
The only change: remove the base URL prefix. All calls become relative paths.

**Before (`src/api.js`):**
```js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  // ...
}
```

**After (`lib/api.js` or keep as `src/api.js` if migrating gradually):**
```js
// No API_URL constant needed — Next.js serves API from same origin
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, options);
  // ...
}

// Rest of the file (domain API objects) stays IDENTICAL
export const screensAPI = { /* unchanged */ };
export const phonesAPI = { /* unchanged */ };
// ... all 13 API objects unchanged
```

### Step 3: Root Layout — `app/layout.jsx`
```jsx
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/AuthContext';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata = {
  title: 'كرزة موبايل',
  description: 'نظام إدارة محل موبايل',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Step 4: Root Page — `app/page.jsx`
```jsx
'use client';

import { useAuth } from '../components/AuthContext';
import Login from '../components/Login';
import MobileShopManagement from '../components/MobileShopManagement';

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) return <Login />;
  return <MobileShopManagement />;
}
```

### Step 5: Global CSS — `app/globals.css`
```bash
# Copy existing index.css
cp ../mobile-shop-management/src/index.css app/globals.css
```

Add at top of globals.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
/* rest of your existing index.css content */
```

### Step 6: Copy and update all components
```bash
cp -r ../mobile-shop-management/src/components ./components
cp ../mobile-shop-management/src/AuthContext.js ./components/AuthContext.js
cp ../mobile-shop-management/src/MobileShopManagement.js ./components/MobileShopManagement.js
cp ../mobile-shop-management/src/storage.js ./lib/storage.js
```

**Add `'use client'` as the FIRST line of every component:**

Files that need it (all of them):
- `components/AuthContext.js`
- `components/MobileShopManagement.js`
- `components/Login.js`
- `components/Dashboard.js`
- `components/Inventory.js`
- `components/Sales.js`
- `components/Repairs.js`
- `components/Expenses.js`
- `components/Customers.js`
- `components/Suppliers.js`
- `components/Returns.js`
- `components/Installments.js`
- `components/Reports.js`
- `components/UsersManagement.js`
- `components/DatabaseViewer.js`
- `components/BackupManager.js`
- `components/Invoice.js`
- `components/PrintTemplates.js`
- `components/BarcodeScanner.js`
- `components/BarcodeGenerator.js`
- `components/ConfirmationModal.js`

```bash
# Quick way to add 'use client' to all components at once
for f in components/*.js; do
  if ! head -1 "$f" | grep -q "'use client'"; then
    sed -i "1s/^/'use client';\n/" "$f"
  fi
done
```

### Step 7: Fix storage.js dynamic URL detection
`src/storage.js` has LAN URL detection based on `window.location`. In Next.js, since API is same-origin, remove it:

```js
// lib/storage.js - remove the dynamic URL detection
// Change this:
const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = /* complex LAN detection */ ;

// To this:
const API_URL = '/api';
```

---

## Section 8: Authentication

### Next.js Middleware — `middleware.js`
Protects API routes at the edge (optional but adds defense-in-depth):

```js
import { NextResponse } from 'next/server';

// Public paths that don't need auth
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/init',
  '/',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes and public API paths
  if (!pathname.startsWith('/api') || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  // Full JWT verification happens in each route handler via getAuthUser()
  // Middleware only does a quick header presence check
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### AuthContext — No Changes Needed
`AuthContext.js` uses `localStorage` + Bearer headers, which works identically in Next.js. The session timeout logic (10-min inactivity) works the same way.

Only change needed: update the import path for `api.js`:
```js
// Before:
import { fetchAPI } from './api';
// After (if you moved api.js to lib/):
import { fetchAPI } from '../lib/api';
```

---

## Section 9: Tailwind Configuration

### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    // Old CRA paths no longer needed
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### `postcss.config.js`
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Section 10: Environment Variables

### `.env.local` (development — never commit)
```
MONGODB_URI=mongodb://localhost:27017/mobile_shop
JWT_SECRET=change_this_to_a_strong_random_secret_in_production
```

### `.env.production.local` (production overrides)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mobile_shop
JWT_SECRET=<generated-with-openssl-rand-base64-32>
```

### Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

### Key difference from CRA:
- `REACT_APP_*` variables → not needed (API is same-origin)
- Server-side env vars (no `NEXT_PUBLIC_` prefix) are only available in API routes and server components
- If you ever need a client-side env var, prefix with `NEXT_PUBLIC_`

---

## Section 11: next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the create-react-app proxy behavior
  // Next.js handles /api/* natively

  // If you use any packages that aren't ESM-ready:
  transpilePackages: ['recharts'],

  // Increase API route timeout for backup/import operations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // for backup import
    },
  },
};

module.exports = nextConfig;
```

---

## Section 12: Running the App

### Development
```bash
npm run dev
# App runs on http://localhost:3000
# API available at http://localhost:3000/api/*
# No separate backend process needed
```

### Production Build
```bash
npm run build
npm start
# Runs on http://localhost:3000
```

---

## Section 13: Testing

### Manual verification checklist:
1. **Auth flow**: Login → token stored in localStorage → Bearer header sent → `getAuthUser()` returns user
2. **Session timeout**: Idle for 10+ minutes → warning → auto-logout
3. **Role access**: Login as `employee` → Users tab hidden → `/api/users` returns 403
4. **CRUD**: Create/read/update/delete a screen → verify in MongoDB
5. **Dashboard**: Verify all 6 dashboard endpoints return data
6. **Backup export**: Download JSON → import back → verify data restored
7. **Reports**: Generate PDF/Excel → file downloads correctly
8. **Arabic RTL**: Check that all text renders right-to-left
9. **Dark mode**: Toggle dark mode → persists across pages
10. **Print**: Print invoice → layout correct

### Quick API test with curl:
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Test protected route
curl http://localhost:3000/api/screens \
  -H "Authorization: Bearer $TOKEN"

# Test admin-only route
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## Section 14: Deployment (Vercel)

### Setup
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Vercel environment variables (set in dashboard or CLI):
```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
```

### Important serverless considerations:
1. **Connection pooling**: `lib/mongodb.js` singleton handles this — `global.mongoose` persists across warm invocations
2. **Timeout**: Vercel hobby plan has 10s limit; Pro has 60s. Backup import/export may need chunking for large datasets
3. **MongoDB Atlas**: Use Atlas (cloud MongoDB) instead of local for production. Add Vercel's IP ranges to Atlas allowlist, or use `0.0.0.0/0` (all IPs) for simplicity

### MongoDB Atlas setup:
```
1. Create free cluster at mongodb.com/atlas
2. Create database user (username + password)
3. Add IP: 0.0.0.0/0 (allow all, for serverless)
4. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/mobile_shop
5. Add to Vercel env vars as MONGODB_URI
```

---

## Section 15: Troubleshooting

### "Cannot find module '../models/User'"
- Verify models are in `/models/` at project root (not `/backend/models/`)
- Check relative import paths in route handlers

### "MongoDB connection error in production"
- Verify `MONGODB_URI` is set in Vercel env vars
- Check Atlas IP allowlist includes `0.0.0.0/0`
- Verify connection string format: `mongodb+srv://...`

### "401 Unauthorized on all API calls"
- Check localStorage has `token` key
- Verify `Authorization: Bearer <token>` header is being sent
- Check `JWT_SECRET` matches between token signing and verification

### "Tailwind styles not applying"
- Verify `tailwind.config.js` content paths include `./components/**/*.{js,jsx}`
- Ensure `globals.css` is imported in `app/layout.jsx`
- Run `npm run build` and check for CSS errors

### "ReferenceError: window is not defined"
- This happens when a component using `window` is rendered on the server
- Fix: add `'use client'` at top of the file
- Or wrap in `useEffect(() => { /* window code */ }, [])`

### "jsPDF/html2canvas not working"
- These are browser-only libraries — they need `'use client'` on their component
- They do not work in Server Components

### "Module not found: xlsx/docx/file-saver"
- Add to `transpilePackages` in `next.config.js` if getting ESM errors

### API route returns 404 for dynamic routes
- Verify folder name uses brackets: `[id]` not `:id`
- File must be named exactly `route.js` (not `index.js`)

---

## Critical Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `lib/mongodb.js` | Create | Critical |
| `lib/auth.js` | Create | Critical |
| `lib/api.js` | Copy + modify | Critical |
| `app/layout.jsx` | Create | Critical |
| `app/page.jsx` | Create | Critical |
| `app/globals.css` | Copy from src/index.css | Critical |
| `app/api/auth/login/route.js` | Create | Critical |
| `app/api/*/route.js` | Create (80+ files) | Critical |
| `middleware.js` | Create | High |
| `tailwind.config.js` | Modify content paths | High |
| `next.config.js` | Create | High |
| `components/*.js` | Add 'use client' | High |
| `.env.local` | Create | Critical |

## Migration Order

1. `lib/mongodb.js` + `lib/auth.js` (foundation)
2. Copy models (unchanged)
3. `app/api/auth/` routes (needed to test anything)
4. Copy + update `lib/api.js` (remove base URL)
5. `app/layout.jsx` + `app/page.jsx` + `app/globals.css`
6. Copy components + add `'use client'`
7. All remaining API routes (inventory → customers → sales → repairs → etc.)
8. `middleware.js`
9. `next.config.js` + `tailwind.config.js`
10. Test locally → deploy to Vercel

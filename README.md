# 🏬 SmartStore POS (نظام إدارة المحلات الذكي)

![Favicon](/public/favicon.svg)

A modern, high-performance **Point of Sale (POS)** and **Inventory Management System** built with **Next.js 15**, **React**, and **MongoDB Atlas**. This project provides a unified, RTL-supported (Arabic) interface for managing retail business operations.

## 🚀 Key Features

- **📊 Comprehensive Dashboard**: High-level business stats, low-stock alerts, and ready-repair notifications.
- **📦 Multi-Category Inventory**: Advanced tracking for Screens, Phones, Accessories, and Stickers.
- **🛠️ Repairs Management**: Track repair status, customer info, and pricing with automatic notification triggers.
- **💰 Sales & Finances**: Manage transactions, expense tracking, and generate PDF/Excel reports and invoices.
- **💳 Installments & Returns**: Sophisticated handling of payment plans and product returns.
- **👥 User & Role Management**: Secure per-user access with Admin and Manager roles.
- **☁️ Cloud Database**: Fully integrated with MongoDB Atlas for global data persistence.
- **🔄 Local Storage Migration**: Built-in tools to migrate legacy browser data into the cloud database.
- **📎 Backup & Recovery**: Integrated JSON/PDF/Excel export systems for secure data offline storage.

## 💻 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) & [Mongoose](https://mongoosejs.com/)
- **Auth**: Stateless JWT Authentication.
- **Deployment**: Optimized for Vercel, Docker, or Node.js VPS.

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.abcde.mongodb.net/smartstore_pos?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Installation
```bash
# Install dependencies (Next.js 15 + React 19)
npm install --legacy-peer-deps

# Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🎨 Branding
The project uses the **SmartStore POS** identity, replacing the legacy "Karza Mobile". All icons are modern SVGs and the application is fully optimized for RTL (Right-to-Left) Arabic layouts.

## 👨‍💻 Credits
Developed and Designed by **Mahmoud AbuTeir**.
Full-stack Next.js Migration by AI Pair Programming.

---
© 2026 SmartStore POS. All rights reserved.
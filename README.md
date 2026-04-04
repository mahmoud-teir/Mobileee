# 🏬 SmartStore POS (نظام إدارة المحلات الذكي)

![Favicon](/public/favicon.svg)

A modern, high-performance **Point of Sale (POS)** and **Inventory Management System** built with **Next.js 15**, **React**, and **MongoDB Atlas**. This project provides a unified, multi-language interface for managing retail business operations.

## 🚀 Key Features

- **🌍 Multi-Language & RTL/LTR Support**: Dynamic switching between Arabic (RTL) and English (LTR) with fully localized interfaces and layouts.
- **📊 Comprehensive Dashboard**: High-level business stats, net profit analysis, low-stock alerts, and ready-repair notifications.
- **📦 Advanced Inventory**: Granular tracking for Screens, Phones, Accessories, Stickers, and support for Custom Categories.
- **🛠️ Repairs Management**: Track repair status, customer info, and pricing with automatic notification triggers.
- **💰 Sales & Finances**: Manage transactions, expense tracking, and generate PDF/Excel reports and invoices.
- **🛡️ Multi-Tenancy & Admin Tools**: Secure store isolation with Super Admin capabilities, including store management and impersonation.
- **💎 Subscription Feature Gating**: Tiered access control (Free, Pro, Enterprise) using a robust plan-based feature module.
- **☁️ Cloud Database Sync**: Fully integrated with MongoDB Atlas and optimized with local caching via `localStorage`.

## 💻 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) & [Mongoose](https://mongoosejs.com/)
- **Auth**: Stateless JWT Authentication with secure session management.
- **I18n**: Custom multi-language context with support for RTL and LTR.

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
# Install dependencies
npm install --legacy-peer-deps

# Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🎨 Branding
The project follows the **SmartStore POS** identity. It features a modern, clean UI with dynamic light/dark modes and a responsive design that adapts to all screen sizes.

## 👨‍💻 Credits
Developed and Designed by **Mahmoud AbuTeir**.
Refined and Extended with AI-Assisted Architecture and Feature Development.

---
© 2026 SmartStore POS. All rights reserved.
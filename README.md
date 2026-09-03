# NepStyle Ecommerce

A full-stack fashion ecommerce platform built for the Nepali market, consisting of four parts that work together:

- **`backend/`** — REST API built with Dart Shelf + MySQL
- **`nepstyle/`** — Flutter mobile app (Android & iOS)
- **`nepstyle_web/`** — React web app (runs in any browser)
- **`admin/`** — React CMS admin panel for managing all store data

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Flutter Mobile App Setup](#flutter-mobile-app-setup)
7. [React Web App Setup](#react-web-app-setup)
8. [Admin Panel Setup](#admin-panel-setup)
9. [Running Everything Together](#running-everything-together)
10. [API Reference](#api-reference)
11. [Features](#features)
12. [Tech Stack](#tech-stack)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
Browser / Mobile App         Admin Browser
        │                         │
        ▼                         ▼
React Web (port 3000)    Admin Panel (port 3001)
        │                         │
        └────────────┬────────────┘
                     ▼
          Dart Shelf API (port 8080)
                     │
                     ▼
              MySQL Database
              (db: nepstyle)
```

The web app and admin panel both communicate with the same backend API. The Flutter app calls the backend directly.

---

## Prerequisites

Install these before anything else. Instructions are given for both **macOS** and **Windows**.

### 1. MySQL 8.x

| OS | Instructions |
|---|---|
| **macOS** | `brew install mysql` then `brew services start mysql` |
| **Windows** | Download the MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/) and run the full installation. Start MySQL from the Windows Services panel or MySQL Workbench. |

After installing, set the root password to `password` (or see [Changing DB Credentials](#changing-db-credentials)):
```bash
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

### 2. Dart SDK 3.6+

| OS | Instructions |
|---|---|
| **macOS** | `brew install dart` |
| **Windows** | Download the Dart SDK zip from [dart.dev/get-dart](https://dart.dev/get-dart), extract it, and add the `bin` folder to your `PATH` environment variable. |

Verify: `dart --version`

### 3. Flutter SDK 3.x (for mobile app only)

| OS | Instructions |
|---|---|
| **macOS** | Download from [flutter.dev](https://flutter.dev/docs/get-started/install/macos), extract, add `flutter/bin` to your `PATH`. |
| **Windows** | Download from [flutter.dev](https://flutter.dev/docs/get-started/install/windows), extract to `C:\flutter`, add `C:\flutter\bin` to your `PATH`. |

Verify: `flutter doctor`  
Fix any issues `flutter doctor` reports (Android SDK, Xcode on macOS, etc.) before continuing.

### 4. Node.js 18+ and npm (for web app and admin panel)

| OS | Instructions |
|---|---|
| **macOS** | `brew install node` |
| **Windows** | Download the LTS installer from [nodejs.org](https://nodejs.org/) and run it. |

Verify: `node --version` and `npm --version`

---

## Project Structure

```
ecommerce/
├── backend/                  # Dart Shelf REST API
│   ├── bin/
│   │   ├── server.dart       # Entry point — starts HTTP server on port 8080
│   │   └── seed.dart         # Database seeder (run once to add sample data)
│   ├── lib/
│   │   ├── database/
│   │   │   └── db.dart       # MySQL connection + auto table creation + admin seed
│   │   ├── models/           # Data models (User, Product, Order, Admin, etc.)
│   │   ├── routes/           # Route handlers (one file per resource)
│   │   └── services/         # Business logic (one file per resource)
│   ├── seed.sql              # SQL seeder (alternative to seed.dart)
│   └── pubspec.yaml
│
├── nepstyle/                 # Flutter mobile app
│   ├── lib/
│   │   ├── core/             # Theme, colors, routing, utilities
│   │   ├── features/
│   │   │   ├── authentication/   # Login, register, forgot/reset password
│   │   │   ├── base/             # Bottom navigation bar shell
│   │   │   ├── cart/             # Cart screen, checkout, order BLoCs
│   │   │   ├── home/             # Homepage, product detail, categories, brands
│   │   │   ├── startUp/          # Splash screen, onboarding
│   │   │   ├── user profile/     # Profile, orders, settings
│   │   │   └── wishlist/         # Wishlist screen
│   │   └── main.dart
│   ├── assets/               # Images, fonts, icons, animations
│   └── pubspec.yaml
│
├── nepstyle_web/             # React web app (customer-facing)
│   ├── src/
│   │   ├── api/              # Axios API calls (index.js)
│   │   ├── components/       # Navbar, Footer, ProductCard, etc.
│   │   ├── context/          # AuthContext, CartContext, WishlistContext
│   │   └── pages/            # One file per page/route
│   ├── vite.config.js
│   └── package.json
│
├── admin/                    # React CMS admin panel
│   ├── src/
│   │   ├── api/              # Axios API calls to backend
│   │   ├── components/       # Sidebar, Modal
│   │   ├── context/          # AuthContext (admin session)
│   │   └── pages/            # Dashboard, Products, Categories, Brands,
│   │                         # FlashSales, Orders, Reviews, Login
│   ├── vite.config.js        # Runs on port 3001
│   └── package.json
│
└── README.md
```

---

## Database Setup

### Step 1 — Create the database

Open a terminal and run:

```bash
mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS nepstyle;"
```

**Windows note:** If `mysql` is not in your PATH, open **MySQL Command Line Client** from the Start menu and run the same command.

### Step 2 — Create the tables

The backend creates all tables automatically when the server first starts (via `db.dart`). You can also run the schema manually:

```bash
# macOS / Linux
mysql -u root -ppassword nepstyle < backend/seed.sql

# Windows (Command Prompt)
mysql -u root -ppassword nepstyle < backend\seed.sql
```

### Step 3 — Seed sample data (optional but recommended)

**Option A — SQL file (fastest):**
```bash
# macOS / Linux
mysql -u root -ppassword nepstyle < backend/seed.sql

# Windows (Command Prompt)
mysql -u root -ppassword nepstyle < backend\seed.sql
```

**Option B — Dart seeder:**
```bash
cd backend
dart run bin/seed.dart
```

This inserts sample records into categories, brands, products, flash sale products, and reviews.

### Changing DB Credentials

Edit **one file**: `backend/lib/database/db.dart`

```dart
final settings = ConnectionSettings(
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',   // ← change this
  db: 'nepstyle',
);
```

---

## Backend Setup

```bash
cd backend
dart pub get
dart run bin/server.dart
```

The server starts on **http://localhost:8080**.

On first run you will see all tables being created and the default admin account being seeded:

```
Database connection established.
Ensured "users" table exists.
...
Ensured "admin_users" table exists.
✅ Admin credentials ready — email: admin@nepstyle.com  password: admin123
Server running on http://0.0.0.0:8080
```

**Windows note:** Use **Command Prompt** or **PowerShell** — not Git Bash.

### Running as a background service

**macOS:**
```bash
nohup dart run bin/server.dart > backend.log 2>&1 &
echo $! > backend.pid
kill $(cat backend.pid)   # stop it
```

**Windows (PowerShell):**
```powershell
Start-Process dart -ArgumentList "run bin/server.dart" -RedirectStandardOutput backend.log -NoNewWindow
```

---

## Flutter Mobile App Setup

### 1. Install dependencies

```bash
cd nepstyle
flutter pub get
```

### 2. Point the app at your backend

Open `nepstyle/lib/core/constants/strings.dart` and verify the base URL:

```dart
const String baseUrl = 'http://10.0.2.2:8080';   // Android emulator
// const String baseUrl = 'http://localhost:8080'; // iOS simulator
// const String baseUrl = 'http://192.168.x.x:8080'; // physical device on same LAN
```

| Target device | URL to use |
|---|---|
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://localhost:8080` |
| Physical device | `http://<your-LAN-IP>:8080` |

Find your LAN IP: `ipconfig getifaddr en0` (macOS) or `ipconfig` (Windows).

### 3. Run on a device or emulator

```bash
flutter devices
flutter run -d <device>
```

### Building a release APK (Android)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Building for iOS (macOS only)

```bash
flutter build ios --release
# Open nepstyle/ios/Runner.xcworkspace in Xcode to archive and distribute
```

---

## React Web App Setup

### 1. Install dependencies

```bash
cd nepstyle_web
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Opens at **http://localhost:3000**. Requires the backend to be running on port 8080.

### 3. Build for production

```bash
npm run build
# Output: nepstyle_web/dist/
```

### Deploying

Copy `dist/` to any static host (Netlify, Vercel, Nginx, etc.) and add a rewrite rule so all paths serve `index.html`:

```nginx
# Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

In production, update the base URL in `nepstyle_web/src/api/index.js`:
```js
const BASE_URL = 'https://your-production-api.com/api';
```

---

## Admin Panel Setup

The admin panel is a separate React app that connects to the same backend API.

### 1. Install dependencies

```bash
cd admin
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Opens at **http://localhost:3001**. Requires the backend to be running on port 8080.

### 3. Log in

The backend automatically creates a default admin account on first startup:

| Field | Value |
|---|---|
| Email | `admin@nepstyle.com` |
| Password | `admin123` |

> **Security:** Change this password after your first login by updating the record directly in the `admin_users` table.

### 4. What you can manage

| Section | Actions |
|---|---|
| **Dashboard** | View live stats (products, categories, brands, flash sales, orders) and recent orders |
| **Products** | View all, search, add new (with category/brand dropdowns), delete |
| **Categories** | View all, search, add new, delete |
| **Brands** | View all, search, add new, delete |
| **Flash Sales** | View all, add (select existing product + set discount %), delete |
| **Orders** | View all, filter by status, search — read-only |
| **Reviews** | View all, filter by product — read-only |

### 5. Build for production

```bash
cd admin
npm run build
# Output: admin/dist/
```

---

## Running Everything Together

Open **four separate terminals**:

### Terminal 1 — Backend
```bash
cd backend
dart run bin/server.dart
```

### Terminal 2 — Web App
```bash
cd nepstyle_web
npm run dev
```

### Terminal 3 — Admin Panel
```bash
cd admin
npm run dev
```

### Terminal 4 — Flutter App (optional)
```bash
cd nepstyle
flutter run
```

| Service | URL |
|---|---|
| Backend API | http://localhost:8080 |
| Web App | http://localhost:3000 |
| Admin Panel | http://localhost:3001 |

---

## API Reference

All endpoints are prefixed with `http://localhost:8080/api`.

### Admin Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Admin login (email + password) |

### User Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email & password |
| `PUT` | `/api/auth/update-profile` | Update user profile |
| `PUT` | `/api/auth/change-password` | Change password |
| `POST` | `/api/auth/forgot-password` | Reset password |

### Home
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/home/:userId` | Home data (categories, brands, products, flash sales, recommendations) |
| `POST` | `/api/log-activity` | Log user activity for recommendations |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/all` | All products |
| `POST` | `/api/products/add` | Add a product |
| `DELETE` | `/api/products/delete/:id` | Delete a product |
| `GET` | `/api/products/category/:id` | Products by category |
| `GET` | `/api/products/brand/:id` | Products by brand |
| `GET` | `/api/products/search/products/:query` | Full-text product search |
| `GET` | `/api/products/recommendations/:userId` | Personalised recommendations |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories/all` | All categories |
| `GET` | `/api/categories/:id` | Single category |
| `POST` | `/api/categories/add` | Add a category |
| `DELETE` | `/api/categories/delete/:id` | Delete a category |

### Brands
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/brands/all` | All brands |
| `GET` | `/api/brands/:id` | Single brand |
| `POST` | `/api/brands/add` | Add a brand |
| `DELETE` | `/api/brands/delete/:id` | Delete a brand |

### Flash Sales
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/flash-sale-products/all` | All flash sale products |
| `POST` | `/api/flash-sale-products/add` | Add a flash sale product |
| `DELETE` | `/api/flash-sale-products/delete/:id` | Remove a flash sale product |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/carts/add` | Add item to cart |
| `GET` | `/api/carts/:userId` | Get cart items |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/wishlists/add` | Add to wishlist |
| `DELETE` | `/api/wishlists/:id` | Remove from wishlist |
| `GET` | `/api/wishlists/:userId` | Get wishlist |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders/place` | Place order (single product) |
| `POST` | `/api/orders/from-cart` | Place order from selected cart items |
| `POST` | `/api/orders/from-cart/all` | Place order from entire cart |
| `GET` | `/api/orders/all` | All orders (admin) |
| `GET` | `/api/orders/user/:userId` | Orders for a user |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews/add` | Submit a review |
| `GET` | `/api/reviews/list?product_id=:id` | Get reviews for a product |

---

## Features

### Admin Panel (React — port 3001)
- Secure login with session persistence
- Dashboard with live stats and recent orders overview
- Products: view, search, add (category/brand auto-fill), delete with inline confirm
- Categories: view, search, add with thumbnail preview, delete
- Brands: view, search, add with thumbnail preview, delete
- Flash Sales: select existing product → auto-fills details, set discount %, calculates sale price, delete
- Orders: read-only table, filter by status (pending / confirmed / processing / delivered / cancelled), total revenue display
- Reviews: filter by product, star rating display with distribution chart

### Web App (React — port 3000)
- Login / Register / Forgot Password
- Home page with banner, flash sales, recommended products, categories, brands
- Product detail with reviews and add to cart / wishlist
- Cart with item selection and order summary
- Checkout with delivery location and payment method
- Wishlist
- Order history and order detail
- User profile, edit profile, change password
- Full-text product search
- Categories, Brands, All Products listing pages
- About Us, FAQs, Privacy Policy, Terms & Conditions
- Toast notifications, responsive layout, session persistence

### Mobile App (Flutter)
- Splash screen with animated logo and onboarding
- Login / Register / Forgot Password / Reset Password
- Home page: rotating banner, Recommended, Flash Sale, Brands, Categories
- Product detail with image, pricing, discount badge, size selection, reviews
- Add to Cart / Buy Now with quantity and location picker
- Cart with checkbox selection and order summary
- Checkout with eSewa / Khalti / Cash on Delivery
- Wishlist — add, remove, tap to view product
- Order list and order detail with 4-step status tracker
- User profile — edit, change password, notifications, logout
- Full-text product search
- About Us, FAQs, Privacy Policy, Terms & Conditions

### Backend (Dart Shelf — port 8080)
- RESTful JSON API with shelf_router
- MySQL persistence via mysql1 driver
- Auto table creation and admin account seeding on startup
- bcrypt password hashing for users
- SHA-256 password hashing for admin
- Email OTP for password reset (via mailer)
- Product recommendation engine (based on user activity)
- CORS enabled for all web clients

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Flutter 3.x, Dart 3.5+, BLoC pattern, GetX navigation |
| Backend | Dart 3.6+, Shelf, shelf_router, mysql1, bcrypt, crypto, mailer |
| Database | MySQL 8.x |
| Web App | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios |
| Admin Panel | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios, Lucide React |
| State | React Context API + localStorage |
| Notifications | react-hot-toast (web/admin), SnackBar (mobile) |

---

## Troubleshooting

### `Access denied for user 'root'@'localhost'`
Your MySQL root password doesn't match the config. Update `backend/lib/database/db.dart` with your actual password, or reset the MySQL root password.

### `Connection refused` on port 8080
The backend isn't running. Start it with `dart run bin/server.dart` from the `backend/` directory.

### Admin panel login fails
Make sure the backend is running. On first startup it automatically seeds the admin account. If you see `✅ Admin credentials ready` in the backend logs, the account exists and login should work.

### Flutter: `No devices found`
- Android: open Android Studio → AVD Manager → start a virtual device, or plug in a physical device with USB debugging enabled.
- iOS (macOS only): open Xcode → open Simulator.

### Web app shows empty home page
The backend is not running. Make sure Terminal 1 shows `Server running on http://0.0.0.0:8080` before opening the web app.

### `dart pub get` fails on Windows
Ensure Dart is in your PATH. Open a new Command Prompt after installation and try again.

### Port 3000 already in use
Change the port in `nepstyle_web/vite.config.js`:
```js
server: { port: 3002 }
```

### Port 3001 already in use
Change the port in `admin/vite.config.js`:
```js
server: { port: 3002 }
```

### Port 8080 already in use
Change the port in `backend/bin/server.dart` and update the `BASE_URL` in both `nepstyle_web/src/api/index.js` and `admin/src/api/index.js`.

# NepStyle Ecommerce

A full-stack fashion ecommerce platform built for the Nepali market, consisting of three parts that work together:

- **`backend/`** — REST API built with Dart Shelf + MySQL
- **`nepstyle/`** — Flutter mobile app (Android & iOS)
- **`nepstyle_web/`** — React web app (runs in any browser)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Flutter Mobile App Setup](#flutter-mobile-app-setup)
7. [React Web App Setup](#react-web-app-setup)
8. [Running Everything Together](#running-everything-together)
9. [API Reference](#api-reference)
10. [Features](#features)
11. [Tech Stack](#tech-stack)

---

## Architecture Overview

```
Browser / Mobile App
        │
        ▼
React Web (port 3000)   Flutter Mobile App
        │                       │
        └──────────┬────────────┘
                   ▼
        Dart Shelf API (port 8080)
                   │
                   ▼
            MySQL Database
            (db: nepstyle)
```

The web app proxies all `/api` requests to the backend. The Flutter app calls the backend directly.

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

### 4. Node.js 18+ and npm (for web app only)

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
│   │   │   └── db.dart       # MySQL connection config
│   │   ├── models/           # Data models (User, Product, Order, etc.)
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
├── nepstyle_web/             # React web app
│   ├── src/
│   │   ├── api/              # Axios API calls (index.js)
│   │   ├── components/       # Navbar, Footer, ProductCard, etc.
│   │   ├── context/          # AuthContext, CartContext, WishlistContext
│   │   └── pages/            # One file per page/route
│   ├── vite.config.js        # Vite config + /api proxy to backend
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

The backend creates tables automatically when the server first starts (via `db.dart`). You can also run the schema manually if you prefer:

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

This inserts 10 records into each table: categories, brands, users, products, flash sale products, and reviews.

### Changing DB Credentials

If you want to use a different MySQL username or password, edit **one file**:

```
backend/lib/database/db.dart
```

```dart
// Change these values to match your MySQL setup
static const String host = 'localhost';
static const int port = 3306;
static const String user = 'root';
static const String password = 'password';
static const String db = 'nepstyle';
```

---

## Backend Setup

```bash
cd backend
dart pub get
dart run bin/server.dart
```

The server starts on **http://localhost:8080**.

You should see:
```
Server listening on port 8080
```

**Windows note:** Use **Command Prompt** or **PowerShell** — not Git Bash, as it can interfere with Dart's stdin handling.

### Running as a background service

**macOS:**
```bash
nohup dart run bin/server.dart > backend.log 2>&1 &
echo $! > backend.pid   # save PID to stop it later
kill $(cat backend.pid) # stop it
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
// const String baseUrl = 'http://localhost:8080'; // iOS simulator / physical device on same network
// const String baseUrl = 'http://192.168.x.x:8080'; // replace with your machine's LAN IP for physical device
```

| Target device | URL to use |
|---|---|
| Android emulator | `http://10.0.2.2:8080` (emulator maps this to host `localhost`) |
| iOS simulator | `http://localhost:8080` |
| Physical Android/iOS | `http://<your-machine-LAN-IP>:8080` (e.g. `192.168.1.5:8080`) |

Find your LAN IP:
- **macOS:** `ipconfig getifaddr en0`
- **Windows:** `ipconfig` → look for IPv4 Address

### 3. Run on a device or emulator

```bash
flutter devices          # list available devices
flutter run -d <device>  # run on a specific device
```

Or just `flutter run` to pick interactively.

### Building a release APK (Android)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Building for iOS (macOS only)

```bash
flutter build ios --release
# Then open nepstyle/ios/Runner.xcworkspace in Xcode to archive and distribute
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

The web app starts on **http://localhost:3000**.

All requests to `/api/*` are automatically proxied to `http://localhost:8080` (configured in `vite.config.js`), so the backend must be running.

### 3. Build for production

```bash
npm run build
# Output files are in nepstyle_web/dist/
```

To preview the production build locally:
```bash
npm run preview
```

### Deploying the web app

Copy the contents of `nepstyle_web/dist/` to any static hosting provider (Netlify, Vercel, Nginx, Apache, etc.).

**Important:** Set your hosting provider's rewrite rule so that all paths serve `index.html` (required for React Router):

```
/* → /index.html
```

For **Nginx**, add inside your `server {}` block:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

In production, set the backend URL in `nepstyle_web/src/api/index.js`:
```js
const api = axios.create({
  baseURL: 'https://your-production-api-url.com',
});
```

---

## Running Everything Together

Open **three separate terminals** and run each command in its own terminal:

### Terminal 1 — Backend
```bash
cd backend
dart run bin/server.dart
```

### Terminal 2 — Web app
```bash
cd nepstyle_web
npm run dev
```

### Terminal 3 — Flutter app
```bash
cd nepstyle
flutter run
```

Then open your browser at **http://localhost:3000** for the web app, or use your emulator/device for the mobile app.

---

## API Reference

All endpoints are prefixed with the server base `http://localhost:8080`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with email & password |
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/forgot-password` | Send OTP to email |
| `PUT` | `/auth/reset-password` | Reset password with OTP |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/:id` | Get user profile |
| `PUT` | `/users/:id` | Update user profile |
| `PUT` | `/users/:id/change-password` | Change password |

### Home & Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/home/:userId` | Home data (recommended, flash sale, brands, categories) |
| `GET` | `/products` | All products |
| `GET` | `/products/:id` | Single product |
| `GET` | `/products/search/products/:query` | Full-text product search |
| `GET` | `/categories` | All categories |
| `GET` | `/categories/:id/products` | Products by category |
| `GET` | `/brands` | All brands |
| `GET` | `/brands/:id/products` | Products by brand |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/carts/add` | Add item to cart |
| `GET` | `/carts/:userId` | Get cart items |
| `DELETE` | `/carts/:cartId` | Remove item from cart |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders/place` | Place order from a single product |
| `POST` | `/orders/from-cart/all` | Place order from entire cart |
| `POST` | `/orders/from-cart` | Place order from selected cart items |
| `GET` | `/orders/:userId` | Get user's order list |
| `GET` | `/orders/detail/:orderId` | Get order detail |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/wishlists/add` | Add product to wishlist |
| `DELETE` | `/wishlists/:wishlistId` | Remove from wishlist |
| `GET` | `/wishlists/:userId` | Get user's wishlist |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reviews/add` | Submit a review |
| `GET` | `/reviews/list?product_id=:id` | Get reviews for a product |

---

## Features

### Mobile App (Flutter)
- Splash screen with animated logo and onboarding slides
- Login / Register / Forgot Password / Reset Password
- Home page: auto-rotating banner, Recommended, Flash Sale, Brands, Curated Products, Categories
- Product detail with image, pricing, discount badge, size selection, reviews
- Add to Cart / Buy Now modal with quantity and location picker
- Cart with checkbox item selection and order summary
- Checkout with location dropdown and payment method (eSewa / Khalti / Cash on Delivery)
- Wishlist — add, remove, tap to view product
- Order list and order detail with 4-step status tracker
- User profile — edit profile, change password, notifications toggle, logout
- Categories, Brands, All Products listing screens with filtering
- Full-text product search
- About Us, FAQs, Privacy Policy, Terms & Conditions
- Two-tone NepStyle text logo throughout (no image dependency)

### Web App (React)
- All the same screens as the mobile app, adapted for desktop/tablet/mobile web
- Sticky navbar with cart badge count and user avatar dropdown
- Responsive product grid layouts
- Global state via React Context API (auth, cart, wishlist)
- Session persistence via `localStorage`
- Toast notifications (react-hot-toast)

### Backend (Dart Shelf)
- RESTful JSON API with shelf_router
- MySQL persistence via mysql1 driver
- bcrypt password hashing
- Email OTP for password reset (via mailer)
- CORS enabled for web clients

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Flutter 3.x, Dart 3.5+, BLoC pattern, GetX navigation |
| Backend | Dart 3.6+, Shelf, shelf_router, mysql1, bcrypt, mailer |
| Database | MySQL 8.x |
| Web | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios |
| State (Web) | React Context API + localStorage |
| Icons (Web) | Lucide React |
| Notifications | react-hot-toast (web), SnackBar (mobile) |

---

## Troubleshooting

### `Access denied for user 'root'@'localhost'`
Your MySQL root password doesn't match the config. Either update `backend/lib/database/db.dart` with your actual password, or reset the MySQL root password.

### `Connection refused` on port 8080
The backend isn't running. Start it with `dart run bin/server.dart` from the `backend/` directory.

### Flutter: `No devices found`
- For Android: open Android Studio → AVD Manager → start a virtual device, or plug in a physical device with USB debugging enabled.
- For iOS (macOS only): open Xcode → open Simulator, or plug in an iPhone.

### Web app shows empty home page
The backend is not running or not reachable. Make sure Terminal 1 shows `Server listening on port 8080` before opening the web app.

### `dart pub get` fails on Windows
Ensure Dart is in your PATH. Open a new Command Prompt after installation and try again.

### Port 3000 already in use
Change the port in `nepstyle_web/vite.config.js`:
```js
server: { port: 3001, ... }
```

### Port 8080 already in use
Change the port in `backend/bin/server.dart` and update the proxy target in `nepstyle_web/vite.config.js` and the base URL in `nepstyle/lib/core/constants/strings.dart` to match.

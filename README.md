# NepStyle Ecommerce

A full-stack fashion ecommerce platform built for the Nepali market, consisting of five parts that work together:

- **`backend/`** — REST API built with Dart Shelf + MySQL
- **`nepstyle/`** — Flutter mobile app (Android & iOS)
- **`nepstyle_web/`** — React web app (runs in any browser)
- **`admin/`** — React CMS admin panel for managing all store data
- **`ai_service/`** — FastAPI AI service powering 16 intelligent shopping features

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [AI Service Setup](#ai-service-setup)
7. [Flutter Mobile App Setup](#flutter-mobile-app-setup)
8. [React Web App Setup](#react-web-app-setup)
9. [Admin Panel Setup](#admin-panel-setup)
10. [Running Everything Together](#running-everything-together)
11. [AI Features](#ai-features)
12. [API Reference](#api-reference)
13. [Features](#features)
14. [Tech Stack](#tech-stack)
15. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
Browser / Mobile App         Admin Browser
        │                         │
        ▼                         ▼
React Web (port 3000)    Admin Panel (port 3001)
        │    │                    │
        │    └──── AI Requests ───┤
        │                    ▼   │
        │          FastAPI AI Service
        │          (port 8000 / Railway)
        │                    │
        │           ┌────────┼────────┐
        │           │        │        │
        │        MariaDB  Qdrant   Gemini
        │        (shared  (vectors) (LLM)
        │        with backend)
        │
        └────────────────────────────┐
                     ▼              │
          Dart Shelf API (port 8080)│
                     │              │
                     ▼              │
              MySQL/MariaDB Database│
              (db: nepstyle) ◄──────┘
```

The web app communicates with both the Dart backend (products, orders, auth) and the AI service (search, recommendations, chat). The Flutter app calls the Dart backend only.

---

## Prerequisites

Install these before anything else. Instructions are given for both **macOS** and **Windows**.

### 1. MySQL / MariaDB 8.x

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

### 2. Python 3.11+ (for AI service)

| OS | Instructions |
|---|---|
| **macOS** | `brew install python@3.11` |
| **Windows** | Download from [python.org](https://www.python.org/downloads/), enable "Add Python to PATH" during install |

Verify: `python3 --version`

### 3. Dart SDK 3.6+

| OS | Instructions |
|---|---|
| **macOS** | `brew install dart` |
| **Windows** | Download the Dart SDK zip from [dart.dev/get-dart](https://dart.dev/get-dart), extract it, and add the `bin` folder to your `PATH` environment variable. |

Verify: `dart --version`

### 4. Flutter SDK 3.x (for mobile app only)

| OS | Instructions |
|---|---|
| **macOS** | Download from [flutter.dev](https://flutter.dev/docs/get-started/install/macos), extract, add `flutter/bin` to your `PATH`. |
| **Windows** | Download from [flutter.dev](https://flutter.dev/docs/get-started/install/windows), extract to `C:\flutter`, add `C:\flutter\bin` to your `PATH`. |

Verify: `flutter doctor`

### 5. Node.js 18+ and npm (for web app and admin panel)

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
│   │   └── seed.dart         # Database seeder
│   ├── lib/
│   │   ├── database/db.dart  # MySQL connection + auto table creation + admin seed
│   │   ├── models/           # Data models (User, Product, Order, Admin, etc.)
│   │   ├── routes/           # Route handlers (one file per resource)
│   │   └── services/         # Business logic
│   ├── seed.sql              # SQL seeder
│   └── pubspec.yaml
│
├── ai_service/               # FastAPI AI service
│   ├── main.py               # FastAPI app, router registration, middleware
│   ├── config.py             # Pydantic settings (reads from .env)
│   ├── db.py                 # Synchronous pymysql connection helpers
│   ├── middleware/auth.py    # X-AI-Key header guard
│   ├── prompts/base.py       # All LLM system prompts
│   ├── routers/              # One file per AI feature
│   │   ├── chat.py           # Conversational shopping assistant
│   │   ├── search.py         # Semantic + hybrid product search
│   │   ├── recommendations.py# Similar products + personalised feed
│   │   ├── reviews.py        # AI review summaries
│   │   ├── signals.py        # Trending + recently viewed
│   │   ├── compare.py        # Side-by-side product comparison
│   │   ├── product_qa.py     # Product Q&A (RAG over reviews)
│   │   ├── order_assistant.py# Natural-language order queries
│   │   ├── support.py        # Customer support chat
│   │   ├── agent.py          # Unified intent-routing AI agent
│   │   ├── stylist.py        # Complete the Look + Cart Recommendations
│   │   ├── insights.py       # Wishlist Intelligence + Search Suggestions
│   │   ├── size_advisor.py   # AI Size & Fit Advisor
│   │   ├── deals.py          # Smart Deals page
│   │   ├── brand_intel.py    # Brand & Category Intelligence
│   │   ├── collections.py    # AI Curated Collections
│   │   └── style_quiz.py     # AI Style Quiz
│   ├── services/
│   │   ├── llm.py            # Gemini API wrapper (generate + embed)
│   │   └── rag.py            # Hybrid search (Qdrant vector + MariaDB FULLTEXT)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
│
├── nepstyle/                 # Flutter mobile app
│   ├── lib/
│   │   ├── core/             # Theme, colors, routing, utilities
│   │   ├── features/
│   │   │   ├── authentication/
│   │   │   ├── cart/
│   │   │   ├── home/
│   │   │   ├── startUp/
│   │   │   ├── user profile/
│   │   │   └── wishlist/
│   │   └── main.dart
│   └── pubspec.yaml
│
├── nepstyle_web/             # React web app (customer-facing)
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js      # Dart backend API calls
│   │   │   └── aiApi.js      # AI service API calls
│   │   ├── components/       # Navbar, Footer, ProductCard, AI widgets
│   │   ├── context/          # AuthContext, CartContext, WishlistContext
│   │   └── pages/            # One file per page/route
│   ├── .env                  # VITE_AI_SERVICE_URL + VITE_AI_API_KEY
│   ├── vite.config.js
│   └── package.json
│
├── admin/                    # React CMS admin panel
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Database Setup

### Step 1 — Create the database

```bash
mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS nepstyle;"
```

**Windows note:** If `mysql` is not in your PATH, open **MySQL Command Line Client** from the Start menu and run the same command.

### Step 2 — Create the tables

The backend creates all tables automatically when the server first starts. You can also run the schema manually:

```bash
# macOS / Linux
mysql -u root -ppassword nepstyle < backend/seed.sql

# Windows
mysql -u root -ppassword nepstyle < backend\seed.sql
```

### Step 3 — Seed sample data (optional but recommended)

**Option A — SQL file (fastest):**
```bash
mysql -u root -ppassword nepstyle < backend/seed.sql
```

**Option B — Dart seeder:**
```bash
cd backend
dart run bin/seed.dart
```

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

Also update `ai_service/.env` with the same credentials (see [AI Service Setup](#ai-service-setup)).

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
✅ Admin credentials ready — email: admin@nepstyle.com  password: admin123
Server running on http://0.0.0.0:8080
```

**Windows note:** Use **Command Prompt** or **PowerShell** — not Git Bash.

---

## AI Service Setup

The AI service powers all intelligent shopping features in the web app. It connects to the same MariaDB database, a Qdrant vector store, and Google Gemini.

### External services required

| Service | Purpose | Free tier |
|---|---|---|
| **Google Gemini** | LLM for chat, recommendations, analysis | Yes — [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Qdrant Cloud** | Vector database for semantic search | Yes — [cloud.qdrant.io](https://cloud.qdrant.io) |

### Step 1 — Create the environment file

```bash
cd ai_service
cp .env.example .env   # or create .env manually
```

Edit `ai_service/.env`:

```env
# ── Database (same as Dart backend) ──────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=nepstyle

# ── Qdrant Cloud ──────────────────────────────────────────────────
# Create a free cluster at https://cloud.qdrant.io
QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=nepstyle_products

# ── Google Gemini ──────────────────────────────────────────────────
# Get free API key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# ── AI Service Auth ────────────────────────────────────────────────
# Any random secret — must match VITE_AI_API_KEY in the web app
AI_API_KEY=nepstyle_ai_2024_secret
```

### Step 2 — Install Python dependencies

```bash
cd ai_service
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3 — Index products into Qdrant (run once)

This embeds all products and uploads them to your Qdrant collection:

```bash
python qdrant_setup.py
```

This takes 1–5 minutes depending on the number of products. You only need to run it once, or after adding many new products.

### Step 4 — Start the AI service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service starts on **http://localhost:8000**.

Confirm it's running:
```bash
curl http://localhost:8000/health
# {"status":"ok","qdrant":"connected","db":"connected"}
```

### Step 5 — Point the web app at the local AI service

Edit `nepstyle_web/.env`:

```env
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_AI_API_KEY=nepstyle_ai_2024_secret
```

### Deploying to Railway (production)

The AI service includes a `railway.toml` and `Dockerfile` for one-command deployment:

```bash
cd ai_service
railway up
```

Set the same environment variables in the Railway dashboard under **Variables**.

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
// const String baseUrl = 'http://192.168.x.x:8080'; // physical device
```

| Target | URL |
|---|---|
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://localhost:8080` |
| Physical device | `http://<your-LAN-IP>:8080` |

### 3. Run

```bash
flutter devices
flutter run -d <device>
```

### Building a release APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

---

## React Web App Setup

### 1. Install dependencies

```bash
cd nepstyle_web
npm install
```

### 2. Configure environment

Create or edit `nepstyle_web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_AI_API_KEY=nepstyle_ai_2024_secret
```

### 3. Start the development server

```bash
npm run dev
```

Opens at **http://localhost:3000**. Requires both the backend (port 8080) and AI service (port 8000) to be running.

### 4. Build for production

```bash
npm run build
# Output: nepstyle_web/dist/
```

---

## Admin Panel Setup

### 1. Install dependencies

```bash
cd admin
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Opens at **http://localhost:3001**.

### 3. Log in

| Field | Value |
|---|---|
| Email | `admin@nepstyle.com` |
| Password | `admin123` |

### 4. What you can manage

| Section | Actions |
|---|---|
| **Dashboard** | Live stats (products, categories, brands, flash sales, orders) + recent orders |
| **Products** | View, search, add (category/brand dropdowns), delete |
| **Categories** | View, search, add, delete |
| **Brands** | View, search, add, delete |
| **Flash Sales** | Add (select product + set discount %), delete |
| **Orders** | View, filter by status — read-only |
| **Reviews** | View, filter by product — read-only |

---

## Running Everything Together

Open **five separate terminals**:

| Terminal | Command | URL |
|---|---|---|
| 1 — Backend | `cd backend && dart run bin/server.dart` | http://localhost:8080 |
| 2 — AI Service | `cd ai_service && uvicorn main:app --port 8000 --reload` | http://localhost:8000 |
| 3 — Web App | `cd nepstyle_web && npm run dev` | http://localhost:3000 |
| 4 — Admin Panel | `cd admin && npm run dev` | http://localhost:3001 |
| 5 — Flutter (optional) | `cd nepstyle && flutter run` | — |

> The AI service must be running for all AI-powered features to work. The rest of the web app (auth, cart, orders, wishlist) works without it.

---

## AI Features

NepStyle includes 16 phases of AI features, all accessible from the web app at [nepstyleweb.vercel.app](https://nepstyleweb.vercel.app).

### How AI features work

Every AI request goes to the FastAPI AI service at `POST /ai/*` or `GET /ai/*`. The service authenticates the request via the `X-AI-Key` header, queries MariaDB and/or Qdrant for product data, calls Gemini for LLM generation, and returns structured JSON. The frontend renders the response inline — no page reload needed.

---

### Feature 1 — AI Semantic Search

**Where:** Search bar on any page, or the `/search` page  
**How to use:** Type a natural language query like _"warm jacket under Rs 3000"_ or _"red dress for a wedding"_ into the search bar and press Enter. The AI service runs a hybrid search (Qdrant vector similarity + MariaDB FULLTEXT) and returns the most semantically relevant products.

**API:** `POST /ai/search`
```json
{ "query": "warm jacket under 3000", "page": 1, "page_size": 20 }
```

---

### Feature 2 — AI Search Refinement Chips

**Where:** Below the result count on `/search` after a search  
**How to use:** After searching, you'll see chips like `✨ Refine: slim chinos · white sneakers · canvas tote`. Click any chip to instantly refine your search with that AI-suggested query.

**API:** `POST /ai/search-suggest`
```json
{ "query": "casual outfit" }
```

---

### Feature 3 — Personalised Product Feed

**Where:** Homepage — "Picked For You" section (logged-in users only)  
**How to use:** Just shop normally. Every product you view, add to cart, or wishlist is tracked as a signal. The AI builds a preference profile from these signals (purchase weight 4×, wishlist 3×, cart 2×, view 1×) and returns a personalised product feed.

**API:** `GET /ai/personalized/{userId}`

---

### Feature 4 — Trending Products

**Where:** Homepage — "Trending Now" section  
**How to use:** Visible to everyone without login. The AI aggregates recent user activity signals across all users to surface the most popular products right now.

**API:** `GET /ai/trending`

---

### Feature 5 — AI Review Summaries

**Where:** Product Detail page — below the reviews section  
**How to use:** Open any product with at least a few reviews. The AI reads all reviews and generates a one-paragraph summary highlighting the overall sentiment, top positives, and any common complaints. Summaries are cached for 60 minutes.

**API:** `GET /ai/products/{id}/reviews/summary`

---

### Feature 6 — Similar Products

**Where:** Product Detail page — "You Might Also Like" section  
**How to use:** Open any product page. The AI uses the product's name and description to find semantically similar products via vector search.

**API:** `GET /ai/products/{id}/similar`

---

### Feature 7 — Product Q&A

**Where:** Product Detail page — "Ask About This Product" section  
**How to use:** Type a question about the product, e.g. _"Is this jacket waterproof?"_ or _"What sizes run small?"_. The AI searches through the product's reviews to find relevant answers using RAG.

**API:** `POST /ai/product/{id}/ask`
```json
{ "question": "Is this jacket waterproof?" }
```

---

### Feature 8 — AI Size & Fit Advisor

**Where:** Product Detail page — between the stock info and the Add to Cart button  
**How to use:** Enter your height (cm), weight (kg), your usual size, and gender. The AI reads up to 60 sizing-related reviews for that product, analyses the community's fit feedback, and recommends your best size with a confidence level (high/medium/low), a fit note, and a sizing trend bar (runs small / true to size / runs large).

**API:** `POST /ai/products/{id}/size-advice`
```json
{
  "height_cm": 175,
  "weight_kg": 70,
  "usual_size": "M",
  "gender": "male"
}
```

---

### Feature 9 — Complete the Look

**Where:** Product Detail page — below Similar Products  
**How to use:** Open any product page. The AI acts as a stylist and suggests 3 complementary items that complete an outfit with this product. For example, viewing a jacket might suggest matching trousers, a shirt, and shoes.

**API:** `GET /ai/products/{id}/complete-look`

---

### Feature 10 — Smart Cart Recommendations

**Where:** Cart page — below the cart grid  
**How to use:** Add items to your cart, then visit the Cart page. The AI reads your cart contents and suggests up to 3 complementary products you haven't already added. Recommendations update whenever the cart size changes. Scroll the horizontal carousel to browse all suggestions.

**API:** `POST /ai/cart-recommendations`
```json
{ "product_names": ["Blue Denim Jacket", "White T-Shirt"], "exclude_ids": [12, 45] }
```

---

### Feature 11 — Wishlist Intelligence

**Where:** Wishlist page — above the wishlist grid  
**How to use:** Save items to your wishlist, then visit the Wishlist page. The AI card shows total savings on discounted items, a personalised style tip, and highlights the single best-value item to buy first.

**API:** `POST /ai/wishlist-insights`
```json
{ "items": [...wishlist products...], "user_id": 5 }
```

---

### Feature 12 — AI Order Assistant

**Where:** Orders page (`/orders`) — collapsible widget above the order list  
**How to use:** Click the widget to expand it, then ask questions about your orders in plain English:
- _"What is the status of my latest order?"_
- _"How much have I spent in total?"_
- _"Can I cancel my pending order?"_

The AI reads your order history from the database and answers directly.

**API:** `POST /ai/order-assistant`
```json
{ "message": "What is my latest order status?", "user_id": 5 }
```

---

### Feature 13 — Customer Support Chat

**Where:** `/support` page (linked in the footer under Info)  
**How to use:** Ask any question about NepStyle's policies — returns, shipping, payments, cancellations. The AI uses RAG over store policy documents to give accurate, cited answers. The conversation is multi-turn so you can ask follow-ups. Use "New chat" to reset.

**API:** `POST /ai/support`
```json
{ "message": "What is your return policy?", "history": [] }
```

---

### Feature 14 — Unified AI Chat Agent

**Where:** Floating chat bubble (bottom-right corner, every page)  
**How to use:** Click the ⚡ button and type anything. The agent classifies your intent:
- **Shopping** — searches for products and shows inline cards you can click to navigate
- **Order** — looks up your orders and answers tracking/status questions
- **Support** — answers policy questions
- **General** — open-ended conversation

Quick prompts are shown on first open: _"Show me popular jackets"_, _"Where is my order?"_, _"What's your return policy?"_, _"Recommend something under Rs 2,000"_.

**API:** `POST /ai/agent`
```json
{ "message": "Show me warm jackets under 2000", "user_id": 5 }
```

---

### Feature 15 — AI Smart Deals

**Where:** `/deals` page (Navbar — Deals link, Footer)  
**How to use:** Visit the Deals page to see all discounted products ranked by an AI deal score. Products are tiered automatically:
- 🔴 **Hot Deal** — 30%+ off
- 🟡 **Good Value** — 15–29% off
- 🟢 **On Sale** — 5–14% off

The page headline is AI-generated based on current deal data and refreshes every 30 minutes. Use the tabs to filter: All Deals / Hot Deals / New Arrivals.

**API:** `GET /ai/smart-deals?limit=24`

---

### Feature 16 — AI Brand Intelligence

**Where:** Brand Products page (`/brands/:id`) — below the brand header  
**How to use:** Click any brand from the Brands page. An AI card loads below the brand logo showing:
- An AI-written brand bio
- A specialty badge (e.g. "Premium Streetwear")
- A price tier (Budget / Mid-range / Premium)
- Star rating from all reviews
- Style tags (e.g. Casual, Trendy, Value for Money)

Click the card header to collapse/expand. Results are cached for 2 hours.

**API:** `GET /ai/brands/{id}/profile`

---

### Feature 17 — AI Category Intelligence

**Where:** Category Products page (`/categories/:id`) — below the category banner  
**How to use:** Click any category from the Categories page. An AI card loads showing:
- A 2-sentence overview of the category's style scene
- Trending style chips (e.g. Oversized Fit, Earth Tones)
- Top 3 brands in this category
- An interactive price range slider showing where the average sits

**API:** `GET /ai/categories/{id}/insights`

---

### Feature 18 — AI Curated Collections

**Where:** `/collections` page (Navbar — Collections link, Footer)  
**How to use:** Visit the Collections page to see 6 AI-curated thematic collections refreshed every 4 hours. Each collection card shows:
- An emoji and collection name
- A one-line description
- A 2×2 grid of product images
- A "Shop Collection" button that runs the AI's search query

Examples: "Monsoon Street Style", "Work Ready 2026", "Festival Vibes", "Budget Steals".

**API:** `GET /ai/collections`

---

### Feature 19 — AI Style Quiz

**Where:** `/style-quiz` (Footer Quick Links, Homepage banner)  
**How to use:** Take the 3-step quiz to get an AI-generated style profile and personalized product picks:

1. **Step 1 — Your Vibe:** Choose one: 🌿 Casual / 💼 Formal / ⚡ Sporty / ✨ Trendy
2. **Step 2 — Your Budget:** Choose one: Under Rs 1,000 / Rs 1,000–3,000 / Rs 3,000+
3. **Step 3 — Shopping For:** Multi-select: Tops / Bottoms / Outerwear / Footwear / Accessories

After submitting, the AI generates your personal style profile (e.g. "The Urban Casual") with a bio, and curates up to 12 matching products filtered to your budget. Click "Retake Quiz" to start over.

**API:** `POST /ai/style-quiz`
```json
{
  "style": "casual",
  "budget": "mid",
  "categories": ["tops", "bottoms"],
  "user_id": 5
}
```

---

## API Reference

### Dart Backend — `http://localhost:8080/api`

#### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login |
| `PUT` | `/api/auth/update-profile` | Update profile |
| `PUT` | `/api/auth/change-password` | Change password |
| `POST` | `/api/auth/forgot-password` | Password reset |
| `POST` | `/api/admin/login` | Admin login |

#### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/all` | All products |
| `GET` | `/api/products/category/:id` | Products by category |
| `GET` | `/api/products/brand/:id` | Products by brand |
| `GET` | `/api/products/search/products/:query` | Full-text search |
| `GET` | `/api/products/recommendations/:userId` | Recommendations |
| `POST` | `/api/products/add` | Add product (admin) |
| `DELETE` | `/api/products/delete/:id` | Delete product (admin) |

#### Orders, Cart, Wishlist, Reviews
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/carts/add` | Add to cart |
| `GET` | `/api/carts/:userId` | Get cart |
| `POST` | `/api/wishlists/add` | Add to wishlist |
| `GET` | `/api/wishlists/:userId` | Get wishlist |
| `POST` | `/api/orders/place` | Place order |
| `POST` | `/api/orders/from-cart` | Order from cart |
| `GET` | `/api/orders/user/:userId` | User orders |
| `POST` | `/api/reviews/add` | Submit review |
| `GET` | `/api/reviews/list?product_id=:id` | Get reviews |

---

### AI Service — `http://localhost:8000/ai`

All AI endpoints require the header `X-AI-Key: <your AI_API_KEY>`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/ai/search` | Hybrid semantic product search |
| `POST` | `/ai/search-suggest` | AI search refinement chips |
| `GET` | `/ai/products/:id/similar` | Similar products (vector) |
| `GET` | `/ai/products/:id/reviews/summary` | AI review summary |
| `POST` | `/ai/product/:id/ask` | Product Q&A over reviews |
| `GET` | `/ai/products/:id/complete-look` | "Complete the Look" stylist |
| `POST` | `/ai/products/:id/size-advice` | Size & Fit Advisor |
| `GET` | `/ai/personalized/:userId` | Personalised product feed |
| `GET` | `/ai/trending` | Trending products |
| `GET` | `/ai/recently-viewed/:userId` | Recently viewed products |
| `POST` | `/ai/signals` | Track user activity signal |
| `POST` | `/ai/compare` | Side-by-side product comparison |
| `POST` | `/ai/chat` | Shopping assistant chat |
| `POST` | `/ai/agent` | Unified intent-routing AI agent |
| `POST` | `/ai/order-assistant` | Natural-language order queries |
| `POST` | `/ai/support` | Customer support chat |
| `POST` | `/ai/cart-recommendations` | Smart cart recommendations |
| `POST` | `/ai/wishlist-insights` | Wishlist intelligence card |
| `GET` | `/ai/smart-deals` | Smart deals with AI scoring |
| `GET` | `/ai/brands/:id/profile` | AI brand intelligence profile |
| `GET` | `/ai/categories/:id/insights` | AI category insights |
| `GET` | `/ai/collections` | AI curated collections (6 themes) |
| `POST` | `/ai/style-quiz` | Personalised style quiz results |

---

## Features

### Web App (React — port 3000)

**Shopping**
- Login / Register / Forgot Password
- Homepage with hero carousel, flash sales, categories, brands, trending, and personalised sections
- Product detail with image gallery, pricing, discount badge, reviews, size info
- Cart with item selection, checkout with delivery and payment method
- Wishlist, Order history, Order detail
- Full-text and AI semantic search
- Categories, Brands, All Products listing pages
- About Us, FAQs, Privacy Policy, Terms & Conditions, Customer Support

**AI-Powered**
- Semantic product search with natural language queries
- Search refinement chips after every search
- Personalised product feed (logged-in users)
- Trending products (all users)
- AI review summaries on product pages
- Similar products (vector-based)
- Product Q&A over reviews
- AI Size & Fit Advisor with community review analysis
- "Complete the Look" outfit suggestions
- Smart Cart Recommendations
- Wishlist Intelligence card with savings summary
- AI Order Assistant chatbot on Orders page
- Customer Support chat at `/support`
- Unified AI Chat Agent (floating ⚡ widget, every page)
- Smart Deals page (`/deals`) with deal scoring and tiers
- AI Brand Intelligence on every brand page
- AI Category Insights on every category page
- AI Curated Collections (`/collections`) — 6 themes, refreshed every 4 hours
- AI Style Quiz (`/style-quiz`) — personalised profile + product picks

### Admin Panel (React — port 3001)
- Secure login with session persistence
- Dashboard with live stats and recent orders
- Products: view, search, add, delete
- Categories, Brands: view, search, add, delete
- Flash Sales: add with discount %, delete
- Orders: filter by status, revenue display — read-only
- Reviews: filter by product, star distribution — read-only

### Mobile App (Flutter)
- Splash screen + onboarding
- Login / Register / Forgot Password / Reset Password
- Homepage: banner, Recommended, Flash Sale, Brands, Categories
- Product detail with size selection, reviews, add to cart / buy now
- Cart + checkout with eSewa / Khalti / Cash on Delivery
- Wishlist, Order list with 4-step status tracker
- User profile — edit, change password, logout
- Full-text product search

### Backend (Dart Shelf — port 8080)
- RESTful JSON API with shelf_router
- MySQL / MariaDB persistence
- Auto table creation and admin seeding on startup
- bcrypt password hashing (users), SHA-256 (admin)
- Email OTP for password reset
- Product recommendation engine (activity-based)
- CORS enabled

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Flutter 3.x, Dart 3.5+, BLoC, GetX navigation |
| Backend | Dart 3.6+, Shelf, shelf_router, mysql1, bcrypt, mailer |
| Database | MySQL / MariaDB 8.x |
| AI Service | Python 3.11+, FastAPI, Uvicorn, pymysql, google-genai, qdrant-client, tenacity |
| LLM | Google Gemini 2.5 Flash (generation) + gemini-embedding-001 (embeddings, 3072-dim) |
| Vector DB | Qdrant Cloud — hybrid search with Reciprocal Rank Fusion (RRF) |
| Web App | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios, Lucide React |
| Admin Panel | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios |
| Hosting | Vercel (web app) · Railway (backend + AI service) |
| State | React Context API + localStorage |
| Notifications | react-hot-toast (web/admin) |

---

## Troubleshooting

### AI service: `Connection refused` on port 8000
Make sure the AI service is running: `uvicorn main:app --port 8000 --reload` from the `ai_service/` directory with the venv activated.

### AI features return "Sorry, I'm having trouble right now"
1. Check the AI service is running and accessible at `VITE_AI_SERVICE_URL`.
2. Verify `VITE_AI_API_KEY` in `nepstyle_web/.env` matches `AI_API_KEY` in `ai_service/.env`.
3. Check the AI service logs — a missing `GEMINI_API_KEY` or Qdrant connection failure will show there.

### Qdrant: `Collection not found`
Run `python qdrant_setup.py` from `ai_service/` to create the collection and index all products. This is required before any vector search features work.

### AI search returns no results
The Qdrant collection may be empty. Run `python qdrant_setup.py` to index products, or try the fallback SQL search by using a simpler single-word query.

### `Access denied for user 'root'@'localhost'`
Your MySQL password doesn't match the config. Update both `backend/lib/database/db.dart` and `ai_service/.env`.

### `Connection refused` on port 8080
Start the backend: `dart run bin/server.dart` from the `backend/` directory.

### Admin panel login fails
Make sure the backend is running. On first startup it seeds the admin account — confirm you see `✅ Admin credentials ready` in the backend logs.

### Flutter: `No devices found`
- Android: open Android Studio → AVD Manager → start a virtual device, or plug in a physical device with USB debugging enabled.
- iOS (macOS only): open Xcode → open Simulator.

### Web app shows empty home page
Start the backend. Confirm Terminal 1 shows `Server running on http://0.0.0.0:8080`.

### Port already in use

| Port | Fix |
|---|---|
| 3000 (web) | Edit `nepstyle_web/vite.config.js`: `server: { port: 3002 }` |
| 3001 (admin) | Edit `admin/vite.config.js`: `server: { port: 3002 }` |
| 8000 (AI service) | Add `--port 8001` to the uvicorn command, update `.env` |
| 8080 (backend) | Edit `backend/bin/server.dart` and update `BASE_URL` in both web app configs |

# 🍜 DeliverIQ — Online Food Delivery Order Manager

> A fully functional, zero-dependency web application for managing food delivery orders with automatic nearest-order assignment, real-time filtering, and live analytics.

---

## 📸 Preview

| Dashboard | All Orders | Assign Delivery | Analytics |
|-----------|------------|-----------------|-----------|
| KPI cards + recent orders + quick assign | Card/table view with filters & sort | Live eligible list with distance bands | Donut chart, bar chart, top restaurants |

---

## 📁 Project Structure

```
deliveriq/
├── index.html      # Full HTML structure — tabs, modals, forms
├── style.css       # Complete design system — glassmorphism dark/light theme
├── app.js          # All application logic — state, algorithms, rendering
└── README.md       # This file
```

> **No frameworks. No bundlers. No node_modules.** Just three files — drop them anywhere and it works.

---

## ✅ Features

### Core Functionality (Assignment Requirements)

| Feature | Status | Details |
|---|---|---|
| Add Order | ✅ | Form with validation, category picker, distance slider |
| View All Orders | ✅ | Card grid + table toggle, always in sync |
| Filter by Paid / Unpaid | ✅ | Live chip-based status filter |
| Filter by Max Distance | ✅ | ≤ X km filter with instant results |
| `AssignDelivery(maxDistance)` | ✅ | Finds nearest unpaid order within range |
| "No order available" message | ✅ | Shown when no unpaid order qualifies |

### Extra Features

| Feature | Description |
|---|---|
| **Edit Orders** | Click ✏️ on any card to edit all fields in a modal |
| **Delete Orders** | Click 🗑 → confirmation modal → permanent delete |
| **Search** | Live search by restaurant name |
| **Sort Orders** | Newest, oldest, distance ↑↓, items ↑↓, name A–Z |
| **Card / Table View** | Toggle between grid cards and full data table |
| **Export CSV** | Download all orders as a `.csv` file |
| **Dark / Light Mode** | Full theme toggle |
| **Category Tags** | Emoji categories: Pizza, Sushi, Burgers, Mexican, Noodles, Healthy, Chicken |
| **Distance Slider** | Synced range slider + number input in the add/edit modal |
| **Live Eligible Preview** | Assign tab shows all unpaid orders split into in-range / out-of-range as you type |
| **Analytics Dashboard** | Donut chart, distance bar chart, top restaurants leaderboard, summary stats |
| **Keyboard Shortcuts** | `Ctrl+K` to open Add Order modal · `Esc` to close any modal |
| **Toast Notifications** | Success / error / warning feedback for every user action |
| **Sample Data** | 8 pre-loaded orders so reviewers can test immediately |

---

## 🗂 Data Model

Each order contains the following fields:

| Field | Type | Description |
|---|---|---|
| `orderId` | `string` | Auto-generated unique ID (e.g. `ORD-0001`) |
| `restaurantName` | `string` | Name of the restaurant |
| `itemCount` | `number` | Number of items in the order |
| `isPaid` | `boolean` | `true` = paid · `false` = unpaid |
| `deliveryDistance` | `number` | Distance in kilometres |
| `category` | `string` | Emoji category tag (e.g. `🍕 Pizza`) |
| `createdAt` | `number` | Unix timestamp for sorting |

---

## ⚡ Algorithm — `AssignDelivery(maxDistance)`

```
AssignDelivery(maxDist):

  Step 1 → allUnpaid  = orders.filter(o => o.isPaid === false)

  Step 2 → candidates = allUnpaid.filter(o => o.deliveryDistance <= maxDist)

  Step 3 → if candidates.length === 0:
               display "No order available"
               return

  Step 4 → nearest = candidates.reduce(
               (a, b) => a.deliveryDistance <= b.deliveryDistance ? a : b
             )

  Step 5 → assign nearest · highlight card in UI · show result in output panel
```

**Key rules:**
- Only `isPaid === false` orders are ever considered — paid orders are never assigned
- If multiple orders share the exact same minimum distance, the first one by insertion order wins
- The assigned card is highlighted gold across all views (Orders tab and Dashboard)
- The output panel clearly shows the assigned order ID, restaurant name, distance, and item count

---

## 🖥 UI Screens

### 1. Dashboard
The home screen gives a full live overview:
- **KPI cards** — Total Orders, Unpaid, Paid, Average Distance
- **Recent Orders** — last 5 orders with distance, status, and time-ago label
- **Quick Assign panel** — run `AssignDelivery(maxDistance)` without leaving the dashboard

### 2. All Orders
Full order management screen:
- **Search bar** — filter by restaurant name in real time
- **Status chips** — All / Unpaid / Paid
- **Distance filter** — show only orders within ≤ X km
- **Sort dropdown** — 7 sort options (newest, oldest, distance ↑↓, items ↑↓, name A–Z)
- **View toggle** — Card grid (⊞) or Table view (☰)
- **Per-card actions** — Edit (✏️) and Delete (🗑) buttons
- **Export CSV** — download the full dataset as a spreadsheet

### 3. Assign Delivery
The core assignment screen:
- **Max distance input** — live-filters the eligible list as you type
- **Assign button** — runs the algorithm and shows the result
- **Output panel** — shows the assigned order details or "No order available"
- **Eligible Orders list** — all unpaid orders split into two clear bands:
  - ✅ **Within range** — sorted nearest-first, winner tagged with `NEAREST` badge
  - 🚫 **Beyond range** — shown dimmed so you can see what's just outside the cutoff

### 4. Analytics
Data insights across all orders:
- **Donut chart** — Paid vs Unpaid visual breakdown with legend
- **Bar chart** — order count by distance range (0–2 km, 2–5 km, 5–10 km, 10–20 km, 20+ km)
- **Top Restaurants** — leaderboard by order volume with proportional bar indicators
- **Summary Statistics** — total orders, paid/unpaid split, avg/min/max distance, avg items, total items

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 |
| Styling | Pure CSS3 (custom properties, glassmorphism, keyframe animations) |
| Logic | Vanilla JavaScript ES6+ (`'use strict'`, no frameworks) |
| Fonts | Google Fonts — Clash Display · DM Sans · JetBrains Mono |
| Charts | Native Canvas 2D API (no external chart library) |
| Build tool | **None** |
| Dependencies | **None** — zero npm packages |

---
Live at: `https://vocal-pie-bcaa2d.netlify.app/`
---
## 💻 Running Locally

No server required for basic use — open the file directly:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/deliveriq.git
cd deliveriq

# Open in browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `⌘ + K` | Open "Add New Order" modal |
| `Esc` | Close any open modal |

---

## 🔍 Error Handling

| Scenario | Behaviour |
|---|---|
| Empty restaurant name | Red inline error · save is blocked |
| Item count < 1 or empty | Red inline error · save is blocked |
| Negative or missing distance | Red inline error · save is blocked |
| Invalid max distance in Assign | Warning toast · output panel shows error state |
| No unpaid orders in range | Output panel shows **"No order available"** + warning toast |
| No orders to export | Warning toast · export is blocked |
| Closing modal without saving | All fields reset cleanly — no partial state leaks |

---

## 📊 Pre-loaded Sample Data

The app ships with 8 sample orders so reviewers can test all features immediately:

| Restaurant | Category | Distance | Items | Status |
|---|---|---|---|---|
| Ramen Republic | 🍜 Noodles | 0.9 km | 3 | ✗ Unpaid |
| Pizza Palace | 🍕 Pizza | 1.2 km | 2 | ✗ Unpaid |
| Burger Barn | 🍔 Burgers | 2.5 km | 3 | ✗ Unpaid |
| Noodle Hub | 🍜 Noodles | 3.1 km | 1 | ✓ Paid |
| Sushi Spot | 🍣 Sushi | 4.8 km | 5 | ✓ Paid |
| Chick Express | 🍗 Chicken | 5.5 km | 6 | ✓ Paid |
| Taco Town | 🌮 Mexican | 6.7 km | 4 | ✗ Unpaid |
| Greens & Co. | 🥗 Healthy | 8.3 km | 2 | ✗ Unpaid |

**Quick test:** Go to Assign Delivery → type `3` → Burger Barn (2.5 km), Pizza Palace (1.2 km), and Ramen Republic (0.9 km) appear in-range. Click Assign → Ramen Republic is selected as nearest.

---

## 🗓 Suggested Git Commits (Minimum 3 Required)

```bash
git commit -m "feat: project setup with HTML structure, CSS design system, and JS state"
git commit -m "feat: add/edit/delete orders with validation and modal UI"
git commit -m "feat: implement AssignDelivery algorithm with live eligible order preview"
git commit -m "feat: filter panel — status chips, distance filter, search, and sort"
git commit -m "feat: analytics tab — canvas donut chart, bar chart, and summary stats"
git commit -m "feat: dark/light mode toggle, CSV export, and keyboard shortcuts"
git commit -m "fix: all tabs stay in sync after add/edit/delete via refreshAll()"
git commit -m "fix: eligible list correctly shows all unpaid orders with distance banding"
git commit -m "docs: add comprehensive README with deployment and algorithm docs"
```

---

## 📋 Evaluation Checklist

| Evaluation Area | How It's Met |
|---|---|
| **Functionality** | All 4 mandatory features fully working: Add, View, Filter, AssignDelivery |
| **Logic** | Correct nearest-unpaid algorithm using `Array.filter` + `Array.reduce` |
| **UI** | 4-tab navigation, responsive card + table views, modals, glassmorphism design |
| **Code Quality** | Single `state` object, pure render functions, `escHtml()` guards against XSS |
| **Error Handling** | Field-level validation, modal confirmation for destructive actions, toast feedback |
| **Explanation** | Algorithm fully documented above; code is commented throughout `app.js` |

---
Live Link --> https://vocal-pie-bcaa2d.netlify.app/
---

*Zero dependencies · Zero build steps · Pure HTML, CSS, and JavaScript*

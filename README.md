# AquaTrack Frontend Web Application

The modern web portal for **AquaTrack** (Sinacaban Water Supply System - SIWASS), built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

It provides three dedicated, independent user portals:
1. **Admin Portal (`/admin/*`)**: Operations dashboard, technician dispatch, verifications queue, billing CSV imports, advisories, and customer directory.
2. **Customer Portal (`/customer/*`)**: Account overview, billing history, issue reporting & cancellation, interruption notices, and profile & meter specs.
3. **Staff Web Portal (`/staff/*`)**: Field task assignments, instant meter number & QR token inspector, and completed mission history.

---

## 🎨 Design System & Constraints

- **Strict 3-Color Palette:**
  - **Brand Blue (`#1E6FD9`):** Primary brand accent, active tabs, buttons, and status indicators.
  - **White (`#FFFFFF`):** Backgrounds, cards, tables, and contrast elements.
  - **Black (`#000000`):** All typography, borders, dividers, and structural outlines.
- **Typography:** Strict **10px** base font size (`font-size: 10px !important;`) applied globally using **Inter** font family exclusively.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.x
- npm or pnpm

### 2. Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Ensure `.env` contains the backend API URL:
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
```
Builds the production distribution to `dist/` with full TypeScript type checks.

---

## 🧭 Application Routes

### Public & Authentication
- `/login`: Unified Institutional Gateway with Quick Live Demo credential buttons.
- `/register`: 2-step household customer self-registration.

### Admin Portal
- `/admin/dashboard`: Real-time KPI cards and recent incoming requests feed.
- `/admin/verification`: Review self-registered applicants, assign inventory water meters, or decline.
- `/admin/requests`: Technician dispatch board with status filters and staff assignment modal.
- `/admin/billing`: Monthly CSV batch upload, format validation, and batch publish lock.
- `/admin/interruptions`: Water service interruption notices manager & advisory broadcast modal.
- `/admin/customers`: Consumer directory with search, status filters, and detailed profile modals.

### Customer Portal
- `/customer/home`: Consumer overview, active request timeline with urgency derivations, and quick report modal.
- `/customer/bills`: Billing ledger with paid/unpaid status and printable official statement receipts.
- `/customer/requests`: Service requests history with live reporting and cancellation modal.
- `/customer/advisories`: Barangay-filtered emergency repairs and scheduled maintenance notices.
- `/customer/profile`: Household connection details, assigned physical meter specs, QR token, and PIN update.

### Staff Portal
- `/staff/tasks`: Field repair task queue with "Start Job" and "Resolve Job" modal.
- `/staff/scan`: Web-based meter lookup (by QR token or stamped casing number) with live household data and cubic meter reading logger.
- `/staff/history`: Archive of completed repairs and resolution reports.

---

## 🔑 Quick Demo Credentials

Use the one-click demo buttons on `/login` or sign in manually:

- **Admin:** `admin@siwass.gov` / `password123`
- **Staff:** `staff@siwass.gov` / `password123`
- **Customer:** `maria@example.com` / `password123`

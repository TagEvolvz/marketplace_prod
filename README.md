# FLOW — Digital Pharmacy, Supermarket & Cosmetics Store

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
The `.env` file is pre-configured with your Atlas, Cloudinary, Gmail and OpenRouter credentials.

### 2. Seed Categories (run once after first deploy)
```bash
cd backend
npm run seed:categories
```
This creates: Pharmacy (8 subcategories) + Supermarket (9) + Cosmetics (6)

### 3. Create Admin Account (run once)
```bash
cd backend
npm run seed:admin
```
Admin login: `admin@flow.com` / `Admin@Flow2024`

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Store Sections
| Section      | Products                                    |
|-------------|---------------------------------------------|
| Pharmacy    | Medicines, supplements, first aid, Rx drugs |
| Supermarket | Groceries, beverages, household supplies    |
| Cosmetics   | Skincare, haircare, makeup, hygiene         |

## Admin Panel
Visit `http://localhost:3000/admin/dashboard`

- **Dashboard** — Revenue, orders, customers, low-stock alerts
- **Products** — Add/edit/delete products with AI description generator
- **Orders** — View payment proofs, confirm/reject payments, update delivery status
- **Customers** — Enable/disable accounts

## Payment Flow
1. Customer places order → receives bank transfer details
2. Customer uploads payment screenshot
3. Admin reviews proof → confirms or rejects
4. Order moves to Processing → Out for Delivery → Delivered

## AI Features
- **Chat assistant** — floating button bottom-right, answers product questions
- **Smart search** — natural language search ("cheap paracetamol", "best rice")
- **Description generator** — admin clicks "Generate with AI" on product form
- **Inventory insights** — admin dashboard shows AI restocking advice

## API
Base URL: `http://localhost:5000/api/v1`
Health check: `http://localhost:5000/api/v1/health`
"# marketplace_prod" 

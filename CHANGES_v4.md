# v4 Changes

## Manual Payment System (replaces Stripe entirely)

### Backend
- `src/config/payment.ts` — bank account details and payment config (edit this file to set your bank details)
- `src/services/order.service.ts` — rewritten: createManualCheckout, uploadPaymentProof, confirmPayment, rejectPayment
- `src/models/index.ts` — Order schema extended: paymentProof, paymentProofUploadedAt, paymentConfirmedAt, paymentRejectedAt, paymentRejectionReason
- `src/types/index.ts` — PaymentMethod includes 'manual'; PaymentStatus includes 'confirmed', 'rejected', 'awaiting_confirmation'
- `src/controllers/index.ts` — orderController: getBankDetails, createCheckout (manual), uploadPaymentProof; adminController: confirmPayment, rejectPayment
- `src/routes/index.ts` — GET /orders/bank-details, POST /orders/my-orders/:id/upload-proof, PATCH /admin/orders/:id/confirm-payment, PATCH /admin/orders/:id/reject-payment
- `src/config/stripe.ts` — replaced with stub (no more Stripe dependency)

### Frontend
- `src/pages/CheckoutPage.tsx` — 3-step flow: Address → Review → Payment Instructions with bank details + proof upload
- `src/pages/OrderDetailPage.tsx` — shows payment status banner, upload proof panel, re-upload on rejection
- `src/services/api.ts` — added getBankDetails, uploadPaymentProof, adminAPI.confirmPayment, adminAPI.rejectPayment

## Animations (Framer Motion)

- `src/utils/motion.ts` — centralised variants: pageVariants, fadeIn, slideUp, slideInRight, staggerContainer, staggerItem, cardHover, buttonTap, scaleIn, heroText
- `src/App.tsx` — AnimatePresence wraps all routes; page transitions on every route change
- `src/pages/HomePage.tsx` — hero text cascade (heroText), category cards stagger, product grid stagger, promo banner fade
- `src/pages/ProductsPage.tsx` — filter sidebar slide-in, product grid stagger, animated pagination, mobile drawer slide
- `src/pages/admin/AdminDashboard.tsx` — stat cards scale-in with stagger delay, pending orders list stagger
- `src/pages/admin/AdminProducts.tsx` — product card grid stagger, form modal scale-in
- `src/pages/admin/AdminOrders.tsx` — order list stagger, proof modal scale-in, reject modal scale-in
- `src/pages/CheckoutPage.tsx` — step transitions AnimatePresence, stagger for order items, hero confirmation animation

## Admin Panel

- `src/pages/admin/AdminDashboard.tsx` — stat cards, pending payment review panel, quick action links
- `src/pages/admin/AdminProducts.tsx` — full CRUD: create/edit/delete products with image upload via modal
- `src/pages/admin/AdminOrders.tsx` — view proof image, confirm payment, reject with reason modal

## To update bank details
Edit `backend/src/config/payment.ts` — BANK_ACCOUNTS array.

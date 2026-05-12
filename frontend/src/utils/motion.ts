/**
 * motion.ts
 * Centralised animation variants used across the app.
 * Import from here — keeps animation values consistent and easy to tune.
 */

// ─── Page transitions ─────────────────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ─── Fade in ─────────────────────────────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

// ─── Slide up + fade ──────────────────────────────────────────────────────────
export const slideUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

// ─── Slide in from right (cart drawer, panels) ───────────────────────────────
export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, x: 40, transition: { duration: 0.25, ease: 'easeIn' } },
};

// ─── Staggered children container ─────────────────────────────────────────────
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

// ─── Staggered child item ─────────────────────────────────────────────────────
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

// ─── Card hover ────────────────────────────────────────────────────────────────
export const cardHover = {
  rest:  { y: 0,    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: { duration: 0.2, ease: 'easeOut' } },
  hover: { y: -4,   boxShadow: '0 12px 32px rgba(0,0,0,0.12)', transition: { duration: 0.25, ease: 'easeOut' } },
};

// ─── Button tap ───────────────────────────────────────────────────────────────
export const buttonTap = { scale: 0.97, transition: { duration: 0.1 } };

// ─── Scale in (modals, dropdowns) ─────────────────────────────────────────────
export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, scale: 0.94, transition: { duration: 0.15 } },
};

// ─── Hero text cascade ────────────────────────────────────────────────────────
export const heroText = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] } },
});

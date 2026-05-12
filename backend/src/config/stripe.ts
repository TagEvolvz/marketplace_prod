/**
 * stripe.ts — stub
 * Stripe has been removed. Manual bank transfer is used instead.
 * This stub exists to prevent import errors from any legacy test files.
 */

export const createCheckoutSession = async () => {
  throw new Error('Stripe is not configured. Use manual payment instead.');
};

export const constructWebhookEvent = () => {
  throw new Error('Stripe is not configured.');
};

export const retrievePaymentIntent = async () => {
  throw new Error('Stripe is not configured.');
};

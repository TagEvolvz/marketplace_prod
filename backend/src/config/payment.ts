/**
 * payment.ts
 *
 * Manual bank transfer payment configuration.
 * Edit BANK_ACCOUNTS to reflect your actual bank details.
 * These are served to customers at checkout and on the payment instructions page.
 */

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  currency: string;
  instructions?: string;
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'main-usd',
    bankName: 'First National Bank',
    accountName: 'MarketPlace Inc.',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    swiftCode: 'FNBAUS33',
    currency: 'USD',
    instructions: 'Use your order number as the payment reference. Payment must be completed within 24 hours.',
  },
];

export const PAYMENT_CONFIG = {
  proofUploadRequired: true,
  expiryHours: 24,        // Hours customer has to upload proof before order auto-cancels
  currency: 'USD',
  currencySymbol: '$',
};

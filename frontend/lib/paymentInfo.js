// Merchant details shown to customers who pay by JazzCash / Easypaisa / bank transfer.
// Set these as NEXT_PUBLIC_* env vars on the frontend (Vercel project settings).
export const PAYMENT_INFO = {
  accountName: process.env.NEXT_PUBLIC_PAY_ACCOUNT_NAME || "",
  jazzcash: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "",
  easypaisa: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "",
  bankIban: process.env.NEXT_PUBLIC_BANK_IBAN || "",
};

export const hasPaymentInfo = () =>
  Boolean(
    PAYMENT_INFO.jazzcash ||
      PAYMENT_INFO.easypaisa ||
      (PAYMENT_INFO.bankName && PAYMENT_INFO.bankIban)
  );

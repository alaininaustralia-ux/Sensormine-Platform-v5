/**
 * Billing API Types
 */

export interface PaymentMethod {
  id: string;
  type: string;
  card: CardDetails | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: string;
  dueDate: string | null;
  paidAt: string | null;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  currency: string;
}

export interface Subscription {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingPortalRequest {
  returnUrl: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface AddPaymentMethodRequest {
  paymentMethodId: string;
  setAsDefault: boolean;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

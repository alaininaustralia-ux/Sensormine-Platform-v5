/**
 * Billing API Client
 */

import { apiClient } from './client';
import type {
  AddPaymentMethodRequest,
  BillingPortalRequest,
  BillingPortalResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  Invoice,
  PaymentMethod,
  Subscription,
} from './billing.types';

// Billing Service
export const billingApi = {
  // Get all payment methods
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const response = await apiClient.get<PaymentMethod[]>('/api/billing/payment-methods', {
      headers: {
        'X-Customer-Id': customerId,
      },
    });
    return response.data;
  },

  // Add a new payment method
  async addPaymentMethod(customerId: string, request: AddPaymentMethodRequest): Promise<PaymentMethod> {
    const response = await apiClient.post<PaymentMethod>('/api/billing/payment-methods', request, {
      headers: {
        'X-Customer-Id': customerId,
      },
    });
    return response.data;
  },

  // Remove a payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.delete(`/api/billing/payment-methods/${paymentMethodId}`);
  },

  // Set default payment method
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<PaymentMethod> {
    const response = await apiClient.put<PaymentMethod>(
      `/api/billing/payment-methods/${paymentMethodId}/default`,
      {},
      {
        headers: {
          'X-Customer-Id': customerId,
        },
      }
    );
    return response.data;
  },

  // Get all invoices
  async getInvoices(customerId: string, limit: number = 10): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>(`/api/billing/invoices?limit=${limit}`, {
      headers: {
        'X-Customer-Id': customerId,
      },
    });
    return response.data;
  },

  // Get a specific invoice
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/api/billing/invoices/${invoiceId}`);
    return response.data;
  },

  // Get customer subscription
  async getSubscription(customerId: string): Promise<Subscription | null> {
    try {
      const response = await apiClient.get<Subscription>('/api/billing/subscription', {
        headers: {
          'X-Customer-Id': customerId,
        },
      });
      return response.data;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create a billing portal session
  async createBillingPortalSession(customerId: string, request: BillingPortalRequest): Promise<BillingPortalResponse> {
    const response = await apiClient.post<BillingPortalResponse>('/api/billing/portal', request, {
      headers: {
        'X-Customer-Id': customerId,
      },
    });
    return response.data;
  },

  // Create a checkout session
  async createCheckoutSession(customerId: string, request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await apiClient.post<CreateCheckoutSessionResponse>('/api/billing/checkout', request, {
      headers: {
        'X-Customer-Id': customerId,
      },
    });
    return response.data;
  },
};

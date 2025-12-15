'use client';

import { useEffect, useState } from 'react';
import { billingApi } from '@/lib/api/billing';
import type { PaymentMethod, Invoice, Subscription } from '@/lib/api/billing.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, FileText, ExternalLink, Plus, Trash2, Star } from 'lucide-react';
import { formatDistance } from 'date-fns';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [customerId, setCustomerId] = useState<string>('');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // TODO: Get customer ID from auth context or user profile
      // For now using a placeholder
      const tempCustomerId = 'cus_placeholder'; 
      setCustomerId(tempCustomerId);

      const [pmData, invData, subData] = await Promise.all([
        billingApi.getPaymentMethods(tempCustomerId),
        billingApi.getInvoices(tempCustomerId, 10),
        billingApi.getSubscription(tempCustomerId),
      ]);

      setPaymentMethods(pmData);
      setInvoices(invData);
      setSubscription(subData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await billingApi.createBillingPortalSession(customerId, {
        returnUrl: window.location.href,
      });
      window.location.href = response.url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await billingApi.removePaymentMethod(paymentMethodId);
      await loadBillingData();
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await billingApi.setDefaultPaymentMethod(customerId, paymentMethodId);
      await loadBillingData();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'paid':
        return 'bg-green-500';
      case 'past_due':
      case 'unpaid':
        return 'bg-red-500';
      case 'draft':
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-500 mt-2">Manage your payment methods, invoices, and subscription</p>
        </div>
        <Button onClick={handleManageBilling}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Manage in Stripe
        </Button>
      </div>

      {/* Subscription Card */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{subscription.planName}</h3>
                  <p className="text-sm text-gray-500">
                    ${subscription.amount} / {subscription.interval}
                  </p>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Current Period</p>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                {subscription.cancelAt && (
                  <div>
                    <p className="text-sm text-gray-500">Cancels At</p>
                    <p className="font-medium text-red-600">
                      {new Date(subscription.cancelAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </div>
            <Button onClick={handleManageBilling} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payment methods added yet</p>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {pm.card?.brand?.toUpperCase()} •••• {pm.card?.last4}
                        </p>
                        {pm.isDefault && (
                          <Badge variant="outline">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {pm.card?.expMonth}/{pm.card?.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!pm.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(pm.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePaymentMethod(pm.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices yet</p>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="font-medium">Invoice #{invoice.number}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistance(new Date(invoice.created), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        ${invoice.amountDue.toFixed(2)} {invoice.currency.toUpperCase()}
                      </p>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoicePdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

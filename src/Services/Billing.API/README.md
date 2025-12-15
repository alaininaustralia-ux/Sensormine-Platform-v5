# Billing Integration with Stripe

## Overview

The Billing.API provides comprehensive Stripe integration for managing subscriptions, payment methods, and invoices directly from Stripe's platform.

## Features

- **Payment Methods Management**: Add, remove, and set default payment methods
- **Invoice Access**: View and download historical invoices
- **Subscription Management**: View current subscription details
- **Stripe Billing Portal**: Redirect users to Stripe's hosted billing portal for advanced management
- **Checkout Sessions**: Create checkout sessions for new subscriptions

## Setup

### 1. Stripe Configuration

Add your Stripe API keys to `appsettings.Development.json`:

```json
{
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_..."
  }
}
```

For production, use environment variables:

```bash
STRIPE__SECRETKEY=sk_live_...
STRIPE__PUBLISHABLEKEY=pk_live_...
STRIPE__WEBHOOKSECRET=whsec_...
```

### 2. Run the Service

```powershell
cd src/Services/Billing.API
dotnet run
```

The service will be available at: http://localhost:5294

### 3. Configure Customer ID

The frontend requires a Stripe Customer ID. You need to:

1. Create customers in Stripe when users sign up
2. Store the Stripe Customer ID in your Identity database
3. Pass the Customer ID from the frontend via the `X-Customer-Id` header

Update the frontend to get the actual customer ID:

```typescript
// In src/app/settings/billing/page.tsx
const { user } = useAuth(); // Get from your auth context
const customerId = user.stripeCustomerId; // Get from user profile
```

## API Endpoints

### Payment Methods

- `GET /api/billing/payment-methods` - List all payment methods
- `POST /api/billing/payment-methods` - Add a new payment method
- `DELETE /api/billing/payment-methods/{id}` - Remove a payment method
- `PUT /api/billing/payment-methods/{id}/default` - Set default payment method

### Invoices

- `GET /api/billing/invoices` - List invoices (with optional `?limit=` query param)
- `GET /api/billing/invoices/{id}` - Get specific invoice

### Subscription

- `GET /api/billing/subscription` - Get current subscription

### Billing Portal

- `POST /api/billing/portal` - Create Stripe billing portal session

### Checkout

- `POST /api/billing/checkout` - Create checkout session for subscription

## Frontend Usage

Access the billing page at: http://localhost:3020/settings/billing

The page displays:
- Current subscription status
- Payment methods with add/remove functionality
- Invoice history with download links
- Direct link to Stripe billing portal

## Stripe Billing Portal

The Stripe Billing Portal allows customers to:
- Update payment methods
- View invoices
- Update subscription
- Cancel subscription
- View billing history

Enable it in Stripe Dashboard: Settings → Billing → Customer Portal

## Integration with Identity

To fully integrate with your user system:

1. **Store Stripe Customer ID** in the users table:
   ```sql
   ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
   ```

2. **Create Stripe Customer on Registration**:
   ```csharp
   var customerService = new Stripe.CustomerService();
   var customer = await customerService.CreateAsync(new CustomerCreateOptions
   {
       Email = user.Email,
       Name = user.Name,
       Metadata = new Dictionary<string, string>
       {
           { "user_id", user.Id.ToString() },
           { "tenant_id", user.TenantId.ToString() }
       }
   });
   user.StripeCustomerId = customer.Id;
   ```

3. **Pass Customer ID from Frontend**:
   ```typescript
   const customerId = useAuth().user?.stripeCustomerId;
   ```

## Testing

Use Stripe test mode credentials. Test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`

## Security

- **Never expose secret keys** in frontend code
- Always validate the `X-Customer-Id` header matches the authenticated user
- Use HTTPS in production
- Verify webhook signatures for webhook endpoints

## Next Steps

1. Add webhook handling for real-time updates
2. Implement usage-based billing metering
3. Add subscription plan selection UI
4. Integrate with tenant quotas and limits
5. Add email notifications for billing events

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe.net SDK](https://github.com/stripe/stripe-dotnet)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

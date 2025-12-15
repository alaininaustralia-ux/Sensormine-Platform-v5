# Billing System Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Configure Stripe Keys

Create or update `src/Services/Billing.API/appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Stripe": {
    "SecretKey": "sk_test_YOUR_KEY_HERE",
    "PublishableKey": "pk_test_YOUR_KEY_HERE",
    "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET"
  }
}
```

Get your test keys from: https://dashboard.stripe.com/test/apikeys

### Step 2: Start the Billing API

```powershell
cd src/Services/Billing.API
dotnet run
```

The API will start on: **http://localhost:5294**

Swagger UI available at: **http://localhost:5294/swagger**

### Step 3: Access the Billing Page

With your frontend running (`npm run dev` in `src/Web/sensormine-web`), navigate to:

**http://localhost:3020/settings/billing**

---

## ⚠️ Important: Customer ID Setup

The billing page currently uses a placeholder Customer ID. For production use, you **must** integrate with your authentication system.

### Option A: Quick Test (Development Only)

Replace the placeholder in `src/app/settings/billing/page.tsx` with a real Stripe test customer ID:

```typescript
// In loadBillingData function
const tempCustomerId = 'cus_YOUR_TEST_CUSTOMER_ID'; // Get from Stripe dashboard
```

Create a test customer in Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/customers
2. Click "Add customer"
3. Copy the Customer ID (starts with `cus_`)

### Option B: Production Integration

See the full integration guide in [README.md](./README.md) for details on:
- Storing Stripe Customer ID in your database
- Creating customers on user registration
- Passing Customer ID from auth context

---

## 🧪 Test with Stripe Test Cards

Use these test card numbers in the Stripe billing portal:

| Card Number | Type | Result |
|-------------|------|--------|
| 4242 4242 4242 4242 | Visa | Success |
| 4000 0000 0000 0002 | Visa | Decline |
| 4000 0025 0000 3155 | Visa | 3D Secure Required |

- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC
- Use any ZIP code

---

## 📊 What You Can Do

### In the Billing Page
✅ View current subscription  
✅ List all payment methods  
✅ Set default payment method  
✅ Remove payment methods  
✅ View invoice history  
✅ Download invoices (PDF)  
✅ Open Stripe billing portal  

### In Stripe Billing Portal
✅ Add new payment methods  
✅ Update subscription plan  
✅ Cancel subscription  
✅ View full billing history  
✅ Download tax documents  

---

## 🔌 API Endpoints Available

All endpoints require `X-Customer-Id` header:

```bash
# Get payment methods
curl -X GET http://localhost:5294/api/billing/payment-methods \
  -H "X-Customer-Id: cus_test123"

# Get invoices
curl -X GET http://localhost:5294/api/billing/invoices?limit=10 \
  -H "X-Customer-Id: cus_test123"

# Get subscription
curl -X GET http://localhost:5294/api/billing/subscription \
  -H "X-Customer-Id: cus_test123"

# Create billing portal session
curl -X POST http://localhost:5294/api/billing/portal \
  -H "Content-Type: application/json" \
  -H "X-Customer-Id: cus_test123" \
  -d '{"returnUrl": "http://localhost:3020/settings/billing"}'
```

---

## 🐛 Troubleshooting

### "Customer ID is required"
Make sure you're passing a valid Stripe Customer ID. Update the placeholder in the frontend code.

### "No payment methods / invoices / subscription found"
This is normal if you haven't set up any billing data in Stripe yet. Use the billing portal to add payment methods and create subscriptions.

### "Invalid API Key"
Check that your Stripe API keys are correctly configured in `appsettings.Development.json`.

### Build errors in Visual Studio
Restore NuGet packages:
```powershell
dotnet restore src/Services/Billing.API/Billing.API.csproj
```

---

## 📚 Learn More

- [Full Implementation Documentation](../../docs/billing-implementation-summary.md)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

**Quick Links:**
- Backend API: http://localhost:5294
- Swagger UI: http://localhost:5294/swagger
- Frontend Page: http://localhost:3020/settings/billing
- Stripe Test Dashboard: https://dashboard.stripe.com/test

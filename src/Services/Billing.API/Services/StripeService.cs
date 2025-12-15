using Billing.API.Models;
using Stripe;
using Stripe.Checkout;

namespace Billing.API.Services;

public interface IStripeService
{
    Task<List<PaymentMethodDto>> GetPaymentMethodsAsync(string customerId);
    Task<PaymentMethodDto> AddPaymentMethodAsync(string customerId, string paymentMethodId, bool setAsDefault);
    Task RemovePaymentMethodAsync(string paymentMethodId);
    Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(string customerId, string paymentMethodId);
    Task<List<InvoiceDto>> GetInvoicesAsync(string customerId, int limit = 10);
    Task<InvoiceDto> GetInvoiceAsync(string invoiceId);
    Task<SubscriptionDto?> GetSubscriptionAsync(string customerId);
    Task<string> CreateBillingPortalSessionAsync(string customerId, string returnUrl);
    Task<CreateCheckoutSessionResponse> CreateCheckoutSessionAsync(string customerId, string priceId, string successUrl, string cancelUrl);
}

public class StripeService : IStripeService
{
    private readonly ILogger<StripeService> _logger;

    public StripeService(ILogger<StripeService> logger)
    {
        _logger = logger;
    }

    public async Task<List<PaymentMethodDto>> GetPaymentMethodsAsync(string customerId)
    {
        var paymentMethodService = new PaymentMethodService();
        var options = new PaymentMethodListOptions
        {
            Customer = customerId,
            Type = "card"
        };

        var paymentMethods = await paymentMethodService.ListAsync(options);

        // Get customer to check default payment method
        var stripeCustomerService = new Stripe.CustomerService();
        var customer = await stripeCustomerService.GetAsync(customerId);
        var defaultPaymentMethodId = customer.InvoiceSettings?.DefaultPaymentMethod?.Id;

        return paymentMethods.Data.Select(pm => new PaymentMethodDto
        {
            Id = pm.Id,
            Type = pm.Type,
            Card = pm.Card != null ? new CardDetails
            {
                Brand = pm.Card.Brand,
                Last4 = pm.Card.Last4,
                ExpMonth = (int)pm.Card.ExpMonth,
                ExpYear = (int)pm.Card.ExpYear
            } : null,
            IsDefault = pm.Id == defaultPaymentMethodId,
            CreatedAt = pm.Created
        }).ToList();
    }

    public async Task<PaymentMethodDto> AddPaymentMethodAsync(string customerId, string paymentMethodId, bool setAsDefault)
    {
        // Attach payment method to customer
        var paymentMethodService = new PaymentMethodService();
        var attachOptions = new PaymentMethodAttachOptions
        {
            Customer = customerId
        };
        var paymentMethod = await paymentMethodService.AttachAsync(paymentMethodId, attachOptions);

        // Set as default if requested
        if (setAsDefault)
        {
            var stripeCustomerService = new Stripe.CustomerService();
            var updateOptions = new CustomerUpdateOptions
            {
                InvoiceSettings = new CustomerInvoiceSettingsOptions
                {
                    DefaultPaymentMethod = paymentMethodId
                }
            };
            await stripeCustomerService.UpdateAsync(customerId, updateOptions);
        }

        return new PaymentMethodDto
        {
            Id = paymentMethod.Id,
            Type = paymentMethod.Type,
            Card = paymentMethod.Card != null ? new CardDetails
            {
                Brand = paymentMethod.Card.Brand,
                Last4 = paymentMethod.Card.Last4,
                ExpMonth = (int)paymentMethod.Card.ExpMonth,
                ExpYear = (int)paymentMethod.Card.ExpYear
            } : null,
            IsDefault = setAsDefault,
            CreatedAt = paymentMethod.Created
        };
    }

    public async Task RemovePaymentMethodAsync(string paymentMethodId)
    {
        var paymentMethodService = new PaymentMethodService();
        await paymentMethodService.DetachAsync(paymentMethodId);
    }

    public async Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(string customerId, string paymentMethodId)
    {
        var stripeCustomerService = new Stripe.CustomerService();
        var updateOptions = new CustomerUpdateOptions
        {
            InvoiceSettings = new CustomerInvoiceSettingsOptions
            {
                DefaultPaymentMethod = paymentMethodId
            }
        };
        await stripeCustomerService.UpdateAsync(customerId, updateOptions);

        var paymentMethodService = new PaymentMethodService();
        var paymentMethod = await paymentMethodService.GetAsync(paymentMethodId);

        return new PaymentMethodDto
        {
            Id = paymentMethod.Id,
            Type = paymentMethod.Type,
            Card = paymentMethod.Card != null ? new CardDetails
            {
                Brand = paymentMethod.Card.Brand,
                Last4 = paymentMethod.Card.Last4,
                ExpMonth = (int)paymentMethod.Card.ExpMonth,
                ExpYear = (int)paymentMethod.Card.ExpYear
            } : null,
            IsDefault = true,
            CreatedAt = paymentMethod.Created
        };
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(string customerId, int limit = 10)
    {
        var invoiceService = new InvoiceService();
        var options = new InvoiceListOptions
        {
            Customer = customerId,
            Limit = limit
        };

        var invoices = await invoiceService.ListAsync(options);

        return invoices.Data.Select(invoice => MapInvoiceToDto(invoice)).ToList();
    }

    public async Task<InvoiceDto> GetInvoiceAsync(string invoiceId)
    {
        var invoiceService = new InvoiceService();
        var invoice = await invoiceService.GetAsync(invoiceId);

        return MapInvoiceToDto(invoice);
    }

    public async Task<SubscriptionDto?> GetSubscriptionAsync(string customerId)
    {
        var subscriptionService = new SubscriptionService();
        var options = new SubscriptionListOptions
        {
            Customer = customerId,
            Status = "all",
            Limit = 1
        };

        var subscriptions = await subscriptionService.ListAsync(options);
        var subscription = subscriptions.Data.FirstOrDefault();

        if (subscription == null)
            return null;

        var plan = subscription.Items.Data.FirstOrDefault()?.Plan;

        return new SubscriptionDto
        {
            Id = subscription.Id,
            Status = subscription.Status,
            PlanName = plan?.Nickname ?? plan?.Product?.Name ?? "Unknown Plan",
            Amount = (plan?.Amount ?? 0) / 100m, // Convert from cents
            Currency = plan?.Currency ?? "usd",
            Interval = plan?.Interval ?? "month",
            CurrentPeriodStart = subscription.CurrentPeriodStart,
            CurrentPeriodEnd = subscription.CurrentPeriodEnd,
            CancelAt = subscription.CancelAt,
            CancelAtPeriodEnd = subscription.CancelAtPeriodEnd
        };
    }

    public async Task<string> CreateBillingPortalSessionAsync(string customerId, string returnUrl)
    {
        var sessionService = new Stripe.BillingPortal.SessionService();
        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = returnUrl
        };

        var session = await sessionService.CreateAsync(options);
        return session.Url;
    }

    public async Task<CreateCheckoutSessionResponse> CreateCheckoutSessionAsync(
        string customerId, 
        string priceId, 
        string successUrl, 
        string cancelUrl)
    {
        var sessionService = new SessionService();
        var options = new SessionCreateOptions
        {
            Customer = customerId,
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1
                }
            },
            Mode = "subscription",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl
        };

        var session = await sessionService.CreateAsync(options);

        return new CreateCheckoutSessionResponse
        {
            SessionId = session.Id,
            Url = session.Url
        };
    }

    private InvoiceDto MapInvoiceToDto(Invoice invoice)
    {
        return new InvoiceDto
        {
            Id = invoice.Id,
            Number = invoice.Number ?? string.Empty,
            Status = invoice.Status,
            AmountDue = invoice.AmountDue / 100m, // Convert from cents
            AmountPaid = invoice.AmountPaid / 100m,
            Currency = invoice.Currency,
            Created = invoice.Created,
            DueDate = invoice.DueDate,
            PaidAt = invoice.StatusTransitions?.PaidAt,
            InvoicePdfUrl = invoice.InvoicePdf,
            HostedInvoiceUrl = invoice.HostedInvoiceUrl,
            LineItems = invoice.Lines?.Data.Select(line => new InvoiceLineItemDto
            {
                Id = line.Id,
                Description = line.Description ?? string.Empty,
                Amount = line.Amount / 100m,
                Quantity = (int)(line.Quantity ?? 1),
                Currency = line.Currency
            }).ToList() ?? new List<InvoiceLineItemDto>()
        };
    }
}

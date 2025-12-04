using Sensormine.Billing.Models;

namespace Sensormine.Billing.Interfaces;

/// <summary>
/// Service for managing subscription plans and tenant subscriptions
/// </summary>
public interface ISubscriptionService
{
    Task<SubscriptionPlan> GetPlanAsync(Guid planId, CancellationToken cancellationToken = default);
    Task<List<SubscriptionPlan>> GetAllPlansAsync(CancellationToken cancellationToken = default);
    
    Task<string> CreateSubscriptionAsync(Guid tenantId, Guid planId, CancellationToken cancellationToken = default);
    Task UpdateSubscriptionAsync(Guid tenantId, Guid newPlanId, CancellationToken cancellationToken = default);
    Task CancelSubscriptionAsync(Guid tenantId, bool immediately = false, CancellationToken cancellationToken = default);
    
    Task<SubscriptionPlan?> GetTenantSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for tracking and reporting resource usage
/// </summary>
public interface IUsageMeteringService
{
    Task RecordUsageAsync(UsageRecord usage, CancellationToken cancellationToken = default);
    Task RecordUsageBatchAsync(IEnumerable<UsageRecord> usages, CancellationToken cancellationToken = default);
    
    Task<UsageSummary> GetUsageSummaryAsync(Guid tenantId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);
    Task<List<UsageRecord>> GetUsageHistoryAsync(Guid tenantId, string resourceType, DateTime start, DateTime end, CancellationToken cancellationToken = default);
    
    // Report usage to Stripe for metered billing
    Task ReportUsageToStripeAsync(Guid tenantId, string meterEventName, decimal quantity, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for invoice generation and management
/// </summary>
public interface IInvoicingService
{
    Task<Invoice> GenerateInvoiceAsync(Guid tenantId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);
    Task<Invoice> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task<List<Invoice>> GetTenantInvoicesAsync(Guid tenantId, int? limit = null, CancellationToken cancellationToken = default);
    
    Task<string> GetInvoicePdfUrlAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task SendInvoiceEmailAsync(Guid invoiceId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for interacting with Stripe API
/// </summary>
public interface IStripePaymentService
{
    // Customer management
    Task<string> CreateStripeCustomerAsync(Guid tenantId, string email, string name, CancellationToken cancellationToken = default);
    Task UpdateStripeCustomerAsync(string stripeCustomerId, Dictionary<string, string> metadata, CancellationToken cancellationToken = default);
    
    // Payment methods
    Task<PaymentMethod> AddPaymentMethodAsync(string stripeCustomerId, string paymentMethodId, CancellationToken cancellationToken = default);
    Task<List<PaymentMethod>> GetPaymentMethodsAsync(string stripeCustomerId, CancellationToken cancellationToken = default);
    Task RemovePaymentMethodAsync(string paymentMethodId, CancellationToken cancellationToken = default);
    Task SetDefaultPaymentMethodAsync(string stripeCustomerId, string paymentMethodId, CancellationToken cancellationToken = default);
    
    // Payments
    Task<string> ProcessPaymentAsync(string stripeCustomerId, decimal amount, string currency, CancellationToken cancellationToken = default);
    Task<string> CreatePaymentIntentAsync(decimal amount, string currency, string stripeCustomerId, CancellationToken cancellationToken = default);
    
    // Refunds
    Task<string> ProcessRefundAsync(string paymentIntentId, decimal? amount = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for handling Stripe webhooks
/// </summary>
public interface IStripeWebhookHandler
{
    Task HandleWebhookAsync(string payload, string signature, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for enforcing resource quotas
/// </summary>
public interface IQuotaEnforcementService
{
    Task<ResourceQuota> GetQuotaAsync(Guid tenantId, string resourceType, CancellationToken cancellationToken = default);
    Task<List<ResourceQuota>> GetAllQuotasAsync(Guid tenantId, CancellationToken cancellationToken = default);
    
    Task<bool> CheckQuotaAsync(Guid tenantId, string resourceType, decimal requestedAmount = 1, CancellationToken cancellationToken = default);
    Task IncrementUsageAsync(Guid tenantId, string resourceType, decimal amount = 1, CancellationToken cancellationToken = default);
    Task DecrementUsageAsync(Guid tenantId, string resourceType, decimal amount = 1, CancellationToken cancellationToken = default);
    
    Task UpdateQuotasFromPlanAsync(Guid tenantId, Guid planId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for managing promotional codes and discounts
/// </summary>
public interface IPromotionalCodeService
{
    Task<string> CreatePromotionalCodeAsync(string code, decimal discountPercent, DateTime? expiresAt, int? maxRedemptions, CancellationToken cancellationToken = default);
    Task<bool> ValidatePromotionalCodeAsync(string code, Guid tenantId, CancellationToken cancellationToken = default);
    Task ApplyPromotionalCodeAsync(string code, Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<string>> GetActiveCodesAsync(CancellationToken cancellationToken = default);
}

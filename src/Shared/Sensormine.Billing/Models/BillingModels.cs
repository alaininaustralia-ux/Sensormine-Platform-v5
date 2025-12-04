namespace Sensormine.Billing.Models;

/// <summary>
/// Represents a tenant's subscription plan
/// </summary>
public class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StripePriceId { get; set; } = string.Empty;
    public string StripeProductId { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public string Currency { get; set; } = "USD";
    
    // Resource quotas
    public int MaxDevices { get; set; }
    public long MaxStorageGB { get; set; }
    public int MaxApiCallsPerMonth { get; set; }
    public int MaxUsers { get; set; }
    public bool VideoProcessingEnabled { get; set; }
    public bool MLInferenceEnabled { get; set; }
    public bool CustomIntegrationsEnabled { get; set; }
    
    // Features
    public bool HasEmailSupport { get; set; }
    public bool Has24x7Support { get; set; }
    public bool HasSLA { get; set; }
    public bool HasCustomBranding { get; set; }
    public bool HasAdvancedAnalytics { get; set; }
}

/// <summary>
/// Represents a usage record for metering
/// </summary>
public class UsageRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime Timestamp { get; set; }
    public string ResourceType { get; set; } = string.Empty; // "devices", "api_calls", "storage", etc.
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty; // "count", "GB", "hours"
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// Aggregated usage summary for a tenant
/// </summary>
public class UsageSummary
{
    public Guid TenantId { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    
    public int ActiveDevices { get; set; }
    public long DataIngestionGB { get; set; }
    public int ApiCalls { get; set; }
    public long TimeSeriesStorageGB { get; set; }
    public long ObjectStorageGB { get; set; }
    public decimal VideoProcessingHours { get; set; }
    public int MLInferenceRequests { get; set; }
    public long DataEgressGB { get; set; }
    
    public Dictionary<string, decimal> CustomMetrics { get; set; } = new();
}

/// <summary>
/// Invoice model
/// </summary>
public class Invoice
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string StripeInvoiceId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "USD";
    
    public InvoiceStatus Status { get; set; }
    public List<InvoiceLineItem> LineItems { get; set; } = new();
    
    public string? StripeInvoicePdfUrl { get; set; }
}

public enum InvoiceStatus
{
    Draft,
    Open,
    Paid,
    Void,
    Uncollectible
}

/// <summary>
/// Line item on an invoice
/// </summary>
public class InvoiceLineItem
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

/// <summary>
/// Payment method information
/// </summary>
public class PaymentMethod
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "card"; // card, bank_account, etc.
    public string Last4 { get; set; } = string.Empty;
    public string? Brand { get; set; } // visa, mastercard, etc.
    public int? ExpMonth { get; set; }
    public int? ExpYear { get; set; }
    public bool IsDefault { get; set; }
}

/// <summary>
/// Resource quota for a tenant
/// </summary>
public class ResourceQuota
{
    public Guid TenantId { get; set; }
    public string ResourceType { get; set; } = string.Empty;
    public decimal SoftLimit { get; set; }
    public decimal HardLimit { get; set; }
    public decimal CurrentUsage { get; set; }
    
    public bool IsSoftLimitExceeded => CurrentUsage >= SoftLimit;
    public bool IsHardLimitExceeded => CurrentUsage >= HardLimit;
    public decimal PercentageUsed => HardLimit > 0 ? (CurrentUsage / HardLimit) * 100 : 0;
}

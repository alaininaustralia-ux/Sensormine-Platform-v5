namespace Sensormine.Core.Models;

/// <summary>
/// Represents a tenant (organization) in the system with hierarchical support
/// </summary>
public class Tenant : BaseEntity
{
    /// <summary>
    /// Display name of the tenant
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Parent tenant ID for sub-tenant hierarchy
    /// </summary>
    public Guid? ParentTenantId { get; set; }

    /// <summary>
    /// Stripe customer ID for billing
    /// </summary>
    public string? StripeCustomerId { get; set; }

    /// <summary>
    /// Current subscription plan ID
    /// </summary>
    public Guid? SubscriptionPlanId { get; set; }

    /// <summary>
    /// Tenant status
    /// </summary>
    public TenantStatus Status { get; set; } = TenantStatus.Active;

    /// <summary>
    /// Custom subdomain or slug
    /// </summary>
    public string? Subdomain { get; set; }

    /// <summary>
    /// Custom branding configuration
    /// </summary>
    public TenantBranding? Branding { get; set; }

    /// <summary>
    /// Tenant-specific settings and features
    /// </summary>
    public Dictionary<string, string> Settings { get; set; } = new();

    /// <summary>
    /// Contact email for billing and notifications
    /// </summary>
    public string ContactEmail { get; set; } = string.Empty;

    /// <summary>
    /// Billing address
    /// </summary>
    public Address? BillingAddress { get; set; }

    /// <summary>
    /// Is this tenant a trial account
    /// </summary>
    public bool IsTrial { get; set; }

    /// <summary>
    /// Trial end date
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>
    /// Tenant metadata
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public enum TenantStatus
{
    Active,
    Suspended,
    Cancelled,
    PendingActivation,
    PaymentFailed
}

/// <summary>
/// Tenant branding configuration
/// </summary>
public class TenantBranding
{
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? CustomCss { get; set; }
    public string? CustomDomain { get; set; }
}

/// <summary>
/// Address model
/// </summary>
public class Address
{
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

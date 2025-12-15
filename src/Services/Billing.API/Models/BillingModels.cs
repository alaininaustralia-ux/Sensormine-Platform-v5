namespace Billing.API.Models;

public class PaymentMethodDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public CardDetails? Card { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CardDetails
{
    public string Brand { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
}

public class InvoiceDto
{
    public string Id { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal AmountDue { get; set; }
    public decimal AmountPaid { get; set; }
    public string Currency { get; set; } = "usd";
    public DateTime Created { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? InvoicePdfUrl { get; set; }
    public string? HostedInvoiceUrl { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
}

public class InvoiceLineItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Quantity { get; set; }
    public string Currency { get; set; } = "usd";
}

public class SubscriptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public string Interval { get; set; } = string.Empty;
    public DateTime CurrentPeriodStart { get; set; }
    public DateTime CurrentPeriodEnd { get; set; }
    public DateTime? CancelAt { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
}

public class BillingPortalRequest
{
    public string ReturnUrl { get; set; } = string.Empty;
}

public class BillingPortalResponse
{
    public string Url { get; set; } = string.Empty;
}

public class AddPaymentMethodRequest
{
    public string PaymentMethodId { get; set; } = string.Empty;
    public bool SetAsDefault { get; set; }
}

public class CreateCheckoutSessionRequest
{
    public string PriceId { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class CreateCheckoutSessionResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

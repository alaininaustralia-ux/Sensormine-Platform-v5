using Billing.API.Models;
using Billing.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Billing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ILogger<BillingController> _logger;

    public BillingController(IStripeService stripeService, ILogger<BillingController> logger)
    {
        _stripeService = stripeService;
        _logger = logger;
    }

    /// <summary>
    /// Get all payment methods for a customer
    /// </summary>
    [HttpGet("payment-methods")]
    public async Task<ActionResult<List<PaymentMethodDto>>> GetPaymentMethods([FromHeader(Name = "X-Customer-Id")] string customerId)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var paymentMethods = await _stripeService.GetPaymentMethodsAsync(customerId);
            return Ok(paymentMethods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payment methods for customer {CustomerId}", customerId);
            return StatusCode(500, "Error retrieving payment methods");
        }
    }

    /// <summary>
    /// Add a new payment method
    /// </summary>
    [HttpPost("payment-methods")]
    public async Task<ActionResult<PaymentMethodDto>> AddPaymentMethod(
        [FromHeader(Name = "X-Customer-Id")] string customerId,
        [FromBody] AddPaymentMethodRequest request)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var paymentMethod = await _stripeService.AddPaymentMethodAsync(
                customerId, 
                request.PaymentMethodId, 
                request.SetAsDefault);
            
            return Ok(paymentMethod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding payment method for customer {CustomerId}", customerId);
            return StatusCode(500, "Error adding payment method");
        }
    }

    /// <summary>
    /// Remove a payment method
    /// </summary>
    [HttpDelete("payment-methods/{paymentMethodId}")]
    public async Task<IActionResult> RemovePaymentMethod(string paymentMethodId)
    {
        try
        {
            await _stripeService.RemovePaymentMethodAsync(paymentMethodId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing payment method {PaymentMethodId}", paymentMethodId);
            return StatusCode(500, "Error removing payment method");
        }
    }

    /// <summary>
    /// Set default payment method
    /// </summary>
    [HttpPut("payment-methods/{paymentMethodId}/default")]
    public async Task<ActionResult<PaymentMethodDto>> SetDefaultPaymentMethod(
        [FromHeader(Name = "X-Customer-Id")] string customerId,
        string paymentMethodId)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var paymentMethod = await _stripeService.SetDefaultPaymentMethodAsync(customerId, paymentMethodId);
            return Ok(paymentMethod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default payment method {PaymentMethodId}", paymentMethodId);
            return StatusCode(500, "Error setting default payment method");
        }
    }

    /// <summary>
    /// Get all invoices for a customer
    /// </summary>
    [HttpGet("invoices")]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices(
        [FromHeader(Name = "X-Customer-Id")] string customerId,
        [FromQuery] int limit = 10)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var invoices = await _stripeService.GetInvoicesAsync(customerId, limit);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices for customer {CustomerId}", customerId);
            return StatusCode(500, "Error retrieving invoices");
        }
    }

    /// <summary>
    /// Get a specific invoice
    /// </summary>
    [HttpGet("invoices/{invoiceId}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(string invoiceId)
    {
        try
        {
            var invoice = await _stripeService.GetInvoiceAsync(invoiceId);
            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice {InvoiceId}", invoiceId);
            return StatusCode(500, "Error retrieving invoice");
        }
    }

    /// <summary>
    /// Get customer subscription
    /// </summary>
    [HttpGet("subscription")]
    public async Task<ActionResult<SubscriptionDto>> GetSubscription([FromHeader(Name = "X-Customer-Id")] string customerId)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var subscription = await _stripeService.GetSubscriptionAsync(customerId);
            
            if (subscription == null)
                return NotFound("No subscription found");

            return Ok(subscription);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving subscription for customer {CustomerId}", customerId);
            return StatusCode(500, "Error retrieving subscription");
        }
    }

    /// <summary>
    /// Create a billing portal session
    /// </summary>
    [HttpPost("portal")]
    public async Task<ActionResult<BillingPortalResponse>> CreateBillingPortalSession(
        [FromHeader(Name = "X-Customer-Id")] string customerId,
        [FromBody] BillingPortalRequest request)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var url = await _stripeService.CreateBillingPortalSessionAsync(customerId, request.ReturnUrl);
            return Ok(new BillingPortalResponse { Url = url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating billing portal session for customer {CustomerId}", customerId);
            return StatusCode(500, "Error creating billing portal session");
        }
    }

    /// <summary>
    /// Create a checkout session for subscription
    /// </summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<CreateCheckoutSessionResponse>> CreateCheckoutSession(
        [FromHeader(Name = "X-Customer-Id")] string customerId,
        [FromBody] CreateCheckoutSessionRequest request)
    {
        if (string.IsNullOrEmpty(customerId))
            return BadRequest("Customer ID is required");

        try
        {
            var response = await _stripeService.CreateCheckoutSessionAsync(
                customerId,
                request.PriceId,
                request.SuccessUrl,
                request.CancelUrl);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session for customer {CustomerId}", customerId);
            return StatusCode(500, "Error creating checkout session");
        }
    }
}

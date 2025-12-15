namespace Billing.API.Services;

/// <summary>
/// Helper service for managing Stripe customers
/// Integrate this with your Identity.API
/// </summary>
public interface ICustomerService
{
    Task<string> CreateStripeCustomerAsync(Guid userId, string email, string name);
    Task<string> GetStripeCustomerIdAsync(Guid userId);
    Task UpdateStripeCustomerAsync(string customerId, string? email, string? name);
    Task DeleteStripeCustomerAsync(string customerId);
}

/// <summary>
/// Example implementation - integrate with your Identity database
/// </summary>
public class CustomerService : ICustomerService
{
    private readonly ILogger<CustomerService> _logger;
    // TODO: Add your Identity DbContext or repository

    public CustomerService(ILogger<CustomerService> logger)
    {
        _logger = logger;
    }

    public async Task<string> CreateStripeCustomerAsync(Guid userId, string email, string name)
    {
        try
        {
            var customerService = new Stripe.CustomerService();
            var customer = await customerService.CreateAsync(new Stripe.CustomerCreateOptions
            {
                Email = email,
                Name = name,
                Metadata = new Dictionary<string, string>
                {
                    { "user_id", userId.ToString() }
                }
            });

            // TODO: Save customer.Id to your Identity database
            // await _identityContext.Users
            //     .Where(u => u.Id == userId)
            //     .ExecuteUpdateAsync(u => u.SetProperty(x => x.StripeCustomerId, customer.Id));

            _logger.LogInformation("Created Stripe customer {CustomerId} for user {UserId}", customer.Id, userId);

            return customer.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Stripe customer for user {UserId}", userId);
            throw;
        }
    }

    public async Task<string> GetStripeCustomerIdAsync(Guid userId)
    {
        // TODO: Retrieve from your Identity database
        // var user = await _identityContext.Users
        //     .Where(u => u.Id == userId)
        //     .Select(u => u.StripeCustomerId)
        //     .FirstOrDefaultAsync();
        
        // return user ?? throw new InvalidOperationException($"User {userId} does not have a Stripe customer ID");

        await Task.CompletedTask;
        throw new NotImplementedException("Integrate with Identity database");
    }

    public async Task UpdateStripeCustomerAsync(string customerId, string? email, string? name)
    {
        try
        {
            var customerService = new Stripe.CustomerService();
            var options = new Stripe.CustomerUpdateOptions();

            if (!string.IsNullOrEmpty(email))
                options.Email = email;

            if (!string.IsNullOrEmpty(name))
                options.Name = name;

            await customerService.UpdateAsync(customerId, options);

            _logger.LogInformation("Updated Stripe customer {CustomerId}", customerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Stripe customer {CustomerId}", customerId);
            throw;
        }
    }

    public async Task DeleteStripeCustomerAsync(string customerId)
    {
        try
        {
            var customerService = new Stripe.CustomerService();
            await customerService.DeleteAsync(customerId);

            _logger.LogInformation("Deleted Stripe customer {CustomerId}", customerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Stripe customer {CustomerId}", customerId);
            throw;
        }
    }
}

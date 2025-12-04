# AI-Driven Development Workflow (TDD)

This workflow ensures consistent, test-driven development with clear state tracking between chat sessions.

---

## Phase 1: Story Planning (Before Writing Code)

### Step 1.1: Read Story Requirements
```powershell
# Open the user story document
code docs/user-stories.md

# Search for your story number (e.g., 12.2)
# Read:
# - Story description
# - Acceptance criteria
# - Dependencies
# - Story points
```

### Step 1.2: Check Current State
```powershell
# Review project context
code .agent/current-state.md

# Verify:
# - No blockers exist
# - Dependencies are completed
# - Story status is "Not Started"
```

### Step 1.3: Create Story Plan
Copy `.agent/story-templates/story-plan.md` and fill it out:

```powershell
# Create plan file
cp .agent/story-templates/story-plan.md .agent/story-12.2-plan.md

# Edit plan with:
# - Technical approach
# - Files to create/modify
# - Test strategy
# - Acceptance criteria breakdown
```

### Step 1.4: Review Architecture
```powershell
# Read relevant architecture sections
code docs/architecture.md

# Ensure your approach aligns with:
# - Microservices boundaries
# - Data flow patterns
# - Technology choices
# - Security requirements
```

---

## Phase 2: Red Phase (Write Failing Tests)

### Step 2.1: Create Test Project (if needed)
```powershell
# Example for Billing.API tests
dotnet new xunit -n Billing.API.Tests -o tests/Services/Billing.API.Tests
dotnet sln add tests/Services/Billing.API.Tests/Billing.API.Tests.csproj

# Add references
dotnet add tests/Services/Billing.API.Tests reference src/Services/Billing.API
dotnet add tests/Services/Billing.API.Tests package Moq
dotnet add tests/Services/Billing.API.Tests package FluentAssertions
dotnet add tests/Services/Billing.API.Tests package Microsoft.AspNetCore.Mvc.Testing
```

### Step 2.2: Write Unit Tests First
Following TDD principles, write tests for each acceptance criterion:

```csharp
// Example: tests/Services/Billing.API.Tests/StripePaymentServiceTests.cs
public class StripePaymentServiceTests
{
    [Fact]
    public async Task CreateStripeCustomer_WithValidTenant_ReturnsCustomerId()
    {
        // Arrange
        var mockStripeService = new Mock<IStripeClient>();
        var service = new StripePaymentService(mockStripeService.Object);
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Test Corp" };

        // Act
        var customerId = await service.CreateStripeCustomer(tenant);

        // Assert
        customerId.Should().NotBeNullOrEmpty();
        customerId.Should().StartWith("cus_");
    }
    
    [Fact]
    public async Task CreateStripeCustomer_WithNullTenant_ThrowsArgumentNullException()
    {
        // Arrange
        var service = new StripePaymentService(Mock.Of<IStripeClient>());

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => service.CreateStripeCustomer(null)
        );
    }
}
```

### Step 2.3: Write Integration Tests
```csharp
// Example: tests/Services/Billing.API.Tests/BillingApiIntegrationTests.cs
public class BillingApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_Subscriptions_WithValidData_ReturnsCreated()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new CreateSubscriptionRequest
        {
            TenantId = Guid.NewGuid(),
            PlanId = "price_1234",
            PaymentMethodId = "pm_card_visa"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/subscriptions", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

### Step 2.4: Run Tests (Should Fail)
```powershell
# Run tests for specific project
dotnet test tests/Services/Billing.API.Tests

# Expected: All tests fail (Red phase)
# Output should show: X passed, Y failed
```

---

## Phase 3: Green Phase (Make Tests Pass)

### Step 3.1: Implement Minimum Code
Write the simplest code to make tests pass. Focus on one test at a time.

```csharp
// Example: src/Services/Billing.API/Services/StripePaymentService.cs
public class StripePaymentService : IStripePaymentService
{
    private readonly IStripeClient _stripeClient;
    
    public StripePaymentService(IStripeClient stripeClient)
    {
        _stripeClient = stripeClient ?? throw new ArgumentNullException(nameof(stripeClient));
    }
    
    public async Task<string> CreateStripeCustomer(Tenant tenant)
    {
        if (tenant == null)
            throw new ArgumentNullException(nameof(tenant));
            
        var options = new CustomerCreateOptions
        {
            Email = tenant.ContactEmail,
            Name = tenant.Name,
            Metadata = new Dictionary<string, string>
            {
                { "tenant_id", tenant.Id.ToString() }
            }
        };
        
        var service = new CustomerService(_stripeClient);
        var customer = await service.CreateAsync(options);
        
        return customer.Id;
    }
}
```

### Step 3.2: Run Tests (Should Pass)
```powershell
# Run tests again
dotnet test tests/Services/Billing.API.Tests

# Expected: All tests pass (Green phase)
# Output: X passed, 0 failed
```

### Step 3.3: Verify All Acceptance Criteria
Go through each acceptance criterion from the story and ensure:
- A test exists for it
- The test passes
- The implementation is correct

---

## Phase 4: Refactor Phase (Improve Code Quality)

### Step 4.1: Apply Clean Code Principles
- Extract methods if functions are too long
- Remove duplication (DRY principle)
- Improve naming (clear, descriptive names)
- Add XML documentation comments
- Ensure proper error handling

```csharp
// Before
public async Task<string> CreateStripeCustomer(Tenant t)
{
    if (t == null) throw new ArgumentNullException(nameof(t));
    var o = new CustomerCreateOptions { Email = t.ContactEmail, Name = t.Name };
    var s = new CustomerService(_stripeClient);
    var c = await s.CreateAsync(o);
    return c.Id;
}

// After
/// <summary>
/// Creates a new Stripe customer for the specified tenant.
/// </summary>
/// <param name="tenant">The tenant to create a Stripe customer for.</param>
/// <returns>The Stripe customer ID.</returns>
/// <exception cref="ArgumentNullException">Thrown when tenant is null.</exception>
public async Task<string> CreateStripeCustomer(Tenant tenant)
{
    ArgumentNullException.ThrowIfNull(tenant);
    
    var customerOptions = BuildCustomerOptions(tenant);
    var customer = await CreateCustomerInStripe(customerOptions);
    
    return customer.Id;
}

private CustomerCreateOptions BuildCustomerOptions(Tenant tenant)
{
    return new CustomerCreateOptions
    {
        Email = tenant.ContactEmail,
        Name = tenant.Name,
        Metadata = new Dictionary<string, string>
        {
            { "tenant_id", tenant.Id.ToString() },
            { "created_at", DateTime.UtcNow.ToString("O") }
        }
    };
}

private async Task<Customer> CreateCustomerInStripe(CustomerCreateOptions options)
{
    var service = new CustomerService(_stripeClient);
    return await service.CreateAsync(options);
}
```

### Step 4.2: Add Dependency Injection
```csharp
// src/Services/Billing.API/Program.cs
builder.Services.AddScoped<IStripePaymentService, StripePaymentService>();
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("Stripe"));
builder.Services.AddSingleton<IStripeClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<StripeSettings>>().Value;
    return new StripeClient(settings.SecretKey);
});
```

### Step 4.3: Run Tests Again
```powershell
# Ensure refactoring didn't break anything
dotnet test tests/Services/Billing.API.Tests

# Expected: All tests still pass
```

---

## Phase 5: Integration & Documentation

### Step 5.1: Add API Endpoints
```csharp
// src/Services/Billing.API/Controllers/SubscriptionsController.cs
[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;
    
    [HttpPost]
    [ProducesResponseType(typeof(SubscriptionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSubscription(
        [FromBody] CreateSubscriptionRequest request)
    {
        var subscription = await _subscriptionService.CreateSubscription(
            request.TenantId,
            request.PlanId,
            request.PaymentMethodId
        );
        
        return CreatedAtAction(
            nameof(GetSubscription),
            new { id = subscription.Id },
            subscription
        );
    }
}
```

### Step 5.2: Add OpenAPI Documentation
```csharp
// src/Services/Billing.API/Program.cs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Billing API",
        Version = "v1",
        Description = "Handles billing, metering, subscriptions, and Stripe integration"
    });
    
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});
```

### Step 5.3: Add Health Checks
```csharp
builder.Services.AddHealthChecks()
    .AddCheck<StripeHealthCheck>("stripe")
    .AddCheck<DatabaseHealthCheck>("database");

app.MapHealthChecks("/health");
```

### Step 5.4: Run Full Test Suite
```powershell
# Run all tests in solution
dotnet test Sensormine.sln --logger "console;verbosity=detailed"

# Expected: All tests pass across all projects
```

---

## Phase 6: Completion & State Update

### Step 6.1: Create Completion Document
```powershell
# Move plan to completed stories
mv .agent/story-12.2-plan.md .agent/completed-stories/story-12.2.md

# Append completion summary
cat >> .agent/completed-stories/story-12.2.md << EOF

---

## Completion Summary

**Completed**: 2025-12-04
**Test Results**: 15 passed, 0 failed
**Coverage**: 92%

### Files Created
- src/Services/Billing.API/Services/StripePaymentService.cs
- src/Services/Billing.API/Controllers/SubscriptionsController.cs
- tests/Services/Billing.API.Tests/StripePaymentServiceTests.cs
- tests/Services/Billing.API.Tests/BillingApiIntegrationTests.cs

### Files Modified
- src/Services/Billing.API/Program.cs (DI registration)
- src/Services/Billing.API/appsettings.json (Stripe config)

### Acceptance Criteria Met
- [x] Stripe customer created for new tenants
- [x] Payment methods can be attached
- [x] Subscriptions can be created with plans
- [x] API endpoints return proper status codes
- [x] All tests pass

### Notes
- Stripe API key needs to be added to appsettings.Production.json
- Webhook endpoint still needs Story 12.9 implementation
EOF
```

### Step 6.2: Update Current State Document
```powershell
code .agent/current-state.md
```

Update the following sections:
1. **Last Updated** date
2. **Active Story** to "None (Ready to start)" or next story
3. Story table: Change status from 🔴 to ✅
4. **Completed** count
5. **Epic Completion** percentages
6. Add any blockers discovered

### Step 6.3: Commit Changes
```powershell
# Stage changes
git add -A

# Commit with story reference
git commit -m "[Story 12.2] Implement Stripe payment integration

- Add StripePaymentService with customer creation
- Implement subscription management endpoints
- Add comprehensive unit and integration tests
- Configure Stripe SDK in DI container
- Add health checks for Stripe connectivity

Tests: 15 passed, 0 failed
Coverage: 92%"

# Push to GitHub
git push origin master
```

### Step 6.4: Update GitHub Issue
```powershell
# Close the issue
gh issue close 191 --comment "Completed Story 12.2: Stripe Integration

✅ All acceptance criteria met
✅ 15 tests passing (92% coverage)
✅ Code reviewed and refactored
✅ Documentation updated

See commit: [SHA]"
```

---

## Phase 7: Ready for Next Story

### Step 7.1: Review Dependencies
Check `.agent/current-state.md` to see which stories are now unblocked by completing this story.

### Step 7.2: Select Next Story
Choose the next highest priority story that:
- Has all dependencies completed
- Has no blockers
- Aligns with current context (avoid context switching)

### Step 7.3: Update Current State
```powershell
code .agent/current-state.md

# Update "Active Story" field
# Example: "Active Story: 12.3 - Subscription Plan Management"
```

### Step 7.4: Return to Phase 1
Start the workflow again for the next story.

---

## Quick Reference Checklist

For each story, complete:

- [ ] Phase 1: Plan
  - [ ] Read story in docs/user-stories.md
  - [ ] Check .agent/current-state.md for context
  - [ ] Create story plan in .agent/
  - [ ] Review architecture docs
  
- [ ] Phase 2: Red (Write Tests)
  - [ ] Create/update test project
  - [ ] Write unit tests (should fail)
  - [ ] Write integration tests (should fail)
  - [ ] Run tests (verify they fail)
  
- [ ] Phase 3: Green (Implement)
  - [ ] Write minimum code to pass tests
  - [ ] Run tests (verify they pass)
  - [ ] Verify all acceptance criteria met
  
- [ ] Phase 4: Refactor
  - [ ] Apply clean code principles
  - [ ] Add proper error handling
  - [ ] Add XML documentation
  - [ ] Configure dependency injection
  - [ ] Run tests (verify still passing)
  
- [ ] Phase 5: Integration
  - [ ] Add API endpoints
  - [ ] Add OpenAPI/Swagger docs
  - [ ] Add health checks
  - [ ] Run full test suite
  
- [ ] Phase 6: Complete
  - [ ] Move plan to completed-stories/
  - [ ] Update .agent/current-state.md
  - [ ] Commit with [Story X.Y] prefix
  - [ ] Push to GitHub
  - [ ] Close GitHub issue
  
- [ ] Phase 7: Next
  - [ ] Review unblocked stories
  - [ ] Select next story
  - [ ] Update current-state.md
  - [ ] Go to Phase 1

---

## Anti-Patterns to Avoid

❌ **Don't**: Write implementation before tests  
✅ **Do**: Write failing tests first (TDD)

❌ **Don't**: Complete multiple stories in one commit  
✅ **Do**: One story = one commit with [Story X.Y] prefix

❌ **Don't**: Skip updating .agent/current-state.md  
✅ **Do**: Update state after every story completion

❌ **Don't**: Leave WIP code uncommitted  
✅ **Do**: Commit completed, tested work only

❌ **Don't**: Forget to close GitHub issues  
✅ **Do**: Close issues with completion summary

❌ **Don't**: Start new story without checking dependencies  
✅ **Do**: Verify dependencies complete in current-state.md

---

## Benefits of This Workflow

1. **Clean Chat Sessions**: Each session starts by reading `.agent/current-state.md` for full context
2. **No Task Deviation**: Story plan keeps work focused on acceptance criteria
3. **Quality Assurance**: TDD ensures all code is tested and working
4. **Clear Progress**: current-state.md shows exactly where project stands
5. **Audit Trail**: completed-stories/ folder has history of all work
6. **Easy Handoffs**: New developers/agents can pick up where you left off
7. **GitHub Integration**: Issues track work, commits reference stories

# Azure Cache for Redis Module

This module creates an Azure Cache for Redis with private network access, automatic backups, and production-ready configuration.

## Features

- **Private Network Access**: Private endpoint for secure connectivity
- **SSL/TLS Encryption**: Enforced encrypted connections
- **Automatic Backups**: RDB backups for Premium tier (configurable)
- **Patch Scheduling**: Automated patching during maintenance window
- **Keyspace Notifications**: Enabled for pub/sub patterns
- **Eviction Policy**: LRU eviction for optimal memory management

## Usage

```hcl
module "redis" {
  source = "./modules/redis"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  redis_name          = "redis-sensormine-prod"
  subnet_id           = azurerm_subnet.services.id
  
  sku_name  = "Premium"
  family    = "P"
  capacity  = 1
  
  backup_storage_connection_string = azurerm_storage_account.backup.primary_connection_string
  
  tags = {
    Environment = "production"
    Project     = "Sensormine"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| redis_name | Name of the Redis cache | string | - | yes |
| subnet_id | Subnet ID for private endpoint | string | - | yes |
| sku_name | Redis SKU (Basic, Standard, Premium) | string | Premium | no |
| family | Redis family (C for Basic/Standard, P for Premium) | string | P | no |
| capacity | Redis capacity (0-6 for C/P families) | number | 1 | no |
| backup_storage_connection_string | Storage account for backups (Premium only) | string | null | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| redis_id | The ID of the Redis Cache |
| hostname | The hostname for connections |
| ssl_port | SSL port (6380) |
| primary_access_key | Primary access key (sensitive) |
| connection_string | Full connection string (sensitive) |
| stackexchange_connection_string | StackExchange.Redis format (sensitive) |

## SKU Comparison

| Feature | Basic | Standard | Premium |
|---------|-------|----------|---------|
| Cache Size | 250 MB - 53 GB | 250 MB - 53 GB | 6 GB - 1.2 TB |
| SLA | None | 99.9% | 99.95% |
| Replication | ❌ | ✅ | ✅ |
| Persistence | ❌ | ❌ | ✅ |
| Clustering | ❌ | ❌ | ✅ |
| Geo-replication | ❌ | ❌ | ✅ |
| Virtual Network | ❌ | ❌ | ✅ |
| Private Link | ❌ | ❌ | ✅ |

## Capacity Sizing

### C Family (Basic & Standard)
| Capacity | Cache Size | Monthly Cost* |
|----------|------------|---------------|
| C0 | 250 MB | ~$15 |
| C1 | 1 GB | ~$55 |
| C2 | 2.5 GB | ~$110 |
| C3 | 6 GB | ~$220 |
| C4 | 13 GB | ~$380 |
| C5 | 26 GB | ~$755 |
| C6 | 53 GB | ~$1,510 |

### P Family (Premium)
| Capacity | Cache Size | Monthly Cost* |
|----------|------------|---------------|
| P1 | 6 GB | ~$250 |
| P2 | 13 GB | ~$500 |
| P3 | 26 GB | ~$1,000 |
| P4 | 53 GB | ~$1,865 |
| P5 | 120 GB | ~$4,030 |

*Approximate costs for East US region

## Recommended Configurations

### Development
```hcl
sku_name = "Basic"
family   = "C"
capacity = 0  # 250 MB
```

### Staging
```hcl
sku_name = "Standard"
family   = "C"
capacity = 1  # 1 GB with replication
```

### Production
```hcl
sku_name = "Premium"
family   = "P"
capacity = 1  # 6 GB with clustering, persistence, VNet
```

## Use Cases in Sensormine Platform

1. **Session Storage**: User session data, JWT token blacklists
2. **Response Caching**: API response caching for frequently accessed data
3. **Real-time Data**: Latest device telemetry, dashboard state
4. **Pub/Sub**: Real-time notifications, alerts distribution
5. **Rate Limiting**: API throttling, distributed rate limits
6. **Distributed Locks**: Coordination across microservices
7. **Queue Management**: Background job queues using Redis Lists

## Configuration Settings

### Eviction Policy
- **allkeys-lru** (default): Evict least recently used keys
- Alternative options: allkeys-lfu, volatile-lru, volatile-lfu, volatile-ttl

### Keyspace Notifications
- **KEA**: Enabled for all keyspace events
- Useful for cache invalidation, real-time monitoring

### Persistence (Premium Only)
- **RDB Backup**: Enabled with 60-minute frequency
- Stored in specified storage account
- Point-in-time recovery available

## Connecting to Redis

### From .NET Application

```csharp
// Using StackExchange.Redis
using StackExchange.Redis;

var configuration = ConfigurationOptions.Parse(
    "redis-sensormine-prod.redis.cache.windows.net:6380");
configuration.Password = "your-access-key";
configuration.Ssl = true;
configuration.AbortOnConnectFail = false;
configuration.SyncTimeout = 30000;

var connection = ConnectionMultiplexer.Connect(configuration);
var db = connection.GetDatabase();

// Set value
await db.StringSetAsync("key", "value", TimeSpan.FromMinutes(10));

// Get value
var value = await db.StringGetAsync("key");

// Pub/Sub
var subscriber = connection.GetSubscriber();
await subscriber.SubscribeAsync("alerts", (channel, message) => {
    Console.WriteLine($"Received: {message}");
});
await subscriber.PublishAsync("alerts", "New alert!");
```

### Using Azure SDK

```csharp
// Dependency Injection
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "Sensormine:";
});

// Usage in controller
public class DeviceController : ControllerBase
{
    private readonly IDistributedCache _cache;
    
    public DeviceController(IDistributedCache cache)
    {
        _cache = cache;
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDevice(string id)
    {
        var cacheKey = $"device:{id}";
        var cachedDevice = await _cache.GetStringAsync(cacheKey);
        
        if (cachedDevice != null)
        {
            return Ok(JsonSerializer.Deserialize<Device>(cachedDevice));
        }
        
        // Fetch from database...
        var device = await _deviceRepository.GetByIdAsync(id);
        
        // Cache for 5 minutes
        await _cache.SetStringAsync(cacheKey, 
            JsonSerializer.Serialize(device),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });
        
        return Ok(device);
    }
}
```

### Using redis-cli

```bash
# Connect to Redis
redis-cli -h redis-sensormine-prod.redis.cache.windows.net \
          -p 6380 \
          -a your-access-key \
          --tls

# Basic commands
SET key "value"
GET key
DEL key
KEYS pattern*
TTL key

# Monitor commands
MONITOR
INFO stats
CLIENT LIST
```

## Private Network Access

This module configures a private endpoint, ensuring Redis is only accessible from within your VNet:

1. **No Public Access**: Public network access disabled
2. **Private Endpoint**: Dedicated private IP in your subnet
3. **Private DNS**: Automatic DNS resolution within VNet
4. **NSG Rules**: Control traffic at network level

## Monitoring and Alerts

Key metrics to monitor:

- **Used Memory**: Set alert at 80% capacity
- **Server Load**: Alert if consistently > 80%
- **Connected Clients**: Monitor for connection leaks
- **Cache Hits/Misses**: Optimize cache strategy
- **Evicted Keys**: Indicates memory pressure
- **Connections Created/Closed**: Detect connection issues

## Performance Best Practices

1. **Connection Pooling**: Reuse connections, don't create per request
2. **Pipelining**: Batch multiple commands
3. **Async Operations**: Use async/await for all Redis operations
4. **Key Naming**: Use structured naming (e.g., `entity:id:field`)
5. **Expiration**: Always set TTL to prevent memory bloat
6. **Serialization**: Use efficient formats (MessagePack, Protobuf)
7. **Clustering**: Use Premium tier with sharding for > 26 GB

## Security Best Practices

1. **SSL/TLS Only**: Non-SSL port is disabled by default
2. **Key Rotation**: Rotate access keys regularly
3. **Managed Identity**: Use for Azure service authentication
4. **Network Isolation**: Private endpoint only
5. **Access Keys in Key Vault**: Store in Azure Key Vault
6. **Minimal Permissions**: Use connection strings with minimal required access

## Backup and Recovery (Premium Only)

```bash
# View backups
az redis export \
  --resource-group rg-sensormine-prod \
  --name redis-sensormine-prod \
  --prefix backup-2024-01-01

# Import backup
az redis import \
  --resource-group rg-sensormine-prod \
  --name redis-sensormine-prod \
  --files https://storage.blob.core.windows.net/backups/backup.rdb
```

## Troubleshooting

### High Memory Usage
- Increase capacity or enable eviction
- Review key TTLs
- Use Redis memory analysis tools

### Connection Timeouts
- Check network latency
- Increase SyncTimeout value
- Use connection pooling

### Slow Operations
- Avoid blocking commands (KEYS, FLUSHALL)
- Use SCAN instead of KEYS
- Monitor slow log

## Cost Optimization

1. **Right-size**: Start with Standard C1, scale based on metrics
2. **Reserved Capacity**: Save up to 55% with 1-year/3-year commitment
3. **Basic for Non-Prod**: Use Basic tier for dev/test
4. **Monitor Usage**: Scale down during low-traffic periods
5. **Eviction Policy**: Automatic memory management

## References

- [Azure Cache for Redis Documentation](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Redis Commands](https://redis.io/commands)
- [StackExchange.Redis Documentation](https://stackexchange.github.io/StackExchange.Redis/)
- [Best Practices](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/cache-best-practices)

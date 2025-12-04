namespace Sensormine.Storage.Tests;

using FluentAssertions;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.TimeSeries;

public class InMemoryTimeSeriesRepositoryTests
{
    private const string TenantId = "test-tenant";
    private const string Measurement = "telemetry";
    private readonly InMemoryTimeSeriesRepository _repository;

    public InMemoryTimeSeriesRepositoryTests()
    {
        _repository = new InMemoryTimeSeriesRepository(TenantId);
    }

    [Fact]
    public async Task WriteAsync_WithValidData_StoresDataPoint()
    {
        // Arrange
        var data = CreateTestDataPoint("device-1", 25.5);

        // Act
        await _repository.WriteAsync(Measurement, data);

        // Assert
        _repository.GetCount(Measurement).Should().Be(1);
    }

    [Fact]
    public async Task WriteBatchAsync_WithMultipleDataPoints_StoresAllDataPoints()
    {
        // Arrange
        var dataPoints = new[]
        {
            CreateTestDataPoint("device-1", 25.5),
            CreateTestDataPoint("device-2", 26.5),
            CreateTestDataPoint("device-3", 27.5)
        };

        // Act
        await _repository.WriteBatchAsync(Measurement, dataPoints);

        // Assert
        _repository.GetCount(Measurement).Should().Be(3);
    }

    [Fact]
    public async Task QueryAsync_WithTimeRange_ReturnsMatchingDataPoints()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 25.5, now.AddHours(-2));
        var data2 = CreateTestDataPoint("device-1", 26.5, now.AddHours(-1));
        var data3 = CreateTestDataPoint("device-1", 27.5, now);
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        var query = new TimeSeriesQuery
        {
            StartTime = now.AddHours(-1.5),
            EndTime = now.AddMinutes(1)
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>(Measurement, query);

        // Assert
        results.Should().HaveCount(2);
    }

    [Fact]
    public async Task QueryAsync_WithDeviceIdFilter_ReturnsMatchingDataPoints()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 25.5, now);
        var data2 = CreateTestDataPoint("device-2", 26.5, now);
        var data3 = CreateTestDataPoint("device-1", 27.5, now.AddMinutes(1));
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        var query = new TimeSeriesQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            Filters = new Dictionary<string, string> { ["deviceId"] = "device-1" }
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>(Measurement, query);

        // Assert
        results.Should().HaveCount(2);
        results.Should().OnlyContain(r => r.DeviceId == "device-1");
    }

    [Fact]
    public async Task QueryAsync_WithTagFilter_ReturnsMatchingDataPoints()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 25.5, now);
        data1.Tags = new Dictionary<string, string> { ["location"] = "warehouse-a" };
        
        var data2 = CreateTestDataPoint("device-2", 26.5, now);
        data2.Tags = new Dictionary<string, string> { ["location"] = "warehouse-b" };
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2 });

        var query = new TimeSeriesQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            Filters = new Dictionary<string, string> { ["tag.location"] = "warehouse-a" }
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>(Measurement, query);

        // Assert
        results.Should().HaveCount(1);
        results.First().DeviceId.Should().Be("device-1");
    }

    [Fact]
    public async Task QueryAsync_WithLimit_ReturnsLimitedResults()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        for (int i = 0; i < 10; i++)
        {
            await _repository.WriteAsync(Measurement, CreateTestDataPoint("device-1", 25.0 + i, now.AddMinutes(i)));
        }

        var query = new TimeSeriesQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            Limit = 5
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>(Measurement, query);

        // Assert
        results.Should().HaveCount(5);
    }

    [Fact]
    public async Task QueryAggregateAsync_WithAvgFunction_ReturnsCorrectAverage()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 10.0, now);
        var data2 = CreateTestDataPoint("device-1", 20.0, now.AddMinutes(1));
        var data3 = CreateTestDataPoint("device-1", 30.0, now.AddMinutes(2));
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        var query = new AggregateQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            AggregateFunction = "avg",
            Filters = new Dictionary<string, string> { ["_field"] = "value" }
        };

        // Act
        var results = await _repository.QueryAggregateAsync<AggregateResult>(Measurement, query);

        // Assert
        results.Should().HaveCount(1);
        results.First().Value.Should().Be(20.0m);
        results.First().Count.Should().Be(3);
    }

    [Fact]
    public async Task QueryAggregateAsync_WithSumFunction_ReturnsCorrectSum()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 10.0, now);
        var data2 = CreateTestDataPoint("device-1", 20.0, now.AddMinutes(1));
        var data3 = CreateTestDataPoint("device-1", 30.0, now.AddMinutes(2));
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        var query = new AggregateQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            AggregateFunction = "sum",
            Filters = new Dictionary<string, string> { ["_field"] = "value" }
        };

        // Act
        var results = await _repository.QueryAggregateAsync<AggregateResult>(Measurement, query);

        // Assert
        results.Should().HaveCount(1);
        results.First().Value.Should().Be(60.0m);
    }

    [Fact]
    public async Task QueryAggregateAsync_WithMinMaxFunctions_ReturnsCorrectValues()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var data1 = CreateTestDataPoint("device-1", 10.0, now);
        var data2 = CreateTestDataPoint("device-1", 50.0, now.AddMinutes(1));
        var data3 = CreateTestDataPoint("device-1", 30.0, now.AddMinutes(2));
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        // Act - Min
        var minQuery = new AggregateQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            AggregateFunction = "min",
            Filters = new Dictionary<string, string> { ["_field"] = "value" }
        };
        var minResults = await _repository.QueryAggregateAsync<AggregateResult>(Measurement, minQuery);

        // Act - Max
        var maxQuery = new AggregateQuery
        {
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1),
            AggregateFunction = "max",
            Filters = new Dictionary<string, string> { ["_field"] = "value" }
        };
        var maxResults = await _repository.QueryAggregateAsync<AggregateResult>(Measurement, maxQuery);

        // Assert
        minResults.First().Value.Should().Be(10.0m);
        maxResults.First().Value.Should().Be(50.0m);
    }

    [Fact]
    public async Task QueryAggregateAsync_WithTimeGrouping_ReturnsBucketedResults()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var baseTime = now.AddMinutes(-now.Minute).AddSeconds(-now.Second).AddMilliseconds(-now.Millisecond);
        
        // Create data points in different hour buckets
        var data1 = CreateTestDataPoint("device-1", 10.0, baseTime);
        var data2 = CreateTestDataPoint("device-1", 20.0, baseTime.AddHours(1));
        var data3 = CreateTestDataPoint("device-1", 30.0, baseTime.AddHours(2));
        
        await _repository.WriteBatchAsync(Measurement, new[] { data1, data2, data3 });

        var query = new AggregateQuery
        {
            StartTime = baseTime.AddHours(-1),
            EndTime = baseTime.AddHours(3),
            AggregateFunction = "avg",
            GroupByInterval = TimeSpan.FromHours(1),
            Filters = new Dictionary<string, string> { ["_field"] = "value" }
        };

        // Act
        var results = await _repository.QueryAggregateAsync<AggregateResult>(Measurement, query);

        // Assert
        results.Should().HaveCount(3);
        results.Select(r => r.Value).Should().BeEquivalentTo(new[] { 10.0m, 20.0m, 30.0m });
    }

    [Fact]
    public async Task QueryAsync_WithEmptyMeasurement_ReturnsEmptyResults()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddHours(-1),
            EndTime = DateTimeOffset.UtcNow
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>("non-existent", query);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void Clear_RemovesAllData()
    {
        // Arrange
        _repository.WriteAsync(Measurement, CreateTestDataPoint("device-1", 25.5)).Wait();
        _repository.GetCount(Measurement).Should().Be(1);

        // Act
        _repository.Clear();

        // Assert
        _repository.GetCount(Measurement).Should().Be(0);
    }

    [Fact]
    public async Task QueryAsync_FiltersByTenant()
    {
        // Arrange
        var data = CreateTestDataPoint("device-1", 25.5);
        await _repository.WriteAsync(Measurement, data);

        // Create a different tenant's repository
        var otherTenantRepo = new InMemoryTimeSeriesRepository("other-tenant");
        await otherTenantRepo.WriteAsync(Measurement, CreateTestDataPoint("device-1", 30.0));

        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddHours(-1),
            EndTime = DateTimeOffset.UtcNow.AddHours(1)
        };

        // Act
        var results = await _repository.QueryAsync<TimeSeriesData>(Measurement, query);
        var otherResults = await otherTenantRepo.QueryAsync<TimeSeriesData>(Measurement, query);

        // Assert
        results.Should().HaveCount(1);
        otherResults.Should().HaveCount(1);
        results.First().Values["value"].Should().Be(25.5);
        otherResults.First().Values["value"].Should().Be(30.0);
    }

    private static TimeSeriesData CreateTestDataPoint(string deviceId, double value, DateTimeOffset? timestamp = null)
    {
        return new TimeSeriesData
        {
            DeviceId = deviceId,
            TenantId = TenantId,
            Timestamp = timestamp ?? DateTimeOffset.UtcNow,
            Values = new Dictionary<string, object> { ["value"] = value }
        };
    }
}

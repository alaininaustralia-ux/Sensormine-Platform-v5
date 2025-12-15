namespace Sensormine.Storage.Tests;

using FluentAssertions;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.TimeSeries;

public class TimeSeriesQueryBuilderTests
{
    private const string TableName = "telemetry_data";
    private const string TenantId = "test-tenant";

    [Fact]
    public void BuildSelectQuery_WithBasicQuery_GeneratesCorrectSql()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.Parse("2024-01-01T00:00:00Z"),
            EndTime = DateTimeOffset.Parse("2024-01-02T00:00:00Z")
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out var parameters);

        // Assert
        sql.Should().Contain("SELECT");
        sql.Should().Contain("FROM telemetry_data");
        sql.Should().Contain("WHERE tenant_id = @tenantId");
        sql.Should().Contain("AND timestamp >= @startTime");
        sql.Should().Contain("AND timestamp <= @endTime");
        sql.Should().Contain("ORDER BY timestamp DESC");
        
        parameters.Should().ContainKey("@tenantId").WhoseValue.Should().Be(TenantId);
        parameters.Should().ContainKey("@startTime");
        parameters.Should().ContainKey("@endTime");
    }

    [Fact]
    public void BuildSelectQuery_WithDeviceIdFilter_GeneratesDeviceFilter()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            Filters = new Dictionary<string, object> { ["deviceId"] = "device-123" }
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out var parameters);

        // Assert
        sql.Should().Contain("AND device_id = @filter0");
        parameters.Should().ContainKey("@filter0").WhoseValue.Should().Be("device-123");
    }

    [Fact]
    public void BuildSelectQuery_WithTagFilter_GeneratesJsonTagFilter()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            Filters = new Dictionary<string, object> { ["tag.location"] = "warehouse-a" }
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out var parameters);

        // Assert
        sql.Should().Contain("AND tags ->> 'location' = @filter0");
        parameters.Should().ContainKey("@filter0").WhoseValue.Should().Be("warehouse-a");
    }

    [Fact]
    public void BuildSelectQuery_WithLimit_GeneratesLimitClause()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            Limit = 100
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out _);

        // Assert
        sql.Should().Contain("LIMIT 100");
    }

    [Fact]
    public void BuildSelectQuery_WithCustomOrderBy_UsesCustomOrderBy()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            OrderBy = "device_id"
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out _);

        // Assert
        sql.Should().Contain("ORDER BY device_id DESC");
    }

    [Fact]
    public void BuildAggregateQuery_WithAvgFunction_GeneratesAvgQuery()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg"
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "temperature", out _);

        // Assert
        sql.Should().Contain("AVG((values ->> 'temperature')::numeric) AS Value");
        sql.Should().Contain("COUNT(*) AS Count");
    }

    [Fact]
    public void BuildAggregateQuery_WithSumFunction_GeneratesSumQuery()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "sum"
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("SUM((values ->> 'value')::numeric) AS Value");
    }

    [Fact]
    public void BuildAggregateQuery_WithTimeInterval_GeneratesTimeBucket()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg",
            GroupByInterval = TimeSpan.FromHours(1)
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("time_bucket('1 hour', timestamp) AS bucket");
        sql.Should().Contain("GROUP BY time_bucket('1 hour', timestamp)");
        sql.Should().Contain("ORDER BY bucket ASC");
    }

    [Fact]
    public void BuildAggregateQuery_WithDeviceGroupBy_GeneratesDeviceGrouping()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg",
            GroupByFields = new[] { "deviceId" }
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("device_id AS DeviceId");
        sql.Should().Contain("GROUP BY device_id");
    }

    [Fact]
    public void BuildAggregateQuery_WithTagGroupBy_GeneratesTagGrouping()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg",
            GroupByFields = new[] { "tag.location" }
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("tags ->> 'location' AS \"location\"");
        sql.Should().Contain("GROUP BY tags ->> 'location'");
    }

    [Fact]
    public void BuildAggregateQuery_WithMinuteInterval_GeneratesCorrectTimeBucket()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg",
            GroupByInterval = TimeSpan.FromMinutes(5)
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("time_bucket('5 minute', timestamp)");
    }

    [Fact]
    public void BuildAggregateQuery_WithDayInterval_GeneratesCorrectTimeBucket()
    {
        // Arrange
        var query = new AggregateQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-30),
            EndTime = DateTimeOffset.UtcNow,
            AggregateFunction = "avg",
            GroupByInterval = TimeSpan.FromDays(1)
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(TableName, query, TenantId, "value", out _);

        // Assert
        sql.Should().Contain("time_bucket('1 day', timestamp)");
    }

    [Fact]
    public void BuildInsertQuery_GeneratesCorrectInsertStatement()
    {
        // Act
        var sql = TimeSeriesQueryBuilder.BuildInsertQuery(TableName);

        // Assert
        sql.Should().Contain("INSERT INTO telemetry_data");
        sql.Should().Contain("device_id, tenant_id, timestamp, values, quality, tags");
        sql.Should().Contain("@deviceId, @tenantId, @timestamp");
        sql.Should().Contain("@values::jsonb");
        sql.Should().Contain("@quality::jsonb");
        sql.Should().Contain("@tags::jsonb");
    }

    [Fact]
    public void BuildSelectQuery_WithMultipleFilters_GeneratesAllFilters()
    {
        // Arrange
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-1),
            EndTime = DateTimeOffset.UtcNow,
            Filters = new Dictionary<string, object>
            {
                ["deviceId"] = "device-123",
                ["tag.location"] = "warehouse-a",
                ["sensorType"] = "temperature"
            }
        };

        // Act
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(TableName, query, TenantId, out var parameters);

        // Assert
        sql.Should().Contain("AND device_id = @filter0");
        sql.Should().Contain("AND tags ->> 'location' = @filter1");
        sql.Should().Contain("AND values ->> 'sensorType' = @filter2");
        parameters.Should().HaveCount(6); // tenantId, startTime, endTime + 3 filters
    }
}

using System.ComponentModel.DataAnnotations;
using Sensormine.Core.Models;

namespace Device.API.DTOs;

/// <summary>
/// Request model for searching Device Types
/// </summary>
public class SearchDeviceTypesRequest
{
    /// <summary>
    /// Search term to match against name or description
    /// </summary>
    [StringLength(255, ErrorMessage = "Search term cannot exceed 255 characters")]
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Filter by protocol type
    /// </summary>
    public DeviceProtocol? Protocol { get; set; }

    /// <summary>
    /// Filter by tags (device type must have all specified tags)
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page
    /// </summary>
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    public int PageSize { get; set; } = 20;
}

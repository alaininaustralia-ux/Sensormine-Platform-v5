namespace Device.API.DTOs;

/// <summary>
/// Paginated list response for Device Types
/// </summary>
public class DeviceTypeListResponse
{
    /// <summary>
    /// List of device types for the current page
    /// </summary>
    public List<DeviceTypeResponse> Items { get; set; } = new();

    /// <summary>
    /// Total number of device types matching the query
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPreviousPage => Page > 1;

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNextPage => Page < TotalPages;
}

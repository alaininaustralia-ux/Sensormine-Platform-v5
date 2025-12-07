namespace Sensormine.Mobile.Maui.Models;

/// <summary>
/// Represents a geographic location
/// </summary>
public class Location
{
    /// <summary>
    /// Latitude in decimal degrees
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Longitude in decimal degrees
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Altitude in meters (optional)
    /// </summary>
    public double? Altitude { get; set; }

    /// <summary>
    /// Accuracy of GPS reading in meters (optional)
    /// </summary>
    public double? Accuracy { get; set; }

    /// <summary>
    /// Location source (GPS, Network, Manual)
    /// </summary>
    public LocationSource Source { get; set; }

    /// <summary>
    /// Street address (from geocoding)
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// When the location was captured
    /// </summary>
    public DateTime CapturedAt { get; set; }

    /// <summary>
    /// User who captured the location
    /// </summary>
    public string? CapturedBy { get; set; }

    /// <summary>
    /// Converts location to display string
    /// </summary>
    public override string ToString()
    {
        if (!string.IsNullOrEmpty(Address))
        {
            return Address;
        }

        return $"{Latitude:F6}, {Longitude:F6}";
    }

    /// <summary>
    /// Converts to decimal degrees string format
    /// </summary>
    public string ToDecimalDegrees()
    {
        return $"{Latitude:F6}°, {Longitude:F6}°";
    }

    /// <summary>
    /// Converts to DMS (Degrees, Minutes, Seconds) format
    /// </summary>
    public string ToDMS()
    {
        var lat = ConvertToDMS(Latitude, true);
        var lon = ConvertToDMS(Longitude, false);
        return $"{lat}, {lon}";
    }

    private static string ConvertToDMS(double coordinate, bool isLatitude)
    {
        var absolute = Math.Abs(coordinate);
        var degrees = (int)Math.Floor(absolute);
        var minutesDecimal = (absolute - degrees) * 60;
        var minutes = (int)Math.Floor(minutesDecimal);
        var seconds = (minutesDecimal - minutes) * 60;

        var direction = coordinate >= 0
            ? (isLatitude ? "N" : "E")
            : (isLatitude ? "S" : "W");

        return $"{degrees}° {minutes}' {seconds:F2}\" {direction}";
    }
}

/// <summary>
/// Location capture source
/// </summary>
public enum LocationSource
{
    GPS,
    Network,
    Manual
}

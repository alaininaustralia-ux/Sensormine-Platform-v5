# SensorMine Mobile - .NET MAUI Application

## Overview

Cross-platform mobile application for field technicians built with .NET MAUI. Provides NFC-based device configuration, diagnostics, and offline-first operations for SensorMine IoT platform.

## Features

### NFC Operations
- **Device Discovery**: Tap Nexus devices to read ID, type, firmware, hardware info
- **Diagnostics Reading**: Read battery, sensors, errors, last broadcast time
- **Configuration Writing**: Apply validated JSON configurations via NFC
- **Offline Support**: Direct device communication without cloud connectivity

### Configuration Management
- Load device types and schemas from platform
- Apply JSON configurations with real-time validation
- Tabletop configuration (offline without cloud)
- Import via file, QR code, clipboard, Bluetooth/WiFi
- Configuration templates and bulk operations

### Location Services
- GPS location capture with manual override
- Map view with device markers
- Address geocoding
- Multiple coordinate formats (decimal degrees, DMS, UTM)
- Waypoint management

### Offline-First Architecture
- Local SQLite database for caching
- All operations work offline first
- Automatic sync when connectivity returns
- Conflict resolution
- Cache expiration (24-hour default)

### Security
- Azure AD / Entra ID authentication
- Biometric authentication (fingerprint, Face ID)
- Secure token storage
- Encrypted local database (SQLCipher)
- Full audit trail

## Technology Stack

- **.NET MAUI** (.NET 8+)
- **C# 12**
- **MVVM Pattern** (CommunityToolkit.Mvvm)
- **SQLite** (Entity Framework Core 8, SQLitePCLRaw for native bindings)
- **MSAL** (Microsoft Authentication Library)
- **Refit** (Type-safe HTTP client)
- **Polly** (Resilience patterns)
- **ZXing.Net.Maui** (QR/Barcode scanning)
- **Serilog** (Logging)

## Project Structure

```
Sensormine.Mobile.Maui/
├── Views/                    # XAML pages
│   ├── Devices/              # Device management pages
│   ├── Diagnostics/          # Diagnostic viewing
│   ├── Configuration/        # Configuration editor
│   └── Settings/             # App settings
│
├── ViewModels/               # MVVM ViewModels
│   ├── Devices/
│   ├── Diagnostics/
│   ├── Configuration/
│   └── Settings/
│
├── Models/                   # Domain models
│   ├── Device.cs
│   ├── DeviceType.cs
│   ├── Configuration.cs
│   └── DiagnosticInfo.cs
│
├── Services/                 # Business logic
│   ├── Api/                  # API clients (Refit)
│   ├── Nfc/                  # NFC services (platform-specific)
│   ├── Data/                 # Database (EF Core + SQLite)
│   ├── Location/             # GPS and maps
│   └── Configuration/        # Configuration management
│
├── Platforms/                # Platform-specific code
│   ├── Android/              # Android NFC, permissions
│   └── iOS/                  # iOS CoreNFC
│
└── Resources/                # Assets
    ├── Images/
    ├── Fonts/
    └── Styles/
```

## Platform Requirements

### iOS
- **Minimum Version**: iOS 14.0+
- **NFC Support**: iPhone 7+ (NFC hardware), iOS 14.0+ required for this app
- **Entitlements**: CoreNFC in Info.plist
- **Distribution**: App Store or Enterprise

### Android
- **Minimum Version**: Android 8.0 (API 26)+
- **NFC Hardware**: Required
- **Permissions**: NFC in AndroidManifest.xml
- **Distribution**: Google Play or APK sideloading

## Building & Running

### Prerequisites
- .NET 8 SDK or later
- Visual Studio 2022 (17.8+) or Visual Studio for Mac
- Xcode 15+ (for iOS development)
- Android SDK API 26+ (for Android development)

### Install MAUI Workload
```bash
dotnet workload install maui
```

### Restore Dependencies
```bash
cd src/Web/Sensormine.Mobile.Maui
dotnet restore
```

### Build
```bash
# Build for all platforms
dotnet build

# Build for specific platform
dotnet build -f net8.0-android
dotnet build -f net8.0-ios
```

### Run

#### iOS (macOS only)
```bash
dotnet build -t:Run -f net8.0-ios
```

#### Android
```bash
dotnet build -t:Run -f net8.0-android
```

### Visual Studio
1. Open `Sensormine.sln` in Visual Studio 2022
2. Set `Sensormine.Mobile.Maui` as startup project
3. Select target platform (Android Emulator, iOS Simulator, or physical device)
4. Press F5 to run

## Configuration

### API Endpoints
Configure platform API endpoints in `appsettings.json` or app settings:
- Device.API: `https://api.sensormine.com/device`
- SchemaRegistry.API: `https://api.sensormine.com/schema`
- Dashboard.API: `https://api.sensormine.com/dashboard`

### Azure AD Configuration
Update MSAL configuration with your Azure AD tenant:
```json
{
  "AzureAd": {
    "ClientId": "your-client-id",
    "TenantId": "your-tenant-id",
    "RedirectUri": "msauth.com.sensormine.mobile://auth"
  }
}
```

### NFC Configuration
- **iOS**: Add NFC usage description in `Info.plist`
- **Android**: Add NFC permissions in `AndroidManifest.xml`

## Development

### Adding a New Page
1. Create XAML page in `Views/` directory
2. Create ViewModel in `ViewModels/` directory
3. Register page and ViewModel in `MauiProgram.cs`:
   ```csharp
   builder.Services.AddTransient<DeviceListPage>();
   builder.Services.AddTransient<DeviceListViewModel>();
   ```

### NFC Implementation
- iOS: Implement in `Platforms/iOS/NfcServiceiOS.cs` using CoreNFC
- Android: Implement in `Platforms/Android/NfcServiceAndroid.cs` using Android.Nfc

### Database Migrations
```bash
# Add migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

## Testing

### Unit Tests
```bash
dotnet test
```

### UI Tests
- MAUI UI Testing framework
- Manual testing on iOS and Android devices

## Deployment

### iOS App Store
1. Configure provisioning profiles in Xcode
2. Archive and upload to App Store Connect
3. Submit for review

### Google Play Store
1. Generate signed APK or AAB
2. Upload to Google Play Console
3. Submit for review

### Enterprise Distribution
- iOS: Enterprise provisioning profile
- Android: APK sideloading with MDM

## Troubleshooting

### NFC Not Working
- **iOS**: Ensure CoreNFC entitlements are enabled
- **Android**: Check NFC is enabled in device settings
- Both: Test with physical devices (emulators don't support NFC)

### Build Errors
```bash
# Clean and rebuild
dotnet clean
dotnet build -t:Clean
dotnet restore
dotnet build
```

### SQLite Errors
- Ensure SQLitePCLRaw.bundle_green is referenced (provides native SQLite bindings for Entity Framework Core)
- Check database path permissions
- Verify Entity Framework Core migrations are applied

## Documentation

For detailed requirements and architecture:
- [MAUI Requirements](../../../docs/mobile-maui-requirements.md)
- [Architecture](../../../docs/architecture.md)
- [User Stories](../../../docs/user-stories.md) (Epics 14-19)

## Contributing

1. Create feature branch from `main`
2. Follow C# coding conventions
3. Add unit tests for business logic
4. Test on both iOS and Android
5. Submit pull request

## License

Copyright (c) 2025 SensorMine Platform

# SensorMine Platform - .NET MAUI Mobile Application Requirements

## Overview

The SensorMine Mobile application is a cross-platform mobile solution built with .NET MAUI (Multi-platform App UI) for iOS and Android. It provides field technicians with tools for device discovery, NFC-based configuration, diagnostics, and offline-first operations for industrial IoT deployments.

**Key Technologies:**
- .NET MAUI (.NET 8+)
- NFC (Near Field Communication) support
- Offline-first architecture with local SQLite storage
- Integration with SensorMine Platform APIs
- Azure AD / Entra ID authentication

---

## Epic 14: Device Discovery, NFC Interaction, and Basic Operations

### User Story 14.1 – Tap to Identify Device

**As a** field technician  
**I want to** tap a Nexus-enabled sensor with my mobile device via NFC  
**So that** I can automatically identify the device and load its platform metadata

**Acceptance Criteria:**
- NFC tap reads device ID, device type, firmware version, and hardware info from NDEF (NFC Data Exchange Format) tag
- App retrieves device type definition and schema from SensorMine platform when authenticated and online
- If offline or not authenticated, app can still read values directly from the device via NFC
- Device information displayed in a structured format (device ID, type, firmware, battery level)
- Support for multiple NFC tag formats (NDEF, Mifare, ISO 15693)
- Visual and haptic feedback when NFC scan is successful
- Error handling for unreadable or corrupted NFC tags
- Background NFC scanning when app is in foreground

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- iOS: CoreNFC framework integration
- Android: NFC API integration
- NDEF message parsing
- Device.API integration for metadata retrieval
- Offline caching of device type definitions

---

### User Story 14.2 – Tap to Read Diagnostics

**As a** field technician  
**I want to** tap a device and view diagnostics  
**So that** I can confirm operational status without needing cloud connectivity

**Acceptance Criteria:**
- Reads battery level (percentage and voltage)
- Reads last broadcast time (timestamp)
- Reads sensor statuses (operational, error, offline)
- Reads configuration integrity checksum
- Displays any error codes or warnings stored on device
- Shows signal strength and connectivity status
- Works both online (with platform sync) and offline (direct NFC read)
- Diagnostic data can be exported as JSON or CSV
- Historical diagnostics stored locally for comparison
- Color-coded status indicators (green/yellow/red)

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- Custom NFC command/response protocol for diagnostics
- Local SQLite storage for diagnostic history
- Export functionality (share, email, save to files)
- Battery level visualization (gauge widget)
- Error code lookup table

---

## Epic 15: Device Configuration and Provisioning

### User Story 15.1 – Load Device Schemas and Nexus Configuration

**As a** field technician  
**I want** the app to fetch device types, schemas, and Nexus capability definitions  
**So that** I always work with up-to-date configuration formats

**Acceptance Criteria:**
- Retrieves device types and their JSON schema definitions from SensorMine platform API
- Retrieves Nexus configuration capabilities:
  - Radio settings (LoRaWAN, NB-IoT, LTE-M)
  - Broadcast frequency and intervals
  - Sensor interface types (RS485, RS232, OneWire, 4-20mA)
- Offline caching for previously downloaded schemas (stored in SQLite)
- Cache expiration and refresh policies (24-hour default, manual refresh option)
- Version checking to ensure schema compatibility
- Visual indicator showing last sync time
- Download schemas in batches for entire device type families
- Schema validation before applying to devices

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- SchemaRegistry.API integration
- Device.API integration for device types
- SQLite schema for local storage
- Cache invalidation logic
- Background sync when connected to WiFi
- Compression for schema downloads

---

### User Story 15.2 – Apply Configuration from JSON

**As a** field technician  
**I want to** apply a configuration JSON to a device  
**So that** I can standardize sensor setup across multiple sites

**Acceptance Criteria:**
- App verifies JSON configuration against the schema for that device type
- Real-time validation with field-level error highlighting
- Displays invalid or missing fields with specific error messages
- Preview configuration before applying to device
- Push configuration to device via NFC write operation
- Confirmation dialog before writing to prevent accidental changes
- Save a record of configuration changes when authenticated
- Rollback to previous configuration if write fails
- Configuration templates for common setups
- Support for bulk configuration (multiple devices)

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- JSON schema validation library (Newtonsoft.Json.Schema or System.Text.Json)
- NFC write capability with error handling
- Transaction-based NFC writes with verification
- Configuration history tracking
- Device.API integration for audit logging
- Template management (CRUD operations)

---

### User Story 15.3 – Configure Without Logging In ("Tabletop Configuration")

**As a** technician  
**I want to** load a configuration file locally without logging into the platform  
**So that** I can prepare devices before deployment

**Acceptance Criteria:**
- Import configuration JSON via:
  - File picker (from device storage or cloud)
  - QR code scanner
  - Clipboard paste
  - Bluetooth/WiFi transfer from another device
- Validate against cached schema or embedded schema
- Push configuration to device via NFC without cloud connection
- No cloud API calls required for basic operations
- Local logging of configuration changes (synced later when online)
- Embedded schema library for common device types
- Warning when using outdated schemas
- Export configured device list for later cloud provisioning

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- QR code scanning (ZXing.Net.Maui)
- File system access (MAUI File Picker)
- Clipboard API integration
- Bluetooth/WiFi Direct for device-to-device transfer
- Embedded resource schemas
- Local audit log storage

---

### User Story 15.4 – Set Device Location

**As a** technician  
**I want to** set a device's location when configuring it  
**So that** the device registers correctly when installed

**Acceptance Criteria:**
- App captures GPS location using the phone (latitude, longitude, altitude)
- Option to override with manually entered coordinates
- Location accuracy indicator (GPS, network, manual)
- Map view showing device location
- Support for different coordinate formats (decimal degrees, DMS, UTM)
- Location written to device NFC tag (if supported)
- Location written to platform device profile via API
- Ability to adjust location on map by dragging pin
- Address geocoding (convert GPS to street address)
- Save locations as named waypoints for reuse

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- MAUI Geolocation API
- Map control (MAUI Maps or Esri ArcGIS Runtime)
- Coordinate conversion utilities
- Geocoding API integration (Google Maps, OpenStreetMap Nominatim)
- Persistent storage for waypoints
- Device.API integration for location updates

---

## Epic 16: Custom Field Handling and User-Defined Metadata

### User Story 16.1 – Retrieve Custom Fields from Platform

**As a** technician  
**I want** the app to load custom fields defined for a device type  
**So that** I can collect required data during installation

**Acceptance Criteria:**
- Custom fields are pulled from platform metadata (Device Type API)
- Supported field types:
  - Text (single-line, multi-line)
  - Numeric (integer, decimal with validation)
  - Boolean (checkbox, toggle switch)
  - Dropdown (single-select from predefined options)
  - Date/DateTime pickers
  - Image capture (photo from camera or gallery)
  - File attachments
  - Barcode/QR code scanner
  - Signature capture
- Field validation rules respected (required, min/max, regex patterns)
- Conditional fields (show/hide based on other field values)
- Field grouping and sections
- Help text and tooltips for each field
- User can complete mandatory custom fields before provisioning
- Form auto-saves draft responses

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- Dynamic form generation from Device Type schema
- MAUI controls for all field types
- Camera integration for image capture
- File picker for attachments
- Barcode scanner (ZXing.Net.Maui)
- Signature pad control
- Form validation framework
- Local draft storage

---

### User Story 16.2 – Store and Sync Custom Field Data

**As a** technician  
**I want to** enter custom field values and sync them  
**So that** the device has accurate context in SensorMine

**Acceptance Criteria:**
- Offline entry available (stored locally in SQLite)
- Syncs values and attachments when back online
- Validation for required fields before submission
- Visual indicator showing sync status (pending, syncing, synced, failed)
- Conflict resolution when same device edited on multiple devices
- Attachment compression and upload optimization
- Batch sync for multiple devices
- Retry logic for failed syncs
- Manual sync trigger
- Last synced timestamp display

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- SQLite local database
- Background sync service
- File upload to Azure Blob Storage or S3
- Image compression before upload
- Sync queue management
- Conflict resolution strategy (server wins, client wins, manual)
- Network connectivity monitoring

---

## Epic 17: Device Lifecycle Management

### User Story 17.1 – Reconfigure Device

**As a** technician  
**I want to** reconfigure an existing device  
**So that** I can update settings, change schemas, or adjust Nexus behaviour

**Acceptance Criteria:**
- App loads current configuration from platform or device (via NFC)
- User can modify configuration fields
- Re-push configuration to device via NFC
- Change history logged on the platform
- Side-by-side comparison of old vs new configuration
- Warning if changes require firmware update
- Rollback option to previous configuration
- Test configuration before applying
- Audit trail of all configuration changes

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- Device.API integration for configuration retrieval
- NFC read/write operations
- Diff algorithm for configuration comparison
- Audit logging
- Rollback mechanism

---

### User Story 17.2 – Deprovision Device

**As a** technician  
**I want to** deprovision a device  
**So that** it can be safely removed from service or repurposed

**Acceptance Criteria:**
- Deprovision endpoint called on platform
- Device flagged as inactive in platform
- Optional wipe or reset pushed to device via NFC
- Confirmation dialog before deprovisioning
- Archive device data option
- Deprovision reason capture (broken, relocated, replaced)
- Audit log entry created
- Device removed from active device list
- Historical data retention policy applied

**Priority:** Medium  
**Story Points:** 8

**Technical Requirements:**
- Device.API deprovision endpoint
- NFC factory reset command
- Confirmation dialogs
- Reason selection dropdown
- Audit logging

---

### User Story 17.3 – Toggle Maintenance Mode

**As a** technician  
**I want to** put a device into maintenance mode  
**So that** it stops broadcasting while temporarily removed or worked on

**Acceptance Criteria:**
- User can enable/disable maintenance mode from device detail page
- App pushes the setting via NFC or platform API
- Device configuration reflects broadcast state (enabled/disabled)
- Platform visibility updated (device shown as "In Maintenance")
- Alerts suspended during maintenance mode
- Maintenance mode duration setting (indefinite or scheduled end time)
- Automatic mode exit after duration expires
- Notification when device returns to active mode
- Audit log of maintenance mode changes

**Priority:** Medium  
**Story Points:** 5

**Technical Requirements:**
- Device.API maintenance mode endpoints
- NFC command for local mode toggle
- Scheduled task for automatic mode exit
- Push notifications

---

## Epic 18: Offline-First Operation and Sync

### User Story 18.1 – Offline Caching of Schemas and Configurations

**As a** technician in the field  
**I want to** access schemas and previous configurations offline  
**So that** I can operate in remote Australian locations

**Acceptance Criteria:**
- App caches device schemas in local SQLite database
- Caches Nexus configuration capabilities
- Caches custom field definitions
- Automatically updates cache when online
- Manual "refresh metadata" option in settings
- Cache size limit with intelligent eviction (LRU)
- Offline indicator in UI
- Pre-load cache for specific device types or regions
- Export/import cache for sharing between technicians

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- SQLite database for offline storage
- Background sync service
- LRU cache eviction strategy
- Network connectivity monitoring
- Cache export/import functionality

---

### User Story 18.2 – Offline Queueing of Actions

**As a** technician  
**I want to** perform provisioning or updates offline  
**So that** actions sync when connectivity returns

**Acceptance Criteria:**
- Local queue for create/update/deprovision actions
- Automatic retry when network is available
- Clear indication of pending vs completed actions
- Queue status page showing pending operations
- Manual retry for failed operations
- Queue persistence across app restarts
- Priority queue for critical operations
- Conflict detection and resolution
- Success/failure notifications after sync

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- SQLite queue table
- Background sync service with WorkManager (Android) or Background Tasks (iOS)
- Network connectivity monitoring
- Retry logic with exponential backoff
- Conflict resolution UI

---

## Epic 19: Security, Permissions, and Auditability

### User Story 19.1 – Secure Access to Platform

**As a** user  
**I want** secure authentication  
**So that** only authorized staff can modify devices

**Acceptance Criteria:**
- Authentication via OAuth 2.0 / OpenID Connect
- Support for Azure AD / Entra ID
- Biometric authentication (fingerprint, Face ID) for app access
- Role-based access controls respected (admin, technician, viewer)
- Token refresh handled seamlessly
- Multi-factor authentication support
- Secure token storage (iOS Keychain, Android Keystore)
- Automatic logout after inactivity
- Session expiration handling with graceful re-authentication

**Priority:** High  
**Story Points:** 13

**Technical Requirements:**
- MSAL (Microsoft Authentication Library) for .NET MAUI
- Biometric authentication (MAUI Essentials)
- Secure storage (MAUI SecureStorage)
- Token refresh logic
- Role-based UI hiding/showing

---

### User Story 19.2 – Full Audit Trail of Field Actions

**As a** system owner  
**I want** an audit history of all field interactions  
**So that** I can track configuration integrity across the network

**Acceptance Criteria:**
- Every push, read, or configuration change recorded
- NFC-only changes stored locally and synced when authenticated
- Audit log includes:
  - Timestamp (UTC)
  - Device ID
  - User ID
  - Action type (read, write, configure, deprovision)
  - Old configuration (for changes)
  - New configuration (for changes)
  - GPS location of action
  - Result (success/failure)
- Audit logs synced to platform when online
- Local audit log viewer in app
- Export audit logs as CSV or JSON
- Platform audit log API integration

**Priority:** High  
**Story Points:** 8

**Technical Requirements:**
- Local SQLite audit log table
- Background sync service
- Device.API audit log endpoints
- Export functionality
- GPS location capture

---

## Mobile App Architecture

### Technology Stack

**Framework:**
- .NET MAUI (.NET 8+)
- C# 12

**UI Framework:**
- MAUI controls (native)
- Community Toolkit MAUI
- Syncfusion MAUI controls (for advanced charts/gauges)
- .NET MAUI Maps

**Data & Storage:**
- SQLite (via SQLite-net-pcl)
- Entity Framework Core for SQLite
- MAUI SecureStorage for credentials

**Networking:**
- HttpClient for REST API calls
- Refit for typed HTTP clients
- Polly for resilience (retry, circuit breaker)

**NFC:**
- iOS: CoreNFC via Platform-Specific code
- Android: Android.Nfc API via Platform-Specific code

**Authentication:**
- MSAL (Microsoft Authentication Library)
- Azure AD / Entra ID integration

**Other Libraries:**
- ZXing.Net.Maui (QR code scanning)
- CommunityToolkit.Mvvm (MVVM framework)
- Serilog (logging)
- Akavache (caching)

---

### App Architecture Pattern

**MVVM (Model-View-ViewModel):**
- Views: XAML pages
- ViewModels: Business logic, data binding
- Models: Domain entities
- Services: API clients, NFC, database

**Project Structure:**
```
Sensormine.Mobile.Maui/
├── Views/                    # XAML pages
│   ├── Devices/              # Device-related pages
│   │   ├── DeviceListPage.xaml
│   │   ├── DeviceDetailPage.xaml
│   │   ├── DeviceConfigPage.xaml
│   │   └── NfcScanPage.xaml
│   ├── Diagnostics/          # Diagnostic pages
│   │   └── DiagnosticsPage.xaml
│   ├── Configuration/        # Configuration pages
│   │   ├── ConfigurationEditorPage.xaml
│   │   └── TemplatesPage.xaml
│   └── Settings/             # App settings
│       └── SettingsPage.xaml
│
├── ViewModels/               # ViewModels (MVVM)
│   ├── Devices/
│   ├── Diagnostics/
│   ├── Configuration/
│   └── Settings/
│
├── Models/                   # Domain models
│   ├── Device.cs
│   ├── DeviceType.cs
│   ├── Configuration.cs
│   ├── DiagnosticInfo.cs
│   └── AuditLog.cs
│
├── Services/                 # Business logic services
│   ├── Api/                  # API clients
│   │   ├── IDeviceApiClient.cs
│   │   ├── ISchemaApiClient.cs
│   │   └── IAuthService.cs
│   ├── Nfc/                  # NFC services
│   │   ├── INfcService.cs
│   │   ├── NfcServiceiOS.cs    # iOS implementation
│   │   └── NfcServiceAndroid.cs # Android implementation
│   ├── Data/                 # Database services
│   │   ├── IDeviceRepository.cs
│   │   ├── ISyncService.cs
│   │   └── DatabaseContext.cs
│   ├── Location/             # GPS services
│   │   └── ILocationService.cs
│   └── Configuration/        # Configuration management
│       └── IConfigurationService.cs
│
├── Platforms/                # Platform-specific code
│   ├── Android/              # Android-specific
│   │   └── NfcPermissions.cs
│   ├── iOS/                  # iOS-specific
│   │   └── NfcEntitlements.cs
│   └── Windows/              # Windows (optional)
│
├── Resources/                # Images, fonts, styles
│   ├── Images/
│   ├── Fonts/
│   └── Styles/
│
└── MauiProgram.cs            # App startup and DI registration
```

---

### Data Synchronization Strategy

**Offline-First Approach:**
1. All operations are performed against local SQLite database first
2. Background service monitors network connectivity
3. When online, sync service pushes queued operations to platform APIs
4. Conflict resolution uses "last write wins" with user notification

**Sync Queue Priority:**
1. Audit logs (critical for compliance)
2. Device provisioning/deprovisioning
3. Configuration changes
4. Diagnostic reads
5. Custom field data
6. Attachments (images, files)

**Sync Indicators:**
- Green checkmark: Successfully synced
- Orange clock: Pending sync
- Red X: Failed sync (with retry option)
- Gray cloud: No network connectivity

---

### Security Considerations

**Data at Rest:**
- Sensitive data encrypted using platform-specific secure storage
- SQLite database encrypted using SQLCipher (via SQLitePCLRaw)
- Device credentials never stored in plain text

**Data in Transit:**
- All API calls use HTTPS (TLS 1.3)
- Certificate pinning for added security
- Token-based authentication (OAuth 2.0)

**NFC Security:**
- NFC write operations require authentication
- Configuration validation before writing
- Audit logging of all NFC operations
- NFC session timeout after 30 seconds

**App Security:**
- Biometric authentication required for sensitive operations
- Automatic logout after 15 minutes of inactivity
- Screen capture disabled on sensitive pages
- Root/jailbreak detection (warning to user)

---

### Performance Targets

**App Startup:**
- Cold start: < 3 seconds
- Warm start: < 1 second

**NFC Operations:**
- NFC scan and read: < 2 seconds
- NFC write configuration: < 5 seconds

**UI Responsiveness:**
- Page navigation: < 300ms
- Form interactions: < 100ms
- List scrolling: 60 FPS

**Sync Performance:**
- Background sync every 5 minutes when connected
- Batch operations: 100 devices per sync
- Incremental sync for unchanged data

---

## Testing Strategy

**Unit Tests:**
- ViewModels business logic
- API clients (mocked)
- Data repositories
- Configuration validation

**Integration Tests:**
- API integration
- Database operations
- Sync service

**UI Tests:**
- Critical user flows (device provisioning, NFC scan)
- MAUI UI Testing framework

**Platform-Specific Tests:**
- NFC functionality on iOS and Android
- Biometric authentication
- GPS accuracy

**Manual Testing:**
- NFC hardware testing with real devices
- Offline scenario testing
- Field testing in remote locations

---

## Deployment & Distribution

**iOS:**
- App Store distribution
- Enterprise distribution (in-house)
- TestFlight for beta testing
- Minimum iOS version: 14.0+

**Android:**
- Google Play Store distribution
- Enterprise distribution (APK sideloading)
- Minimum Android version: 8.0 (API 26)+
- NFC required in manifest

**CI/CD:**
- GitHub Actions for automated builds
- Code signing for both platforms
- Automated testing on build
- Version management with semantic versioning

---

## Roadmap

### Phase 1: MVP (3 months)
- Epic 14: NFC device discovery and diagnostics
- Epic 15: Basic configuration and provisioning
- Epic 19: Authentication and security

### Phase 2: Full Offline Support (2 months)
- Epic 18: Offline caching and sync queues
- Epic 16: Custom field handling

### Phase 3: Lifecycle Management (2 months)
- Epic 17: Device reconfiguration and deprovisioning
- Advanced diagnostics and analytics

### Phase 4: Polish & Optimization (1 month)
- Performance optimization
- UI/UX improvements
- Bug fixes and hardening
- User feedback incorporation

**Total Estimated Timeline: 8 months**
**Total Story Points: 162 points**

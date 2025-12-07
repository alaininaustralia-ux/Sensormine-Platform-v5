using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui;
using Serilog;

namespace Sensormine.Mobile.Maui;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Configure Serilog for logging
        ConfigureLogging();

        // Register services
        RegisterServices(builder.Services);

        // Register ViewModels
        RegisterViewModels(builder.Services);

        // Register Views
        RegisterViews(builder.Services);

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }

    private static void ConfigureLogging()
    {
        var logPath = Path.Combine(FileSystem.AppDataDirectory, "logs", "app.log");
        
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.File(
                logPath,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 7)
            .CreateLogger();
    }

    private static void RegisterServices(IServiceCollection services)
    {
        // API Clients
        // TODO: Register Refit API clients for Device.API, SchemaRegistry.API, etc.
        // Note: API base URLs should be configured via appsettings.json for different environments (dev/staging/prod)
        // services.AddRefitClient<IDeviceApiClient>()
        //     .ConfigureHttpClient(c => c.BaseAddress = new Uri(configuration["ApiEndpoints:DeviceApi"]));

        // NFC Services (platform-specific)
        // TODO: Register platform-specific NFC services
        // #if ANDROID
        //     services.AddSingleton<INfcService, NfcServiceAndroid>();
        // #elif IOS
        //     services.AddSingleton<INfcService, NfcServiceiOS>();
        // #endif

        // Database
        // TODO: Register DatabaseContext and repositories
        // services.AddSingleton<DatabaseContext>();
        // services.AddSingleton<IDeviceRepository, DeviceRepository>();

        // Location Services
        // TODO: Register location service
        // services.AddSingleton<ILocationService, LocationService>();

        // Configuration Services
        // TODO: Register configuration management
        // services.AddSingleton<IConfigurationService, ConfigurationService>();

        // Sync Service
        // TODO: Register background sync service
        // services.AddSingleton<ISyncService, SyncService>();

        // Authentication
        // TODO: Register MSAL authentication service
        // services.AddSingleton<IAuthService, AuthService>();
    }

    private static void RegisterViewModels(IServiceCollection services)
    {
        // Device ViewModels
        // TODO: Register device-related ViewModels
        // services.AddTransient<DeviceListViewModel>();
        // services.AddTransient<DeviceDetailViewModel>();

        // Diagnostic ViewModels
        // TODO: Register diagnostic ViewModels
        // services.AddTransient<DiagnosticsViewModel>();

        // Configuration ViewModels
        // TODO: Register configuration ViewModels
        // services.AddTransient<ConfigurationEditorViewModel>();

        // Settings ViewModels
        // TODO: Register settings ViewModels
        // services.AddTransient<SettingsViewModel>();
    }

    private static void RegisterViews(IServiceCollection services)
    {
        // Device Views
        // TODO: Register device pages
        // services.AddTransient<DeviceListPage>();
        // services.AddTransient<DeviceDetailPage>();

        // Diagnostic Views
        // TODO: Register diagnostic pages
        // services.AddTransient<DiagnosticsPage>();

        // Configuration Views
        // TODO: Register configuration pages
        // services.AddTransient<ConfigurationEditorPage>();

        // Settings Views
        // TODO: Register settings pages
        // services.AddTransient<SettingsPage>();
    }
}

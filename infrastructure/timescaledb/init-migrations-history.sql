-- Create EF Migrations History table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Insert migration records for all applied migrations
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES
('20251204214117_InitialSchemaRegistry', '9.0.0'),
('20251205213411_AddDeviceTypeVersioning', '9.0.0'),
('20251206015028_AddDeviceRegistration', '9.0.0'),
('20251206065122_RemoveSchemaForeignKeys', '9.0.0'),
('20251206065348_RemoveSchemaNavigationProperty', '9.0.0'),
('20251206131103_AddUserPreferencesAndSiteConfig', '9.0.0'),
('20251206224738_AddDashboardHierarchy', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

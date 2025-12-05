CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE schemas (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description character varying(1000),
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text,
    is_deleted boolean NOT NULL DEFAULT FALSE,
    "DeletedAt" timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone,
    tenant_id character varying(100) NOT NULL,
    CONSTRAINT "PK_schemas" PRIMARY KEY (id)
);

CREATE TABLE schema_versions (
    id uuid NOT NULL,
    schema_id uuid NOT NULL,
    version character varying(50) NOT NULL,
    json_schema text NOT NULL,
    status character varying(50) NOT NULL,
    is_default boolean NOT NULL DEFAULT FALSE,
    "CreatedBy" text NOT NULL,
    device_types jsonb NOT NULL,
    "Metadata" text,
    created_at timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    tenant_id character varying(100) NOT NULL,
    CONSTRAINT "PK_schema_versions" PRIMARY KEY (id),
    CONSTRAINT "FK_schema_versions_schemas_schema_id" FOREIGN KEY (schema_id) REFERENCES schemas (id) ON DELETE CASCADE
);

CREATE INDEX ix_schema_versions_schema_default ON schema_versions (schema_id, is_default) WHERE is_default = true;

CREATE UNIQUE INDEX ix_schema_versions_schema_version ON schema_versions (schema_id, version);

CREATE INDEX ix_schema_versions_status ON schema_versions (status);

CREATE INDEX ix_schema_versions_tenant ON schema_versions (tenant_id);

CREATE INDEX ix_schemas_deleted ON schemas (is_deleted);

CREATE INDEX ix_schemas_tenant ON schemas (tenant_id);

CREATE UNIQUE INDEX ix_schemas_tenant_name ON schemas (tenant_id, name) WHERE is_deleted = false;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251204214117_InitialSchemaRegistry', '9.0.2');

COMMIT;


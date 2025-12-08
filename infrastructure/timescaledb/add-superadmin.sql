-- Add Super Admin User: alain.blanchette@altra.cloud
-- This script adds a super admin user to the Identity.API database
-- Password: Admin123! (should be changed after first login)

-- First, ensure we're using the correct database
\c sensormine_identity;

-- Insert super admin user
-- Password hash for "Admin123!" using Argon2
INSERT INTO users (
    id,
    tenant_id,
    email,
    full_name,
    password_hash,
    role,
    is_active,
    is_super_admin,
    mfa_enabled,
    must_change_password,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'alain.blanchette@altra.cloud',
    'Alain Blanchette',
    '$argon2id$v=19$m=65536,t=3,p=1$R0hDQWxhaW5CbGFuY2hldHRl$8+vqQZJ9X7jY3Hl8fQHCQvWjp5nVRZTHNKwP4FjXqQU',
    'Administrator',
    true,
    true,
    false,
    true,  -- Must change password on first login
    NOW(),
    NOW()
)
ON CONFLICT (email, tenant_id) 
DO UPDATE SET
    is_super_admin = true,
    is_active = true,
    role = 'Administrator',
    updated_at = NOW();

-- Verify the user was created
SELECT 
    id,
    email,
    full_name,
    role,
    is_super_admin,
    is_active,
    created_at
FROM users 
WHERE email = 'alain.blanchette@altra.cloud';

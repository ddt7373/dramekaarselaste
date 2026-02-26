-- Add admin_permissions column for sub_admin users
-- This column stores an array of permission keys that define which sections
-- of the HoofAdminDashboard a sub_admin user can access.

ALTER TABLE gebruikers ADD COLUMN IF NOT EXISTS admin_permissions text[];

-- Add comment for documentation
COMMENT ON COLUMN gebruikers.admin_permissions IS 'Array of admin permission keys for sub_admin users. Each key maps to a section in the HoofAdminDashboard.';

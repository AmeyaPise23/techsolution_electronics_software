// Role × permission matrix for the system role axis.
//
// Mirror of backend/src/main/java/com/ecommerce/auth/security/SystemAuthorization.java.
// If you edit either side, update both — docs/permission-matrix.md is the
// human-readable version, and PermissionMatrixParityTest fails the build when
// the two drift.
//
// Every permission here is company-scoped. Tenant lifecycle — creating,
// suspending and reactivating companies — belongs to the Tenant Access
// Management control plane, not to this app. Nothing in this file grants
// cross-company reach, and nothing should be added that does.

import { SystemRole } from "./types";

export type Permission =
  // User administration
  | "USER_VIEW"
  | "USER_MANAGE"
  | "USER_MANAGE_ADMIN"
  // Company configuration
  | "COMPANY_SETTINGS_MANAGE"
  | "EMAIL_SETTINGS_MANAGE"
  // Catalogue
  | "PRODUCT_VIEW"
  | "PRODUCT_WRITE"
  // Clients and vendors
  | "CLIENT_VIEW"
  | "CLIENT_WRITE"
  | "VENDOR_MANAGE"
  // Sales
  | "QUOTATION_VIEW"
  | "QUOTATION_WRITE"
  | "INVOICE_VIEW"
  | "INVOICE_WRITE"
  // Finance
  | "FINANCE_VIEW"
  | "FINANCE_WRITE"
  // Repair
  | "REPAIR_VIEW"
  | "REPAIR_WRITE";

/**
 * `true` = allowed. Read a row as "who may do this".
 *
 * Owner holds everything. Admin is Owner minus the three that define or hand
 * out control of the company itself: granting ADMIN, and company/email
 * settings. User is the operational subset.
 */
export const PERMISSIONS: Record<Permission, Record<SystemRole, boolean>> = {
  // User administration
  "USER_VIEW":               { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },
  "USER_MANAGE":             { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },
  // Granting ADMIN is the privilege-escalation edge, so it is owner-only.
  "USER_MANAGE_ADMIN":       { [SystemRole.Root]: true, [SystemRole.Admin]: false, [SystemRole.User]: false },

  // Company configuration — owner only.
  "COMPANY_SETTINGS_MANAGE": { [SystemRole.Root]: true, [SystemRole.Admin]: false, [SystemRole.User]: false },
  "EMAIL_SETTINGS_MANAGE":   { [SystemRole.Root]: true, [SystemRole.Admin]: false, [SystemRole.User]: false },

  // Catalogue
  "PRODUCT_VIEW":            { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "PRODUCT_WRITE":           { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },

  // Clients and vendors
  "CLIENT_VIEW":             { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "CLIENT_WRITE":            { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },
  "VENDOR_MANAGE":           { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },

  // Sales
  "QUOTATION_VIEW":          { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "QUOTATION_WRITE":         { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "INVOICE_VIEW":            { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "INVOICE_WRITE":           { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },

  // Finance
  "FINANCE_VIEW":            { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },
  "FINANCE_WRITE":           { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: false },

  // Repair
  "REPAIR_VIEW":             { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
  "REPAIR_WRITE":            { [SystemRole.Root]: true, [SystemRole.Admin]: true,  [SystemRole.User]: true  },
};

/**
 * Does this role hold this permission?
 *
 * Fails closed: an unknown role or permission is a denial, never a grant. This
 * only decides what the UI offers — the server decides what actually happens,
 * and refuses independently.
 */
export function can(permission: Permission, role: SystemRole | null | undefined): boolean {
  if (!role) return false;
  return PERMISSIONS[permission]?.[role] ?? false;
}

/** Every permission a role holds. Useful for debugging and for the parity test. */
export function permissionsFor(role: SystemRole | null | undefined): Permission[] {
  if (!role) return [];
  return (Object.keys(PERMISSIONS) as Permission[]).filter((p) => PERMISSIONS[p][role]);
}

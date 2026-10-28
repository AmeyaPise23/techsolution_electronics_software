// Mirror of com.ecommerce.auth.enums.SystemRole. String values are the JSON
// contract — they are what `users.role` stores and what the login response
// returns.

export enum SystemRole {
  /** The company's own account, created when the company is provisioned. */
  Root = "ROLE_ROOT",
  /** Delegated operator, created by the owner. */
  Admin = "ROLE_ADMIN",
  /** Day-to-day user. */
  User = "ROLE_USER",
}

/** Ranks match SystemRole.rank() on the server. Higher implies lower. */
const RANK: Record<SystemRole, number> = {
  [SystemRole.Root]: 300,
  [SystemRole.Admin]: 200,
  [SystemRole.User]: 100,
};

/**
 * Lenient parse for the read path, matching SystemRole.fromNullable: an unknown
 * or missing role degrades to the least privilege rather than throwing, so a
 * stale token can never accidentally widen access.
 */
export function toSystemRole(role: string | null | undefined): SystemRole {
  switch (role) {
    case SystemRole.Root:
      return SystemRole.Root;
    case SystemRole.Admin:
      return SystemRole.Admin;
    default:
      return SystemRole.User;
  }
}

export function outranks(a: SystemRole, b: SystemRole): boolean {
  return RANK[a] > RANK[b];
}

/** Human label for a role. "Owner" reads better than "Root" in the UI. */
export function roleLabel(role: string | null | undefined): string {
  switch (toSystemRole(role)) {
    case SystemRole.Root:
      return "Owner";
    case SystemRole.Admin:
      return "Admin";
    default:
      return "User";
  }
}

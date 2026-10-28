import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authService, User, LoginRequest } from "../services/authService";
import { SystemRole, toSystemRole, roleLabel } from "../features/auth/types";
import { Permission, can as roleCan } from "../features/auth/permissions";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** The signed-in account's system role. Null when signed out. */
  role: SystemRole | null;
  roleLabel: string;
  isRoot: boolean;
  isAdmin: boolean;
  /** True after an administrative reset, until the user picks a new password. */
  mustChangePassword: boolean;
  /**
   * Does the signed-in user hold this permission?
   *
   * This decides what the UI offers, not what the server allows — the server
   * checks independently and refuses on its own. Never treat a `true` here as
   * authorization.
   */
  can: (permission: Permission) => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  /** Re-read the account from the server. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Paint immediately from what we already know, then reconcile with the
      // server. Local storage only records what was true at sign-in: a role
      // change or a forced password reset would otherwise stay invisible until
      // the next login.
      const cached = authService.getCurrentUser();
      if (!cancelled && cached) setUser(cached);

      try {
        const fresh = await authService.fetchMe();
        if (!cancelled) setUser(fresh);
      } catch {
        // A failed reconcile is not proof of a bad session — it may just be a
        // dropped connection. authenticatedFetch already signs the user out if
        // the token is genuinely rejected, so keep the cached view here.
        if (!cancelled && !cached) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setUser({
      id: response.id,
      username: response.username,
      email: response.email,
      role: response.role,
      companyId: response.companyId,
      companyName: response.companyName,
      companyCode: response.companyCode,
      mustChangePassword: response.mustChangePassword,
    });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUser(await authService.fetchMe());
    } catch {
      // Leave the current view in place; see the note in hydrate().
    }
  }, []);

  const role = user ? toSystemRole(user.role) : null;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    role,
    roleLabel: roleLabel(user?.role),
    isRoot: role === SystemRole.Root,
    isAdmin: role === SystemRole.Admin,
    mustChangePassword: user?.mustChangePassword ?? false,
    can: (permission: Permission) => roleCan(permission, role),
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

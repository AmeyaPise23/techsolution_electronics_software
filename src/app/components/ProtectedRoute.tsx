import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Permission } from "../features/auth/permissions";
import { Forbidden } from "./Forbidden";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When set, the signed-in user must hold this permission. */
  requiredPermission?: Permission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, can, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="size-16 rounded-full bg-primary/20 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in at all — send them to sign in, remembering where they wanted
  // to go.
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // After an administrative password reset the credential is one somebody else
  // chose. Nothing else in the app is reachable until it is replaced.
  if (mustChangePassword && location.pathname !== "/admin/account/security") {
    return <Navigate to="/admin/account/security" replace />;
  }

  // Signed in, but not permitted. Deliberately not a redirect to sign-in:
  // this is an authorization failure, not an authentication one, and the
  // server refuses it independently regardless of what this check says.
  if (requiredPermission && !can(requiredPermission)) {
    return <Forbidden />;
  }

  return <>{children}</>;
}

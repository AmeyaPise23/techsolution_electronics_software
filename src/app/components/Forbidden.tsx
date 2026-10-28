import { Link } from "react-router";
import { ShieldOff } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

/**
 * Shown when a signed-in user reaches something they may not see.
 *
 * Distinct from the sign-in redirect on purpose: bouncing an authenticated
 * user to a login form suggests their session expired and invites them to
 * re-enter credentials that were never the problem.
 */
export function Forbidden({ message }: { message?: string }) {
  const { roleLabel } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto size-14 rounded-full bg-muted flex items-center justify-center">
          <ShieldOff className="size-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">You don't have access to this page</h1>
        <p className="text-sm text-muted-foreground">
          {message ??
            `Your account is signed in as ${roleLabel}, which doesn't include this area. Ask your company owner if you need access.`}
        </p>
        <Button asChild variant="outline">
          <Link to="/admin">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

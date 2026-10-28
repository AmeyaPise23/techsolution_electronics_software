import { useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, Lock, User, AlertCircle, Crown, Users, Building2, Mail } from "lucide-react";
import { AuthError, LoginMode } from "../services/authService";
import { toast } from "sonner";

/**
 * Two sign-in identities, in the shape AWS uses for root vs IAM.
 *
 * The owner is the account the company was provisioned with, identified by
 * email. Everyone else signs in against their company, the way an IAM user
 * signs in against an account id. The backend enforces the split — the owner
 * card cannot sign in a team member, and vice versa — so this is a real
 * boundary, not a UI convenience.
 */
export function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<LoginMode>("ROOT");
  const [identifier, setIdentifier] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Navigating during render is a side effect; <Navigate> is the supported way.
  if (isAuthenticated) {
    return <Navigate to={searchParams.get("redirect") || "/admin"} replace />;
  }

  const isOwner = mode === "ROOT";

  function switchMode(next: LoginMode) {
    if (next === mode) return;
    setMode(next);
    setError("");
    setIdentifier("");
    setCompanyCode("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(isOwner ? "Please enter your email address" : "Please enter your username");
      return;
    }
    if (!isOwner && !companyCode.trim()) {
      setError("Please enter your company code");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      setLoading(true);
      await login({
        username: identifier.trim(),
        password,
        loginAs: mode,
        ...(isOwner ? {} : { companyCode: companyCode.trim() }),
      });
      toast.success("Signed in");
      navigate(searchParams.get("redirect") || "/admin");
    } catch (err) {
      // 401 / 403 / 423 carry different meanings; AuthError keeps them apart.
      let message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      if (err instanceof AuthError && err.status === 401 && isOwner) {
        message += ". If you are not the account owner, use the Team member tab.";
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="size-12 rounded-lg bg-primary flex items-center justify-center">
              <Lock className="size-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Choose how you want to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Identity chooser */}
          <div className="grid grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Sign-in type">
            <button
              type="button"
              role="radio"
              aria-checked={isOwner}
              onClick={() => switchMode("ROOT")}
              disabled={loading}
              className={`rounded-lg border-2 p-3 text-left transition-colors ${
                isOwner
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <Crown className={`size-5 mb-1.5 ${isOwner ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-semibold">Owner</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The company account
              </p>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={!isOwner}
              onClick={() => switchMode("USER")}
              disabled={loading}
              className={`rounded-lg border-2 p-3 text-left transition-colors ${
                !isOwner
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <Users className={`size-5 mb-1.5 ${!isOwner ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-semibold">Team member</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin or user
              </p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Company code — team members only, mirroring an IAM account id. */}
            {!isOwner && (
              <div className="space-y-2">
                <Label htmlFor="companyCode">Company code</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="companyCode"
                    type="text"
                    placeholder="e.g. ACME-1234"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="organization"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ask your administrator if you don't know it.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">{isOwner ? "Email address" : "Username"}</Label>
              <div className="relative">
                {isOwner ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                )}
                <Input
                  id="identifier"
                  type={isOwner ? "email" : "text"}
                  placeholder={isOwner ? "you@company.com" : "Enter your username"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete={isOwner ? "email" : "username"}
                  autoFocus={isOwner}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : isOwner ? "Sign in as owner" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Contact your administrator to register a new company.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

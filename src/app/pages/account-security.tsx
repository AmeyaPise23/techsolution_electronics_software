import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { authService, AuthError } from "../services/authService";
import { userService, UserInfo } from "../services/userService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { AlertCircle, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const MIN_PASSWORD_LENGTH = 10;

/** Mirrors PasswordPolicyValidator. The server re-checks and is authoritative. */
function policyProblem(password: string, username?: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 72) {
    return "Password must be at most 72 characters";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one digit";
  }
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return "Password must not be the same as the username";
  }
  return null;
}

export function AccountSecurity() {
  const navigate = useNavigate();
  const { user, logout, mustChangePassword } = useAuth();

  const [profile, setProfile] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService
      .getMe()
      .then(setProfile)
      .catch(() => {
        /* The form works without it; this only feeds the summary below. */
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Enter your current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords don't match");
      return;
    }
    const problem = policyProblem(newPassword, user?.username);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword === currentPassword) {
      setError("The new password must differ from the current one");
      return;
    }

    try {
      setSaving(true);
      await authService.changePassword(currentPassword, newPassword);

      // Changing the password revokes every refresh token, this session's
      // included, so there is nothing left to stay signed in with.
      toast.success("Password changed. Please sign in again.");
      logout();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      const message =
        err instanceof AuthError && err.status === 401
          ? "Your current password is incorrect"
          : err instanceof Error
          ? err.message
          : "Could not change your password";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "Never";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account security</h1>
        <p className="text-muted-foreground">
          Manage the password for {user?.username}
        </p>
      </div>

      {mustChangePassword && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <ShieldAlert className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Choose a new password to continue</p>
            <p className="mt-0.5">
              Your password was set by an administrator. Pick one only you know
              before using the rest of the app.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5" />
            Change password
          </CardTitle>
          <CardDescription>
            At least {MIN_PASSWORD_LENGTH} characters, with a letter and a digit.
            Changing it signs you out everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Changing..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">{profile?.username ?? user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email ?? user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company</span>
            <span className="font-medium">{user?.companyName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Password last changed</span>
            <span className="font-medium">{formatDate(profile?.passwordUpdatedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last sign-in</span>
            <span className="font-medium">{formatDate(profile?.lastLogin)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

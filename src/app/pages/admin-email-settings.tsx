import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { toast } from "sonner";
import {
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";
import {
  emailSettingsService,
  EMAIL_PROVIDERS,
  type EmailSettings,
  type EmailSettingsUpdate,
} from "../services/emailSettingsService";

type Step = "configure" | "verify" | "done";

export function AdminEmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [otp, setOtp] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [settings, setSettings] = useState<EmailSettings | null>(null);

  const [form, setForm] = useState<EmailSettingsUpdate>({
    provider: "GODADDY",
    smtpHost: "smtpout.secureserver.net",
    smtpPort: 587,
    emailAddress: "",
    emailPassword: "",
    fromName: "",
    useTls: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await emailSettingsService.getSettings();
      setSettings(data);
      if (data.configured) {
        setForm({
          provider: data.provider,
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          emailAddress: data.emailAddress,
          emailPassword: "",
          fromName: data.fromName || "",
          useTls: data.useTls,
        });
        if (data.verified) {
          setStep("done");
        }
      }
    } catch (err) {
      toast.error("Failed to load email settings");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof EmailSettingsUpdate>(
    field: K,
    value: EmailSettingsUpdate[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleProviderChange(provider: string) {
    const preset = EMAIL_PROVIDERS.find((p) => p.value === provider);
    if (preset) {
      setForm((prev) => ({
        ...prev,
        provider: preset.value,
        smtpHost: preset.host || prev.smtpHost,
        smtpPort: preset.port,
        useTls: preset.tls,
      }));
    }
  }

  const selectedProvider = EMAIL_PROVIDERS.find(
    (p) => p.value === form.provider
  );

  async function handleSave() {
    if (!form.emailAddress || !form.emailPassword || !form.smtpHost) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const data = await emailSettingsService.saveSettings(form);
      setSettings(data);
      toast.success("Email settings saved");
      if (!data.verified) {
        setStep("configure");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOtp() {
    setSendingOtp(true);
    try {
      await emailSettingsService.sendOtp();
      toast.success("Verification OTP sent to your email");
      setStep("verify");
      setOtp("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      const data = await emailSettingsService.verifyOtp(otp);
      setSettings(data);
      toast.success("Email verified successfully!");
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    setSendingTest(true);
    try {
      await emailSettingsService.sendTestEmail(testEmail);
      toast.success("Test email sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/company-settings"
          className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Email Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your company's email to send invoices, quotations, and
            notifications
          </p>
        </div>
        {settings?.verified && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Verified
          </div>
        )}
        {settings?.configured && !settings.verified && (
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <AlertCircle className="size-4" />
            Not Verified
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="size-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Email Provider</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={form.provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider?.hint && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {selectedProvider.hint}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={form.smtpHost}
                onChange={(e) => update("smtpHost", e.target.value)}
                placeholder="smtp.example.com"
                disabled={form.provider !== "CUSTOM"}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                type="number"
                value={form.smtpPort}
                onChange={(e) => update("smtpPort", parseInt(e.target.value))}
                disabled={form.provider !== "CUSTOM"}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.useTls}
              onCheckedChange={(v) => update("useTls", v)}
              disabled={form.provider !== "CUSTOM"}
            />
            <Label className="cursor-pointer">Use TLS (recommended)</Label>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Credentials</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={form.emailAddress}
              onChange={(e) => update("emailAddress", e.target.value)}
              placeholder="company@yourdomain.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.emailPassword}
                onChange={(e) => update("emailPassword", e.target.value)}
                placeholder={
                  settings?.configured
                    ? "Enter new password to change"
                    : "Enter email password"
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Display Name{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              value={form.fromName}
              onChange={(e) => update("fromName", e.target.value)}
              placeholder="e.g. Techsolution India"
            />
            <p className="text-xs text-muted-foreground">
              Shown as the sender name in emails. Defaults to your email address
              if not set.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Settings
          </Button>

          {settings?.configured && !settings.verified && (
            <Button
              variant="outline"
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Verification OTP
            </Button>
          )}
        </div>
      </div>

      {/* OTP Verification */}
      {step === "verify" && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Verify Your Email</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            We sent a 6-digit OTP to{" "}
            <strong className="text-foreground">{form.emailAddress}</strong>.
            Enter it below to verify.
          </p>

          <div className="mb-6 flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleVerifyOtp} disabled={verifying}>
              {verifying && <Loader2 className="mr-2 size-4 animate-spin" />}
              Verify
            </Button>
            <Button
              variant="ghost"
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              Resend OTP
            </Button>
          </div>
        </div>
      )}

      {/* Test Email (only shown when verified) */}
      {step === "done" && settings?.verified && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Send className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Send Test Email</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Send a test email to confirm everything works correctly.
          </p>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              variant="outline"
            >
              {sendingTest && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Settings as SettingsIcon } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Configure your store and preferences
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-border bg-card p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <SettingsIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">Settings coming soon</h3>
          <p className="text-muted-foreground">
            Store settings and configuration options will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}

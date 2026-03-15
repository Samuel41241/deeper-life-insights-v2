import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-description">System configuration, roles, and preferences</p>
      </div>
      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <SettingsIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>System settings, role management, and organization configuration</p>
        </div>
      </div>
    </div>
  );
}

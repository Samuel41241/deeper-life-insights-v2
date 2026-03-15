import { BellRing } from "lucide-react";

export default function Engagement() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Engagement & Alerts</h1>
        <p className="admin-page-description">Track member engagement, follow-up flags, and automated alerts</p>
      </div>
      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <BellRing className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Engagement dashboard with alert management and follow-up tracking</p>
        </div>
      </div>
    </div>
  );
}

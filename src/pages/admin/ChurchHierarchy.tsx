import { Network } from "lucide-react";

export default function ChurchHierarchy() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Church Hierarchy</h1>
        <p className="admin-page-description">Manage states, regions, group districts, districts, and locations</p>
      </div>
      <div className="stat-card min-h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Network className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Hierarchy management interface will be implemented here</p>
          <p className="text-xs mt-1">States → Regions → Group Districts → Districts → Locations</p>
        </div>
      </div>
    </div>
  );
}

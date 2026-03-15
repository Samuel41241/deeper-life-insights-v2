import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Reports</h1>
        <p className="admin-page-description">Generate and export attendance and engagement reports</p>
      </div>
      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Report generation with charts, tables, and export options</p>
        </div>
      </div>
    </div>
  );
}

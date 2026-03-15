import { History } from "lucide-react";

export default function AttendanceHistory() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Attendance History</h1>
        <p className="admin-page-description">View past attendance records by service and date</p>
      </div>
      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Attendance history with date filters and service selection</p>
        </div>
      </div>
    </div>
  );
}

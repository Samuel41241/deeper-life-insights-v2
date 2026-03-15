import { ScanLine } from "lucide-react";

export default function AttendanceScanner() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Attendance Scanner</h1>
        <p className="admin-page-description">Scan member QR cards to record attendance</p>
      </div>
      <div className="stat-card min-h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>QR scanner interface with camera integration</p>
          <p className="text-xs mt-1">Supports mobile camera and USB scanners</p>
        </div>
      </div>
    </div>
  );
}

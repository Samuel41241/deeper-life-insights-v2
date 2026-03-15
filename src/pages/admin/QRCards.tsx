import { QrCode } from "lucide-react";

export default function QRCards() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">QR Card Management</h1>
        <p className="admin-page-description">Generate, assign, and manage member QR attendance cards</p>
      </div>
      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>QR card generation and assignment interface</p>
        </div>
      </div>
    </div>
  );
}

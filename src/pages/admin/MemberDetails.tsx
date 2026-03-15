import { User } from "lucide-react";
import { useParams } from "react-router-dom";

export default function MemberDetails() {
  const { id } = useParams();

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Member Details</h1>
        <p className="admin-page-description">Viewing member profile and attendance history</p>
      </div>
      <div className="stat-card min-h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Member profile, attendance history, and engagement status</p>
          <p className="text-xs mt-1">Member ID: {id || "—"}</p>
        </div>
      </div>
    </div>
  );
}

import { Users, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Members() {
  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Members</h1>
          <p className="admin-page-description">View and manage church members</p>
        </div>
        <Link to="/admin/members/register">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Register Member
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-9 h-11" />
        </div>
      </div>

      <div className="stat-card min-h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Member list with search, filters, and pagination</p>
          <p className="text-xs mt-1">Card view on mobile, table view on desktop</p>
        </div>
      </div>
    </div>
  );
}

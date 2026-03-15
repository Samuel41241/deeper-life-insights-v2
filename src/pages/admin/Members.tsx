import { useState } from "react";
import { Users, Search, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useMembers } from "@/hooks/use-members";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Constants } from "@/integrations/supabase/types";

const categoryLabels: Record<string, string> = {
  adult_male: "Adult Male",
  adult_female: "Adult Female",
  youth_boy: "Youth Boy",
  youth_girl: "Youth Girl",
  children_boy: "Children Boy",
  children_girl: "Children Girl",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-muted text-muted-foreground",
  transferred: "bg-secondary/20 text-secondary-foreground",
  deceased: "bg-destructive/10 text-destructive",
};

export default function Members() {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const members = useMembers(search || undefined, locationFilter || undefined);
  const locations = useAllLocations();

  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Members</h1>
          <p className="admin-page-description">{members.data?.length ?? 0} members found</p>
        </div>
        <Link to="/admin/members/register">
          <Button><Plus className="mr-2 h-4 w-4" /> Register Member</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[220px] h-11">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.data?.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium text-muted-foreground">Name</th>
              <th className="pb-3 font-medium text-muted-foreground">Category</th>
              <th className="pb-3 font-medium text-muted-foreground">Location</th>
              <th className="pb-3 font-medium text-muted-foreground">Phone</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody>
            {members.data?.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 font-medium">{m.full_name}</td>
                <td className="py-3 text-muted-foreground">{categoryLabels[m.category] || m.category}</td>
                <td className="py-3 text-muted-foreground">{(m as any).locations?.name || "—"}</td>
                <td className="py-3 text-muted-foreground">{m.phone || "—"}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[m.status] || ""}`}>
                    {m.status}
                  </span>
                </td>
                <td className="py-3">
                  <Link to={`/admin/members/${m.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.data?.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No members found</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {members.data?.length === 0 && (
          <div className="stat-card py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No members found</p>
          </div>
        )}
        {members.data?.map((m) => (
          <Link key={m.id} to={`/admin/members/${m.id}`} className="block">
            <div className="stat-card flex items-center gap-4">
              <div className="h-10 w-10 rounded-full brand-gradient flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-xs font-bold">
                  {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">{(m as any).locations?.name || "—"} · {categoryLabels[m.category] || m.category}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusColors[m.status] || ""}`}>
                {m.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

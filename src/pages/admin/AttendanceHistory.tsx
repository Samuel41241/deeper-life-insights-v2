import { useState } from "react";
import { History, Search, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAttendanceHistory } from "@/hooks/use-attendance";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  present: "bg-primary/10 text-primary border-primary/20",
  late: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  absent: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AttendanceHistory() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [search, setSearch] = useState("");

  const services = useServices();
  const locations = useAllLocations();
  const attendance = useAttendanceHistory({
    date: date || undefined,
    serviceId: serviceId || undefined,
    locationId: locationId || undefined,
    search: search || undefined,
  });

  const records = attendance.data || [];

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Attendance History</h1>
        <p className="admin-page-description">
          {records.length} record{records.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 h-11 w-full sm:w-[180px]"
          />
        </div>
        <Select value={serviceId} onValueChange={(v) => setServiceId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[220px] h-11">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationId} onValueChange={(v) => setLocationId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[220px] h-11">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.data?.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium text-muted-foreground">Member</th>
              <th className="pb-3 font-medium text-muted-foreground">Service</th>
              <th className="pb-3 font-medium text-muted-foreground">Location</th>
              <th className="pb-3 font-medium text-muted-foreground">Time</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground">Card</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 font-medium">{r.members?.full_name || "—"}</td>
                <td className="py-3 text-muted-foreground">{r.services?.name || "—"}</td>
                <td className="py-3 text-muted-foreground">{r.locations?.name || "—"}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(r.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] || ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground text-xs">{r.cards?.card_number || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No attendance records found</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {records.length === 0 && (
          <div className="stat-card py-12 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No attendance records found</p>
          </div>
        )}
        {records.map((r: any) => (
          <div key={r.id} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{r.members?.full_name || "—"}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] || ""}`}>
                {r.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{r.services?.name || "—"} · {r.locations?.name || "—"}</p>
              <p>{new Date(r.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

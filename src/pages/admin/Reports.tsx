import { useState, useMemo } from "react";
import { BarChart3, Users, UserCheck, TrendingUp, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAttendanceHistory, useTodayAttendanceCount, useTotalMembers } from "@/hooks/use-attendance";
import { useTodayNewcomerCount, useNewcomerHistory } from "@/hooks/use-newcomers";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useScopedLocationIds } from "@/hooks/use-user-role";

export default function Reports() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: scopedLocations } = useScopedLocationIds();
  const services = useServices();
  const locations = useAllLocations();

  const totalMembers = useTotalMembers(scopedLocations);
  const todayMembers = useTodayAttendanceCount(serviceFilter || undefined, scopedLocations);
  const todayNewcomers = useTodayNewcomerCount(serviceFilter || undefined, scopedLocations);

  const attendance = useAttendanceHistory({
    date: dateFilter,
    serviceId: serviceFilter || undefined,
    locationId: locationFilter || undefined,
  });

  const newcomerHistory = useNewcomerHistory({
    date: dateFilter,
    serviceId: serviceFilter || undefined,
    locationId: locationFilter || undefined,
  });

  const memberCount = totalMembers.data ?? 0;
  const membersPresent = todayMembers.data ?? 0;
  const newcomersCount = todayNewcomers.data ?? 0;
  const totalAttendance = membersPresent + newcomersCount;

  // Newcomer breakdown from history
  const newcomerBreakdown = useMemo(() => {
    if (!newcomerHistory.data) return { male: 0, female: 0, youth: 0, children: 0 };
    return newcomerHistory.data.reduce(
      (acc: any, r: any) => ({
        male: acc.male + (r.male_count || 0),
        female: acc.female + (r.female_count || 0),
        youth: acc.youth + (r.youth_count || 0),
        children: acc.children + (r.children_count || 0),
      }),
      { male: 0, female: 0, youth: 0, children: 0 }
    );
  }, [newcomerHistory.data]);

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Reports</h1>
        <p className="admin-page-description">Attendance and newcomer reports with combined summaries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-[200px] h-11"
        />
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full sm:w-[240px] h-11">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.day_of_week}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[240px] h-11">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.data?.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Members Present</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-heading font-bold">{membersPresent.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">of {memberCount.toLocaleString()} total members</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Newcomers</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-heading font-bold">{newcomersCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">First-timers recorded</p>
        </div>
        <div className="stat-card border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Attendance</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-heading font-bold">{totalAttendance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Combined footprint</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Attendance Rate</span>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-heading font-bold">
            {memberCount > 0 ? ((membersPresent / memberCount) * 100).toFixed(1) : "0"}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Member attendance rate</p>
        </div>
      </div>

      {/* Newcomer Breakdown */}
      {newcomersCount > 0 && (
        <div className="stat-card">
          <h2 className="text-lg font-heading font-semibold mb-3">Newcomer Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.male}</p>
              <p className="text-xs text-muted-foreground">Male</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.female}</p>
              <p className="text-xs text-muted-foreground">Female</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.youth}</p>
              <p className="text-xs text-muted-foreground">Youth</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.children}</p>
              <p className="text-xs text-muted-foreground">Children</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="stat-card">
        <h2 className="text-lg font-heading font-semibold mb-3">Member Attendance Records</h2>
        {attendance.isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : !attendance.data?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No attendance records for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Member</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Location</th>
                  <th className="pb-3 font-medium text-muted-foreground">Time</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.data.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{r.members?.full_name || "—"}</td>
                    <td className="py-2 text-muted-foreground hidden sm:table-cell">{r.services?.name || "—"}</td>
                    <td className="py-2 text-muted-foreground hidden md:table-cell">{r.locations?.name || "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(r.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "present" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Newcomer History */}
      {newcomerHistory.data && newcomerHistory.data.length > 0 && (
        <div className="stat-card">
          <h2 className="text-lg font-heading font-semibold mb-3">Newcomer Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Location</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="pb-3 font-medium text-muted-foreground">Total</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">M</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">F</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {newcomerHistory.data.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{r.locations?.name || "—"}</td>
                    <td className="py-2 text-muted-foreground hidden sm:table-cell">{r.services?.name || "—"}</td>
                    <td className="py-2 font-semibold">{r.total_count}</td>
                    <td className="py-2 text-muted-foreground hidden md:table-cell">{r.male_count}</td>
                    <td className="py-2 text-muted-foreground hidden md:table-cell">{r.female_count}</td>
                    <td className="py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { BarChart3, Users, UserCheck, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useAttendanceHistory,
  useTodayAttendanceCount,
  useTotalMembers,
} from "@/hooks/use-attendance";
import { useTodayNewcomerCount, useNewcomerHistory } from "@/hooks/use-newcomers";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";

export default function Reports() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();

  const services = useServices();
  const locations = useAllLocations();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  const effectiveScopedLocations =
    userRole?.role === "super_admin" ? null : scopedLocations ?? [];

  const visibleLocations = useMemo(() => {
    if (!locations.data) return [];
    if (effectiveScopedLocations === null) return locations.data;
    if (!effectiveScopedLocations || effectiveScopedLocations.length === 0) return [];
    return locations.data.filter((loc) => effectiveScopedLocations.includes(loc.id));
  }, [locations.data, effectiveScopedLocations]);

  const safeLocationFilter =
    locationFilter && locationFilter !== "all" ? locationFilter : undefined;

  const finalLocationFilter =
    effectiveScopedLocations === null
      ? safeLocationFilter
      : safeLocationFilter && effectiveScopedLocations?.includes(safeLocationFilter)
      ? safeLocationFilter
      : undefined;

  const totalMembers = useTotalMembers(
    effectiveScopedLocations === null
      ? null
      : finalLocationFilter
      ? [finalLocationFilter]
      : effectiveScopedLocations
  );

  const todayMembers = useTodayAttendanceCount(
    serviceFilter || undefined,
    effectiveScopedLocations === null
      ? null
      : finalLocationFilter
      ? [finalLocationFilter]
      : effectiveScopedLocations
  );

  const todayNewcomers = useTodayNewcomerCount(
    serviceFilter || undefined,
    effectiveScopedLocations === null
      ? null
      : finalLocationFilter
      ? [finalLocationFilter]
      : effectiveScopedLocations
  );

  const attendance = useAttendanceHistory({
    date: dateFilter,
    serviceId: serviceFilter || undefined,
    locationId: finalLocationFilter,
  });

  const newcomerHistory = useNewcomerHistory({
    date: dateFilter,
    serviceId: serviceFilter || undefined,
    locationId: finalLocationFilter,
  });

  const memberCount = totalMembers.data ?? 0;
  const membersPresent = todayMembers.data ?? 0;
  const newcomersCount = todayNewcomers.data ?? 0;
  const totalAttendance = membersPresent + newcomersCount;

  const newcomerBreakdown = useMemo(() => {
    if (!newcomerHistory.data) {
      return {
        adultMale: 0,
        adultFemale: 0,
        youthBoy: 0,
        youthGirl: 0,
        childrenBoy: 0,
        childrenGirl: 0,
      };
    }

    return newcomerHistory.data.reduce(
      (acc: any, r: any) => ({
        adultMale: acc.adultMale + (r.adult_male_count || 0),
        adultFemale: acc.adultFemale + (r.adult_female_count || 0),
        youthBoy: acc.youthBoy + (r.youth_boy_count || 0),
        youthGirl: acc.youthGirl + (r.youth_girl_count || 0),
        childrenBoy: acc.childrenBoy + (r.children_boy_count || 0),
        childrenGirl: acc.childrenGirl + (r.children_girl_count || 0),
      }),
      {
        adultMale: 0,
        adultFemale: 0,
        youthBoy: 0,
        youthGirl: 0,
        childrenBoy: 0,
        childrenGirl: 0,
      }
    );
  }, [newcomerHistory.data]);

  if (roleLoading || scopeLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Reports</h1>
        <p className="admin-page-description">Loading reports...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Access Error</h1>
        <p className="admin-page-description">
          No role is assigned to this account. Please contact the system administrator.
        </p>
      </div>
    );
  }

  if (hasRoleError) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Access Error</h1>
        <p className="admin-page-description">
          {(userRole as any)?._scopeError ||
            "Invalid role configuration detected. Please contact the system administrator."}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Reports</h1>
        <p className="admin-page-description">
          Attendance and newcomer reports with combined summaries
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-[200px] h-11"
        />

        <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[240px] h-11">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {s.day_of_week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[240px] h-11">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {visibleLocations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Members Present</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-heading font-bold">{membersPresent.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            of {memberCount.toLocaleString()} total members
          </p>
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

      {newcomersCount > 0 && (
        <div className="stat-card">
          <h2 className="text-lg font-heading font-semibold mb-3">Newcomer Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.adultMale}</p>
              <p className="text-xs text-muted-foreground">Adult Male</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.adultFemale}</p>
              <p className="text-xs text-muted-foreground">Adult Female</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.youthBoy}</p>
              <p className="text-xs text-muted-foreground">Youth Boy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.youthGirl}</p>
              <p className="text-xs text-muted-foreground">Youth Girl</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.childrenBoy}</p>
              <p className="text-xs text-muted-foreground">Children Boy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{newcomerBreakdown.childrenGirl}</p>
              <p className="text-xs text-muted-foreground">Children Girl</p>
            </div>
          </div>
        </div>
      )}

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
                      {new Date(r.check_in_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === "present"
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
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
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Adult M</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Adult F</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {newcomerHistory.data.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{r.locations?.name || "—"}</td>
                    <td className="py-2 text-muted-foreground hidden sm:table-cell">{r.services?.name || "—"}</td>
                    <td className="py-2 font-semibold">{r.total_count}</td>
                    <td className="py-2 text-muted-foreground hidden md:table-cell">{r.adult_male_count || 0}</td>
                    <td className="py-2 text-muted-foreground hidden md:table-cell">{r.adult_female_count || 0}</td>
                    <td className="py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {r.notes || "—"}
                    </td>
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
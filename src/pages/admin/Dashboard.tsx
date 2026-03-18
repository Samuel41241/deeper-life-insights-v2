import { LayoutDashboard, Users, TrendingUp, TrendingDown, AlertTriangle, Clock, Heart, Eye, BellRing, UserCheck } from "lucide-react";
import { useTotalMembers, useTodayAttendanceCount, useRecentScans } from "@/hooks/use-attendance";
import { useTodayNewcomerCount } from "@/hooks/use-newcomers";
import { useServices } from "@/hooks/use-services";
import { useEngagementData } from "@/hooks/use-engagement";
import { useScopedLocationIds, useUserRole, roleLabels } from "@/hooks/use-user-role";
import { Link } from "react-router-dom";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: scopedLocations } = useScopedLocationIds();
  const { data: userRole } = useUserRole();

  const totalMembers = useTotalMembers(scopedLocations);
  const todayCount = useTodayAttendanceCount(undefined, scopedLocations);
  const todayNewcomers = useTodayNewcomerCount(undefined, scopedLocations);
  const recentScans = useRecentScans(8, scopedLocations);
  const services = useServices();
  const engagement = useEngagementData(scopedLocations);

  const memberCount = totalMembers.data ?? 0;
  const presentToday = todayCount.data ?? 0;
  const newcomersToday = todayNewcomers.data ?? 0;
  const totalAttendance = presentToday + newcomersToday;
  const attendanceRate = memberCount > 0 ? ((presentToday / memberCount) * 100).toFixed(1) : "0";

  const engCounts = useMemo(() => {
    if (!engagement.data) return { followUp: 0, pastoral: 0, declining: 0, watchlist: 0 };
    return {
      followUp: engagement.data.filter((m) => m.risk_level === "follow_up").length,
      pastoral: engagement.data.filter((m) => m.risk_level === "pastoral_attention").length,
      declining: engagement.data.filter((m) => m.trend === "declining").length,
      watchlist: engagement.data.filter((m) => m.risk_level === "watchlist").length,
    };
  }, [engagement.data]);

  const stats = [
    { label: "Total Members", value: memberCount.toLocaleString(), icon: Users, change: "Active members" },
    { label: "Members Present", value: presentToday.toLocaleString(), icon: LayoutDashboard, change: `${attendanceRate}% of members` },
    { label: "Newcomers Today", value: newcomersToday.toLocaleString(), icon: UserCheck, change: "First-timers" },
    { label: "Total Attendance", value: totalAttendance.toLocaleString(), icon: TrendingUp, change: `${presentToday} members + ${newcomersToday} newcomers` },
  ];

  const scopeLabel = userRole ? (userRole.role === "super_admin" ? "All Locations" : roleLabels[userRole.role] || userRole.role) : "";

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-description">
          Overview of church attendance and engagement metrics
          {scopeLabel && <span className="ml-2 text-xs text-primary font-medium">({scopeLabel})</span>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-heading font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Engagement Intelligence Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-muted-foreground" /> Engagement Alerts
          </h2>
          <Link to="/admin/engagement" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/engagement" className="stat-card border-l-4 border-l-amber-500 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Watchlist</span>
            </div>
            <p className="text-2xl font-heading font-bold">{engagement.isLoading ? "—" : engCounts.watchlist}</p>
            <p className="text-xs text-muted-foreground mt-1">Members showing early signs</p>
          </Link>
          <Link to="/admin/engagement" className="stat-card border-l-4 border-l-orange-500 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Follow-Up Required</span>
            </div>
            <p className="text-2xl font-heading font-bold">{engagement.isLoading ? "—" : engCounts.followUp}</p>
            <p className="text-xs text-muted-foreground mt-1">Need leadership outreach</p>
          </Link>
          <Link to="/admin/engagement" className="stat-card border-l-4 border-l-red-500 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Pastoral Attention</span>
            </div>
            <p className="text-2xl font-heading font-bold">{engagement.isLoading ? "—" : engCounts.pastoral}</p>
            <p className="text-xs text-muted-foreground mt-1">Urgent intervention needed</p>
          </Link>
          <Link to="/admin/engagement" className="stat-card border-l-4 border-l-destructive hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Declining Participation</span>
            </div>
            <p className="text-2xl font-heading font-bold">{engagement.isLoading ? "—" : engCounts.declining}</p>
            <p className="text-xs text-muted-foreground mt-1">Attendance trend going down</p>
          </Link>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-heading font-semibold">Recent Check-ins Today</h2>
        </div>
        {(!recentScans.data || recentScans.data.length === 0) ? (
          <div className="py-8 text-center text-muted-foreground">
            <LayoutDashboard className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No check-ins recorded today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentScans.data.map((scan: any) => (
              <div key={scan.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">
                      {scan.members?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{scan.members?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{scan.services?.name}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(scan.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

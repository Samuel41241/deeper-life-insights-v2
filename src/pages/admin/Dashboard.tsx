import { LayoutDashboard, Users, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { useTotalMembers, useTodayAttendanceCount, useRecentScans } from "@/hooks/use-attendance";
import { useServices } from "@/hooks/use-services";

export default function Dashboard() {
  const totalMembers = useTotalMembers();
  const todayCount = useTodayAttendanceCount();
  const recentScans = useRecentScans(8);
  const services = useServices();

  const memberCount = totalMembers.data ?? 0;
  const presentToday = todayCount.data ?? 0;
  const attendanceRate = memberCount > 0 ? ((presentToday / memberCount) * 100).toFixed(1) : "0";

  const stats = [
    { label: "Total Members", value: memberCount.toLocaleString(), icon: Users, change: "Active members" },
    { label: "Present Today", value: presentToday.toLocaleString(), icon: LayoutDashboard, change: `${attendanceRate}% of members` },
    { label: "Services", value: (services.data?.length ?? 0).toString(), icon: TrendingUp, change: "Configured services" },
    { label: "Absent Today", value: Math.max(0, memberCount - presentToday).toLocaleString(), icon: AlertTriangle, change: "Not yet checked in" },
  ];

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-description">Overview of church attendance and engagement metrics</p>
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

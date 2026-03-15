import { LayoutDashboard, Users, TrendingUp, AlertTriangle, Calendar } from "lucide-react";

const stats = [
  { label: "Total Members", value: "2,847", icon: Users, change: "+12 this month" },
  { label: "Avg. Attendance", value: "1,923", icon: LayoutDashboard, change: "67.5% of members" },
  { label: "Growth Rate", value: "+4.2%", icon: TrendingUp, change: "vs last quarter" },
  { label: "At-Risk Members", value: "38", icon: AlertTriangle, change: "absent 3+ weeks" },
];

export default function Dashboard() {
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="stat-card min-h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Attendance trend chart will appear here</p>
          </div>
        </div>
        <div className="stat-card min-h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Service comparison analytics will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

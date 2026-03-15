import {
  LayoutDashboard, Users, UserPlus, QrCode, ScanLine, History,
  BarChart3, BellRing, Settings, Network, ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Church Hierarchy", url: "/admin/hierarchy", icon: Network },
      { title: "Members", url: "/admin/members", icon: Users },
      { title: "Register Member", url: "/admin/members/register", icon: UserPlus },
    ],
  },
  {
    label: "Attendance",
    items: [
      { title: "QR Card Management", url: "/admin/qr-cards", icon: QrCode },
      { title: "Attendance Scanner", url: "/admin/scanner", icon: ScanLine },
      { title: "Attendance History", url: "/admin/attendance", icon: History },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
      { title: "Engagement & Alerts", url: "/admin/engagement", icon: BellRing },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Logo size={collapsed ? "sm" : "md"} showText={!collapsed} className="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider">{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin/dashboard"}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            Powered By: Xuzentra Technologies Limited
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

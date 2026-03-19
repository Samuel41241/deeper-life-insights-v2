import {
  LayoutDashboard, Users, UserPlus, QrCode, ScanLine, History,
  BarChart3, BellRing, Settings, Network, ShieldCheck, UserCheck, MessageSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { roleNavAccess } from "@/hooks/use-user-role";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, key: "dashboard" },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Church Hierarchy", url: "/admin/hierarchy", icon: Network, key: "hierarchy" },
      { title: "Members", url: "/admin/members", icon: Users, key: "members" },
      { title: "Register Member", url: "/admin/members/register", icon: UserPlus, key: "register" },
    ],
  },
  {
    label: "Attendance",
    items: [
      { title: "QR Card Management", url: "/admin/qr-cards", icon: QrCode, key: "qr-cards" },
      { title: "Attendance Scanner", url: "/admin/scanner", icon: ScanLine, key: "scanner" },
      { title: "Newcomer Entry", url: "/admin/newcomers", icon: UserCheck, key: "newcomers" },
      { title: "Attendance History", url: "/admin/attendance", icon: History, key: "attendance" },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/admin/reports", icon: BarChart3, key: "reports" },
      { title: "Engagement & Alerts", url: "/admin/engagement", icon: BellRing, key: "engagement" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messaging", url: "/admin/messaging", icon: MessageSquare, key: "messaging" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "User Management", url: "/admin/users", icon: ShieldCheck, key: "users" },
      { title: "Settings", url: "/admin/settings", icon: Settings, key: "settings" },
    ],
  },
];

interface AdminSidebarProps {
  userRole: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const allowedKeys = roleNavAccess[userRole] || [];

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedKeys.includes(item.key)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Logo size={collapsed ? "sm" : "md"} showText={!collapsed} className="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        {filteredSections.map((section) => (
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

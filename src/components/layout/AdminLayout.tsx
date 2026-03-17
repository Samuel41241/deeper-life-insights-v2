import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { PoweredByFooter } from "@/components/brand/PoweredByFooter";
import { Logo } from "@/components/brand/Logo";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole, roleLabels } from "@/hooks/use-user-role";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { Badge } from "@/components/ui/badge";

export function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Still loading role
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // No role assigned — unauthorized
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Your account does not have an assigned role. Please contact a system administrator.
          </p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Account disabled
  if (!userRole.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">Account Disabled</h1>
          <p className="text-muted-foreground mb-6">
            Your account has been deactivated. Please contact your administrator.
          </p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Must change password
  if (userRole.must_change_password) {
    return <ForcePasswordChange />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar userRole={userRole.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Logo size="sm" className="hidden sm:flex" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                {roleLabels[userRole.role] || userRole.role}
              </Badge>
              {user && (
                <span className="text-xs text-muted-foreground hidden sm:inline mr-2 truncate max-w-[200px]">
                  {user.email}
                </span>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <PoweredByFooter className="border-t shrink-0" />
        </div>
      </div>
    </SidebarProvider>
  );
}

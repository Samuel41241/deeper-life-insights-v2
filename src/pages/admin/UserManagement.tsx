import { useState } from "react";
import { Users, Plus, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAllUserRoles, roleLabels, type UserRoleData } from "@/hooks/use-user-role";
import { useStates, useRegions, useGroupDistricts, useDistricts, useLocations } from "@/hooks/use-hierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const roleOptions = [
  "state_admin",
  "region_admin",
  "group_admin",
  "district_admin",
  "location_admin",
  "data_officer",
];

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-primary text-primary-foreground",
  state_admin: "bg-blue-600 text-white",
  region_admin: "bg-indigo-600 text-white",
  group_admin: "bg-violet-600 text-white",
  district_admin: "bg-purple-600 text-white",
  location_admin: "bg-amber-600 text-white",
  data_officer: "bg-emerald-600 text-white",
};

export default function UserManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRoleData | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [stateId, setStateId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [groupDistrictId, setGroupDistrictId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();
  const qc = useQueryClient();
  const users = useAllUserRoles();
  const states = useStates();
  const regions = useRegions(stateId || undefined);
  const groupDistricts = useGroupDistricts(regionId || undefined);
  const districts = useDistricts(groupDistrictId || undefined);
  const locations = useLocations(districtId || undefined);

  const needsState = ["state_admin", "region_admin", "group_admin", "district_admin", "location_admin", "data_officer"].includes(role);
  const needsRegion = ["region_admin", "group_admin", "district_admin", "location_admin", "data_officer"].includes(role);
  const needsGroup = ["group_admin", "district_admin", "location_admin", "data_officer"].includes(role);
  const needsDistrict = ["district_admin", "location_admin", "data_officer"].includes(role);
  const needsLocation = ["location_admin", "data_officer"].includes(role);

  const resetForm = () => {
    setEmail(""); setPassword(""); setRole("");
    setStateId(""); setRegionId(""); setGroupDistrictId(""); setDistrictId(""); setLocationId("");
  };

  const handleCreate = async () => {
    if (!email.trim() || !password || !role) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (needsState && !stateId) {
      toast({ title: "Please select a state", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: email.trim(),
          password,
          role,
          state_id: stateId || null,
          region_id: regionId || null,
          group_district_id: groupDistrictId || null,
          district_id: districtId || null,
          location_id: locationId || null,
        },
      });
      if (res.error) throw new Error(res.error.message || "Failed to create user");
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "User created successfully", description: `${email.trim()} has been added as ${roleLabels[role]}` });
      setCreateOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    } catch (err: any) {
      toast({ title: "Error creating user", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    try {
      const res = await supabase.functions.invoke("admin-reset-password", {
        body: {
          target_user_id: resetTarget.user_id,
          new_password: newPassword,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Password reset", description: `Password reset for ${resetTarget.email}` });
      setResetOpen(false);
      setResetTarget(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getScopeLabel = (u: UserRoleData) => {
    // We'll show the scope IDs; in future, resolve names
    if (u.role === "super_admin") return "Full access";
    const parts: string[] = [];
    if (u.state_id) parts.push("State assigned");
    if (u.region_id) parts.push("Region assigned");
    if (u.group_district_id) parts.push("Group assigned");
    if (u.district_id) parts.push("District assigned");
    if (u.location_id) parts.push("Location assigned");
    return parts.join(", ") || "No scope";
  };

  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-description">Create and manage system administrators</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {!users.data?.length && !users.isLoading && (
          <div className="stat-card flex items-center justify-center min-h-[200px]">
            <div className="text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No admin users configured yet</p>
              <p className="text-xs mt-1">Create the first administrator above</p>
            </div>
          </div>
        )}
        {users.data?.map((u) => (
          <div key={u.id} className="stat-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{u.email || u.user_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${roleBadgeColors[u.role] || "bg-muted text-muted-foreground"}`}>
                    {roleLabels[u.role] || u.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{getScopeLabel(u)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!u.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
              {u.role !== "super_admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setResetTarget(u); setResetOpen(true); }}
                >
                  <KeyRound className="mr-1 h-3 w-3" /> Reset Password
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="user@dlbc.org" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password *</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Min 6 characters" className="h-11" />
              <p className="text-xs text-muted-foreground">User will be required to change this on first login</p>
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={role} onValueChange={(v) => { setRole(v); setStateId(""); setRegionId(""); setGroupDistrictId(""); setDistrictId(""); setLocationId(""); }}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsState && (
              <div className="space-y-2">
                <Label>State *</Label>
                <Select value={stateId} onValueChange={(v) => { setStateId(v); setRegionId(""); setGroupDistrictId(""); setDistrictId(""); setLocationId(""); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {states.data?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsRegion && stateId && (
              <div className="space-y-2">
                <Label>Region {needsRegion && role === "region_admin" ? "*" : "(optional)"}</Label>
                <Select value={regionId} onValueChange={(v) => { setRegionId(v); setGroupDistrictId(""); setDistrictId(""); setLocationId(""); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions.data?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsGroup && regionId && (
              <div className="space-y-2">
                <Label>Group of Districts</Label>
                <Select value={groupDistrictId} onValueChange={(v) => { setGroupDistrictId(v); setDistrictId(""); setLocationId(""); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {groupDistricts.data?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsDistrict && groupDistrictId && (
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={districtId} onValueChange={(v) => { setDistrictId(v); setLocationId(""); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districts.data?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsLocation && districtId && (
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.data?.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !email.trim() || !password || !role}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={(open) => { setResetOpen(open); if (!open) { setResetTarget(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Reset password for <span className="font-medium text-foreground">{resetTarget?.email}</span>
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 6 characters" className="h-11" />
              <p className="text-xs text-muted-foreground">User will be required to change this on next login</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useCreateMember } from "@/hooks/use-members";
import {
  useStates,
  useRegions,
  useGroupDistricts,
  useDistricts,
  useLocations,
} from "@/hooks/use-hierarchy";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";

const categoryLabels: Record<string, string> = {
  adult_male: "Adult Male",
  adult_female: "Adult Female",
  youth_boy: "Youth Boy",
  youth_girl: "Youth Girl",
  children_boy: "Children Boy",
  children_girl: "Children Girl",
};

export default function RegisterMember() {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [locationId, setLocationId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateJoined, setDateJoined] = useState("");

  const [stateId, setStateId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [groupDistrictId, setGroupDistrictId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const createMember = useCreateMember();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocationIds, isLoading: scopeLoading } = useScopedLocationIds();

  const states = useStates();
  const regions = useRegions(stateId || undefined);
  const groupDistricts = useGroupDistricts(regionId || undefined);
  const districts = useDistricts(groupDistrictId || undefined);
  const locations = useLocations(districtId || undefined);

  const navigate = useNavigate();
  const { toast } = useToast();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  const isSuperAdmin = userRole?.role === "super_admin";
  const isStateAdmin = userRole?.role === "state_admin";
  const isRegionAdmin = userRole?.role === "region_admin";
  const isGroupAdmin = userRole?.role === "group_admin";
  const isDistrictAdmin = userRole?.role === "district_admin";
  const isLocationAdmin =
    userRole?.role === "location_admin" || userRole?.role === "data_officer";

  useEffect(() => {
    if (!userRole) return;

    if (userRole.state_id) setStateId(userRole.state_id);
    if (userRole.region_id) setRegionId(userRole.region_id);
    if (userRole.group_district_id) setGroupDistrictId(userRole.group_district_id);
    if (userRole.district_id) setDistrictId(userRole.district_id);
    if (userRole.location_id) setLocationId(userRole.location_id);
  }, [userRole]);

  const visibleStates = useMemo(() => {
    if (!states.data) return [];
    if (isSuperAdmin) return states.data;
    if (userRole?.state_id) {
      return states.data.filter((s: any) => s.id === userRole.state_id);
    }
    return [];
  }, [states.data, isSuperAdmin, userRole]);

  const visibleRegions = useMemo(() => {
    if (!regions.data) return [];
    if (isSuperAdmin || isStateAdmin) return regions.data;
    if (userRole?.region_id) {
      return regions.data.filter((r: any) => r.id === userRole.region_id);
    }
    return [];
  }, [regions.data, isSuperAdmin, isStateAdmin, userRole]);

  const visibleGroupDistricts = useMemo(() => {
    if (!groupDistricts.data) return [];
    if (isSuperAdmin || isStateAdmin || isRegionAdmin) return groupDistricts.data;
    if (userRole?.group_district_id) {
      return groupDistricts.data.filter((g: any) => g.id === userRole.group_district_id);
    }
    return [];
  }, [groupDistricts.data, isSuperAdmin, isStateAdmin, isRegionAdmin, userRole]);

  const visibleDistricts = useMemo(() => {
    if (!districts.data) return [];
    if (isSuperAdmin || isStateAdmin || isRegionAdmin || isGroupAdmin) return districts.data;
    if (userRole?.district_id) {
      return districts.data.filter((d: any) => d.id === userRole.district_id);
    }
    return [];
  }, [districts.data, isSuperAdmin, isStateAdmin, isRegionAdmin, isGroupAdmin, userRole]);

  const visibleLocations = useMemo(() => {
    if (!locations.data) return [];

    let result = locations.data as any[];

    if (scopedLocationIds !== null && scopedLocationIds !== undefined) {
      if (scopedLocationIds.length === 0) return [];
      result = result.filter((loc: any) => scopedLocationIds.includes(loc.id));
    }

    if (isLocationAdmin && userRole?.location_id) {
      result = result.filter((loc: any) => loc.id === userRole.location_id);
    }

    return result;
  }, [locations.data, scopedLocationIds, isLocationAdmin, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !gender || !category || !locationId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const member = await createMember.mutateAsync({
        full_name: fullName.trim(),
        gender,
        category: category as Enums<"member_category">,
        location_id: locationId,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        date_joined: dateJoined || undefined,
      });

      toast({ title: "Member registered successfully" });
      navigate(`/admin/members/${member.id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (roleLoading || scopeLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Register Member</h1>
        <p className="admin-page-description">Loading form...</p>
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
        <h1 className="admin-page-title">Register Member</h1>
        <p className="admin-page-description">Add a new member to the church</p>
      </div>

      <div className="stat-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.member_category.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isLocationAdmin && (
              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={stateId}
                  onValueChange={(v) => {
                    setStateId(v);
                    setRegionId("");
                    setGroupDistrictId("");
                    setDistrictId("");
                    setLocationId("");
                  }}
                  disabled={!isSuperAdmin}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleStates.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isLocationAdmin && !isDistrictAdmin && (
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select
                  value={regionId}
                  onValueChange={(v) => {
                    setRegionId(v);
                    setGroupDistrictId("");
                    setDistrictId("");
                    setLocationId("");
                  }}
                  disabled={isRegionAdmin}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleRegions.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isLocationAdmin && !isDistrictAdmin && !isGroupAdmin && (
              <div className="space-y-2">
                <Label>Group of Districts *</Label>
                <Select
                  value={groupDistrictId}
                  onValueChange={(v) => {
                    setGroupDistrictId(v);
                    setDistrictId("");
                    setLocationId("");
                  }}
                  disabled={isGroupAdmin}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleGroupDistricts.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isLocationAdmin && (
              <div className="space-y-2">
                <Label>District *</Label>
                <Select
                  value={districtId}
                  onValueChange={(v) => {
                    setDistrictId(v);
                    setLocationId("");
                  }}
                  disabled={isDistrictAdmin}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleDistricts.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label>Location *</Label>
              <Select
                value={locationId}
                onValueChange={setLocationId}
                disabled={isLocationAdmin}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {visibleLocations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {visibleLocations.length === 0 && (
                <p className="text-xs text-destructive">
                  No locations available in your assigned scope.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateJoined">Date Joined</Label>
              <Input
                id="dateJoined"
                type="date"
                value={dateJoined}
                onChange={(e) => setDateJoined(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                className="h-11"
              />
            </div>
          </div>

          <Button type="submit" className="h-11" disabled={createMember.isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            {createMember.isPending ? "Registering..." : "Register Member"}
          </Button>
        </form>
      </div>
    </div>
  );
}
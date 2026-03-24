import { useMemo, useState } from "react";
import { Network, Plus, Trash2, MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useStates,
  useCreateState,
  useDeleteState,
  useRegions,
  useCreateRegion,
  useDeleteRegion,
  useGroupDistricts,
  useCreateGroupDistrict,
  useDeleteGroupDistrict,
  useDistricts,
  useCreateDistrict,
  useDeleteDistrict,
  useLocations,
  useCreateLocation,
  useDeleteLocation,
} from "@/hooks/use-hierarchy";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Level = "states" | "regions" | "group_districts" | "districts" | "locations";

const levelLabels: Record<Level, string> = {
  states: "States",
  regions: "Regions",
  group_districts: "Group of Districts",
  districts: "Districts",
  locations: "Locations",
};

const allowedLevelsByRole: Record<string, Level[]> = {
  super_admin: ["states", "regions", "group_districts", "districts", "locations"],
  state_admin: ["states", "regions", "group_districts", "districts", "locations"],
  region_admin: ["regions", "group_districts", "districts", "locations"],
  group_admin: ["group_districts", "districts", "locations"],
  district_admin: ["districts", "locations"],
  location_admin: ["locations"],
  data_officer: ["locations"],
};

export default function ChurchHierarchy() {
  const [activeLevel, setActiveLevel] = useState<Level>("states");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const { toast } = useToast();

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  // Queries
  const states = useStates();
  const regions = useRegions();
  const groupDistricts = useGroupDistricts();
  const districts = useDistricts();
  const locations = useLocations();

  // Mutations
  const createState = useCreateState();
  const deleteState = useDeleteState();
  const createRegion = useCreateRegion();
  const deleteRegion = useDeleteRegion();
  const createGroupDistrict = useCreateGroupDistrict();
  const deleteGroupDistrict = useDeleteGroupDistrict();
  const createDistrict = useCreateDistrict();
  const deleteDistrict = useDeleteDistrict();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();

  const allowedLevels = useMemo(() => {
    if (!userRole?.role) return ["states"] as Level[];
    return allowedLevelsByRole[userRole.role] || ["locations"];
  }, [userRole?.role]);

  const effectiveScopedLocations =
    userRole?.role === "super_admin" ? null : scopedLocations ?? [];

  const visibleLocations = useMemo(() => {
    if (!locations.data) return [];
    if (effectiveScopedLocations === null) return locations.data;
    if (!effectiveScopedLocations || effectiveScopedLocations.length === 0) return [];
    return locations.data.filter((loc: any) => effectiveScopedLocations.includes(loc.id));
  }, [locations.data, effectiveScopedLocations]);

  const visibleDistricts = useMemo(() => {
    if (!districts.data) return [];
    if (userRole?.role === "super_admin") return districts.data;
    if (userRole?.role === "district_admin" && userRole.district_id) {
      return districts.data.filter((d: any) => d.id === userRole.district_id);
    }
    const districtIds = Array.from(new Set(visibleLocations.map((l: any) => l.district_id).filter(Boolean)));
    return districts.data.filter((d: any) => districtIds.includes(d.id));
  }, [districts.data, visibleLocations, userRole]);

  const visibleGroupDistricts = useMemo(() => {
    if (!groupDistricts.data) return [];
    if (userRole?.role === "super_admin") return groupDistricts.data;
    if (userRole?.role === "group_admin" && userRole.group_district_id) {
      return groupDistricts.data.filter((g: any) => g.id === userRole.group_district_id);
    }
    const gdIds = Array.from(new Set(visibleDistricts.map((d: any) => d.group_district_id).filter(Boolean)));
    return groupDistricts.data.filter((g: any) => gdIds.includes(g.id));
  }, [groupDistricts.data, visibleDistricts, userRole]);

  const visibleRegions = useMemo(() => {
    if (!regions.data) return [];
    if (userRole?.role === "super_admin") return regions.data;
    if (userRole?.role === "region_admin" && userRole.region_id) {
      return regions.data.filter((r: any) => r.id === userRole.region_id);
    }
    if (userRole?.role === "state_admin" && userRole.state_id) {
      return regions.data.filter((r: any) => r.state_id === userRole.state_id);
    }
    const regionIds = Array.from(new Set(visibleGroupDistricts.map((g: any) => g.region_id).filter(Boolean)));
    return regions.data.filter((r: any) => regionIds.includes(r.id));
  }, [regions.data, visibleGroupDistricts, userRole]);

  const visibleStates = useMemo(() => {
    if (!states.data) return [];
    if (userRole?.role === "super_admin") return states.data;
    if (userRole?.role === "state_admin" && userRole.state_id) {
      return states.data.filter((s: any) => s.id === userRole.state_id);
    }
    const stateIds = Array.from(new Set(visibleRegions.map((r: any) => r.state_id).filter(Boolean)));
    return states.data.filter((s: any) => stateIds.includes(s.id));
  }, [states.data, visibleRegions, userRole]);

  const safeActiveLevel = allowedLevels.includes(activeLevel)
    ? activeLevel
    : allowedLevels[0];

  const getParentOptions = () => {
    switch (safeActiveLevel) {
      case "regions":
        return visibleStates;
      case "group_districts":
        return visibleRegions;
      case "districts":
        return visibleGroupDistricts;
      case "locations":
        return visibleDistricts;
      default:
        return [];
    }
  };

  const getParentLabel = () => {
    switch (safeActiveLevel) {
      case "regions":
        return "State";
      case "group_districts":
        return "Region";
      case "districts":
        return "Group of Districts";
      case "locations":
        return "District";
      default:
        return "";
    }
  };

  const getData = () => {
    switch (safeActiveLevel) {
      case "states":
        return visibleStates;
      case "regions":
        return visibleRegions;
      case "group_districts":
        return visibleGroupDistricts;
      case "districts":
        return visibleDistricts;
      case "locations":
        return visibleLocations;
      default:
        return [];
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      switch (safeActiveLevel) {
        case "states":
          await createState.mutateAsync({
            name: newName.trim(),
            code: newCode.trim() || undefined,
          });
          break;

        case "regions":
          if (!selectedParent) return;
          await createRegion.mutateAsync({
            name: newName.trim(),
            state_id: selectedParent,
          });
          break;

        case "group_districts":
          if (!selectedParent) return;
          await createGroupDistrict.mutateAsync({
            name: newName.trim(),
            region_id: selectedParent,
          });
          break;

        case "districts":
          if (!selectedParent) return;
          await createDistrict.mutateAsync({
            name: newName.trim(),
            group_district_id: selectedParent,
          });
          break;

        case "locations":
          if (!selectedParent) return;
          await createLocation.mutateAsync({
            name: newName.trim(),
            district_id: selectedParent,
            address: newAddress.trim() || undefined,
          });
          break;
      }

      toast({ title: "Created successfully" });
      setDialogOpen(false);
      setNewName("");
      setNewCode("");
      setNewAddress("");
      setSelectedParent("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      switch (safeActiveLevel) {
        case "states":
          await deleteState.mutateAsync(id);
          break;
        case "regions":
          await deleteRegion.mutateAsync(id);
          break;
        case "group_districts":
          await deleteGroupDistrict.mutateAsync(id);
          break;
        case "districts":
          await deleteDistrict.mutateAsync(id);
          break;
        case "locations":
          await deleteLocation.mutateAsync(id);
          break;
      }
      toast({ title: "Deleted successfully" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const getSubtitle = (item: any) => {
    switch (safeActiveLevel) {
      case "regions":
        return item.states?.name || "";
      case "group_districts":
        return item.regions?.name || "";
      case "districts":
        return item.group_districts?.name || "";
      case "locations":
        return item.districts?.name || "";
      default:
        return item.code || "";
    }
  };

  const data = getData();
  const isLoading =
    roleLoading ||
    scopeLoading ||
    states.isLoading ||
    regions.isLoading ||
    groupDistricts.isLoading ||
    districts.isLoading ||
    locations.isLoading;

  if (isLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Church Hierarchy</h1>
        <p className="admin-page-description">Loading hierarchy...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Church Hierarchy</h1>
          <p className="admin-page-description">
            Scoped hierarchy view based on your administrative level
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add {levelLabels[safeActiveLevel].slice(0, -1)}
        </Button>
      </div>

      {/* Level Tabs */}
      <div className="flex flex-wrap gap-2">
        {allowedLevels.map((level) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              safeActiveLevel === level
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {levelLabels[level]}
          </button>
        ))}
      </div>

      {/* Data List */}
      <div className="space-y-2">
        {data.length === 0 && !isLoading && (
          <div className="stat-card flex items-center justify-center min-h-[200px]">
            <div className="text-center text-muted-foreground">
              <Network className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No {levelLabels[safeActiveLevel].toLowerCase()} created yet</p>
              <p className="text-xs mt-1">Click the button above to add one</p>
            </div>
          </div>
        )}

        {data.map((item: any) => (
          <div
            key={item.id}
            className="stat-card flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                {safeActiveLevel === "locations" ? (
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Building className="h-4 w-4 text-primary-foreground" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                {getSubtitle(item) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {getSubtitle(item)}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {levelLabels[safeActiveLevel].slice(0, -1)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {safeActiveLevel !== "states" && (
              <div className="space-y-2">
                <Label>{getParentLabel()}</Label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={`Select ${getParentLabel().toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentOptions().map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name"
                className="h-11"
              />
            </div>

            {safeActiveLevel === "states" && (
              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. LAG"
                  className="h-11"
                />
              </div>
            )}

            {safeActiveLevel === "locations" && (
              <div className="space-y-2">
                <Label>Address (optional)</Label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter address"
                  className="h-11"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || (safeActiveLevel !== "states" && !selectedParent)}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
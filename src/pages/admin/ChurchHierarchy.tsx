import { useState } from "react";
import { Network, Plus, Trash2, ChevronRight, MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useStates, useCreateState, useDeleteState,
  useRegions, useCreateRegion, useDeleteRegion,
  useGroupDistricts, useCreateGroupDistrict, useDeleteGroupDistrict,
  useDistricts, useCreateDistrict, useDeleteDistrict,
  useLocations, useCreateLocation, useDeleteLocation,
} from "@/hooks/use-hierarchy";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Level = "states" | "regions" | "group_districts" | "districts" | "locations";

const levelLabels: Record<Level, string> = {
  states: "States",
  regions: "Regions",
  group_districts: "Group of Districts",
  districts: "Districts",
  locations: "Locations",
};

export default function ChurchHierarchy() {
  const [activeLevel, setActiveLevel] = useState<Level>("states");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const { toast } = useToast();

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

  const getParentOptions = () => {
    switch (activeLevel) {
      case "regions": return states.data || [];
      case "group_districts": return regions.data || [];
      case "districts": return groupDistricts.data || [];
      case "locations": return districts.data || [];
      default: return [];
    }
  };

  const getParentLabel = () => {
    switch (activeLevel) {
      case "regions": return "State";
      case "group_districts": return "Region";
      case "districts": return "Group of Districts";
      case "locations": return "District";
      default: return "";
    }
  };

  const getData = () => {
    switch (activeLevel) {
      case "states": return states.data || [];
      case "regions": return regions.data || [];
      case "group_districts": return groupDistricts.data || [];
      case "districts": return districts.data || [];
      case "locations": return locations.data || [];
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      switch (activeLevel) {
        case "states":
          await createState.mutateAsync({ name: newName.trim(), code: newCode.trim() || undefined });
          break;
        case "regions":
          if (!selectedParent) return;
          await createRegion.mutateAsync({ name: newName.trim(), state_id: selectedParent });
          break;
        case "group_districts":
          if (!selectedParent) return;
          await createGroupDistrict.mutateAsync({ name: newName.trim(), region_id: selectedParent });
          break;
        case "districts":
          if (!selectedParent) return;
          await createDistrict.mutateAsync({ name: newName.trim(), group_district_id: selectedParent });
          break;
        case "locations":
          if (!selectedParent) return;
          await createLocation.mutateAsync({ name: newName.trim(), district_id: selectedParent, address: newAddress.trim() || undefined });
          break;
      }
      toast({ title: "Created successfully" });
      setDialogOpen(false);
      setNewName("");
      setNewCode("");
      setNewAddress("");
      setSelectedParent("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      switch (activeLevel) {
        case "states": await deleteState.mutateAsync(id); break;
        case "regions": await deleteRegion.mutateAsync(id); break;
        case "group_districts": await deleteGroupDistrict.mutateAsync(id); break;
        case "districts": await deleteDistrict.mutateAsync(id); break;
        case "locations": await deleteLocation.mutateAsync(id); break;
      }
      toast({ title: "Deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getSubtitle = (item: any) => {
    switch (activeLevel) {
      case "regions": return item.states?.name || "";
      case "group_districts": return item.regions?.name || "";
      case "districts": return item.group_districts?.name || "";
      case "locations": return item.districts?.name || "";
      default: return item.code || "";
    }
  };

  const data = getData();
  const isLoading = states.isLoading || regions.isLoading;

  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Church Hierarchy</h1>
          <p className="admin-page-description">State → Region → Group of Districts → District → Location</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add {levelLabels[activeLevel].slice(0, -1)}
        </Button>
      </div>

      {/* Level Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(levelLabels) as Level[]).map((level) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLevel === level
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
              <p>No {levelLabels[activeLevel].toLowerCase()} created yet</p>
              <p className="text-xs mt-1">Click the button above to add one</p>
            </div>
          </div>
        )}
        {data.map((item: any) => (
          <div key={item.id} className="stat-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                {activeLevel === "locations" ? (
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Building className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                {getSubtitle(item) && (
                  <p className="text-xs text-muted-foreground truncate">{getSubtitle(item)}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {levelLabels[activeLevel].slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {activeLevel !== "states" && (
              <div className="space-y-2">
                <Label>{getParentLabel()}</Label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={`Select ${getParentLabel().toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentOptions().map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter name" className="h-11" />
            </div>
            {activeLevel === "states" && (
              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. LAG" className="h-11" />
              </div>
            )}
            {activeLevel === "locations" && (
              <div className="space-y-2">
                <Label>Address (optional)</Label>
                <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Enter address" className="h-11" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || (activeLevel !== "states" && !selectedParent)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

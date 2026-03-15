import { useState } from "react";
import { Settings as SettingsIcon, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServices, useCreateService, useDeleteService } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dayLabels: Record<string, string> = {
  sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday",
};

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [locationId, setLocationId] = useState("");

  const services = useServices();
  const locations = useAllLocations();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim() || !serviceType.trim() || !dayOfWeek) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    try {
      await createService.mutateAsync({
        name: name.trim(),
        service_type: serviceType.trim(),
        day_of_week: dayOfWeek,
        start_time: startTime || undefined,
        location_id: locationId || null,
      });
      toast({ title: "Service created" });
      setDialogOpen(false);
      setName(""); setServiceType(""); setDayOfWeek(""); setStartTime(""); setLocationId("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast({ title: "Service deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-description">System configuration and service management</p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Church Services</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg">Church Services</h2>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </div>

          {services.data?.length === 0 && (
            <div className="stat-card py-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No services configured</p>
              <p className="text-xs mt-1">Add church services like Sunday Worship, Bible Study, etc.</p>
            </div>
          )}

          <div className="space-y-2">
            {services.data?.map((s) => (
              <div key={s.id} className="stat-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayLabels[s.day_of_week] || s.day_of_week}
                      {s.start_time && ` · ${s.start_time}`}
                      {(s as any).locations?.name && ` · ${(s as any).locations.name}`}
                      {!((s as any).locations?.name) && " · All locations"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <div className="stat-card min-h-[200px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <SettingsIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>System settings, role management, and preferences</p>
              <p className="text-xs mt-1">Coming in next phase</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Church Service</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunday Worship" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="e.g. Worship, Bible Study, Revival" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time (optional)</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Location (optional — leave empty for all locations)</Label>
              <Select value={locationId} onValueChange={(v) => setLocationId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="All locations" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All locations</SelectItem>
                  {locations.data?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || !serviceType.trim() || !dayOfWeek}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

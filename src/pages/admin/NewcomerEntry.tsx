import { useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useRecordNewcomers } from "@/hooks/use-newcomers";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function NewcomerEntry() {
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [youthCount, setYouthCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const services = useServices();
  const locations = useAllLocations();
  const recordNewcomers = useRecordNewcomers();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalCount = maleCount + femaleCount + youthCount + childrenCount;

  const resetForm = () => {
    setMaleCount(0);
    setFemaleCount(0);
    setYouthCount(0);
    setChildrenCount(0);
    setNotes("");
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!locationId) {
      toast({ title: "Please select a location", variant: "destructive" });
      return;
    }
    if (totalCount <= 0) {
      toast({ title: "Please enter at least one newcomer", variant: "destructive" });
      return;
    }
    if (!user?.id) {
      toast({ title: "You must be logged in", variant: "destructive" });
      return;
    }

    try {
      await recordNewcomers.mutateAsync({
        location_id: locationId,
        service_id: serviceId || undefined,
        total_count: totalCount,
        male_count: maleCount,
        female_count: femaleCount,
        youth_count: youthCount,
        children_count: childrenCount,
        notes: notes || undefined,
        created_by: user.id,
      });
      toast({ title: "Newcomers recorded", description: `${totalCount} newcomer(s) added successfully` });
      setSubmitted(true);
      setTimeout(resetForm, 2000);
    } catch (err: any) {
      console.error("Newcomer entry error:", err);
      toast({ title: "Error recording newcomers", description: err.message, variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="admin-page">
        <div className="stat-card min-h-[400px] flex flex-col items-center justify-center">
          <CheckCircle2 className="h-20 w-20 text-primary mb-4" />
          <p className="text-2xl font-heading font-bold">Newcomers Recorded!</p>
          <p className="text-muted-foreground mt-2">{totalCount} newcomer(s) added for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Newcomer Entry</h1>
        <p className="admin-page-description">Record first-timers and newcomers attending today's service</p>
      </div>

      <div className="stat-card max-w-2xl">
        <div className="space-y-5">
          {/* Service & Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.day_of_week}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.data?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Counts */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Male</Label>
              <Input
                type="number"
                min={0}
                value={maleCount}
                onChange={(e) => setMaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>Female</Label>
              <Input
                type="number"
                min={0}
                value={femaleCount}
                onChange={(e) => setFemaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>Youth</Label>
              <Input
                type="number"
                min={0}
                value={youthCount}
                onChange={(e) => setYouthCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>Children</Label>
              <Input
                type="number"
                min={0}
                value={childrenCount}
                onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>
          </div>

          {/* Total */}
          <div className="stat-card bg-primary/5 border-primary/20 text-center py-4">
            <p className="text-sm text-muted-foreground">Total Newcomers</p>
            <p className="text-4xl font-heading font-bold text-primary">{totalCount}</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations about newcomers..."
              className="min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={recordNewcomers.isPending || totalCount <= 0 || !locationId}
            className="w-full h-12 text-base"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            {recordNewcomers.isPending ? "Submitting..." : `Record ${totalCount} Newcomer(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

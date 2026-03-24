import { useMemo, useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useRecordNewcomers } from "@/hooks/use-newcomers";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";

export default function NewcomerEntry() {
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [adultMaleCount, setAdultMaleCount] = useState(0);
  const [adultFemaleCount, setAdultFemaleCount] = useState(0);
  const [youthBoyCount, setYouthBoyCount] = useState(0);
  const [youthGirlCount, setYouthGirlCount] = useState(0);
  const [childrenBoyCount, setChildrenBoyCount] = useState(0);
  const [childrenGirlCount, setChildrenGirlCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const services = useServices();
  const locations = useAllLocations();
  const recordNewcomers = useRecordNewcomers();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  const effectiveScopedLocations =
    userRole?.role === "super_admin" ? null : scopedLocations ?? [];

  const visibleLocations = useMemo(() => {
    if (!locations.data) return [];
    if (effectiveScopedLocations === null) return locations.data;
    if (!effectiveScopedLocations || effectiveScopedLocations.length === 0) return [];
    return locations.data.filter((loc) => effectiveScopedLocations.includes(loc.id));
  }, [locations.data, effectiveScopedLocations]);

  const totalCount =
    adultMaleCount +
    adultFemaleCount +
    youthBoyCount +
    youthGirlCount +
    childrenBoyCount +
    childrenGirlCount;

  const resetForm = () => {
    setAdultMaleCount(0);
    setAdultFemaleCount(0);
    setYouthBoyCount(0);
    setYouthGirlCount(0);
    setChildrenBoyCount(0);
    setChildrenGirlCount(0);
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
        adult_male_count: adultMaleCount,
        adult_female_count: adultFemaleCount,
        youth_boy_count: youthBoyCount,
        youth_girl_count: youthGirlCount,
        children_boy_count: childrenBoyCount,
        children_girl_count: childrenGirlCount,
        notes: notes || undefined,
        created_by: user.id,
      });

      toast({
        title: "Newcomers recorded",
        description: `${totalCount} newcomer(s) added successfully`,
      });

      setSubmitted(true);
      setTimeout(resetForm, 2000);
    } catch (err: any) {
      console.error("Newcomer entry error:", err);
      toast({
        title: "Error recording newcomers",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (roleLoading || scopeLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Newcomer Entry</h1>
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

  if (submitted) {
    return (
      <div className="admin-page">
        <div className="stat-card min-h-[400px] flex flex-col items-center justify-center">
          <CheckCircle2 className="h-20 w-20 text-primary mb-4" />
          <p className="text-2xl font-heading font-bold">Newcomers Recorded!</p>
          <p className="text-muted-foreground mt-2">
            {totalCount} newcomer(s) added for today
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Newcomer Entry</h1>
        <p className="admin-page-description">
          Record first-timers and newcomers attending today's service
        </p>
      </div>

      <div className="stat-card max-w-3xl">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.day_of_week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {visibleLocations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Adult Male</Label>
              <Input
                type="number"
                min={0}
                value={adultMaleCount}
                onChange={(e) => setAdultMaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Adult Female</Label>
              <Input
                type="number"
                min={0}
                value={adultFemaleCount}
                onChange={(e) => setAdultFemaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Youth Boy</Label>
              <Input
                type="number"
                min={0}
                value={youthBoyCount}
                onChange={(e) => setYouthBoyCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Youth Girl</Label>
              <Input
                type="number"
                min={0}
                value={youthGirlCount}
                onChange={(e) => setYouthGirlCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Children Boy</Label>
              <Input
                type="number"
                min={0}
                value={childrenBoyCount}
                onChange={(e) => setChildrenBoyCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Children Girl</Label>
              <Input
                type="number"
                min={0}
                value={childrenGirlCount}
                onChange={(e) => setChildrenGirlCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-12 text-center text-lg font-semibold"
              />
            </div>
          </div>

          <div className="stat-card bg-primary/5 border-primary/20 text-center py-4">
            <p className="text-sm text-muted-foreground">Total Newcomers</p>
            <p className="text-4xl font-heading font-bold text-primary">{totalCount}</p>
          </div>

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
            {recordNewcomers.isPending
              ? "Submitting..."
              : `Record ${totalCount} Newcomer(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
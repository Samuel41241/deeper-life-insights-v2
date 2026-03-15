import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useCreateMember } from "@/hooks/use-members";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const createMember = useCreateMember();
  const locations = useAllLocations();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

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
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.member_category.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Location *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.data?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locations.data?.length === 0 && (
                <p className="text-xs text-destructive">No locations available. Create a location in Church Hierarchy first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 XXX XXX XXXX" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateJoined">Date Joined</Label>
              <Input id="dateJoined" type="date" value={dateJoined} onChange={(e) => setDateJoined(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" className="h-11" />
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

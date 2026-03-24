import { useState } from "react";
import { createAdminUser } from "@/hooks/use-create-admin";
import { useUserRole } from "@/hooks/use-user-role";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { ROLE_HIERARCHY, Role } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [locationId, setLocationId] = useState("");

  const { data: userRole } = useUserRole();
  const locations = useAllLocations();
  const { toast } = useToast();

  const allowedRoles = userRole
    ? ROLE_HIERARCHY[userRole.role as Role]
    : [];

  const handleCreate = async () => {
    try {
      await createAdminUser({
        email,
        password,
        role: role as Role,
        locationId,
        currentUser: {
          id: userRole.id,
          role: userRole.role,
        },
      });

      toast({ title: "Admin created successfully" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="admin-page">
      <h1>Create Admin</h1>

      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger>
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {allowedRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={locationId} onValueChange={setLocationId}>
        <SelectTrigger>
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.data?.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleCreate}>Create Admin</Button>
    </div>
  );
}
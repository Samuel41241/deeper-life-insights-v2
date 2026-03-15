import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterMember() {
  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Register Member</h1>
        <p className="admin-page-description">Add a new member to the system</p>
      </div>

      <div className="stat-card max-w-2xl">
        <form className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter first name" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter last name" className="h-11" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+234 XXX XXX XXXX" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter address" className="h-11" />
          </div>
          <Button type="button" className="h-11">
            <UserPlus className="mr-2 h-4 w-4" /> Register Member
          </Button>
        </form>
      </div>
    </div>
  );
}

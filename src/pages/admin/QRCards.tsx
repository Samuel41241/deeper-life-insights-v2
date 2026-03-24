import { useMemo, useState } from "react";
import { Search, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAllCards, useUpdateCardStatus } from "@/hooks/use-members";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Enums } from "@/integrations/supabase/types";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  lost: "bg-destructive/10 text-destructive",
  replaced: "bg-secondary/20 text-secondary-foreground",
  inactive: "bg-muted text-muted-foreground",
};

export default function QRCards() {
  const [search, setSearch] = useState("");

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  const effectiveScopedLocations =
    userRole?.role === "super_admin" ? null : scopedLocations ?? [];

  const cards = useAllCards(effectiveScopedLocations);
  const updateStatus = useUpdateCardStatus();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const allCards = cards.data || [];
    if (!search.trim()) return allCards;

    const s = search.toLowerCase();
    return allCards.filter((c) => {
      const name = (c as any).members?.full_name || "";
      const cardNumber = c.card_number || "";
      return (
        name.toLowerCase().includes(s) ||
        cardNumber.toLowerCase().includes(s)
      );
    });
  }, [cards.data, search]);

  const handleStatusChange = async (cardId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({
        id: cardId,
        status: status as Enums<"card_status">,
      });
      toast({ title: "Card status updated" });
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
        <h1 className="admin-page-title">QR Card Management</h1>
        <p className="admin-page-description">Loading cards...</p>
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
        <h1 className="admin-page-title">QR Card Management</h1>
        <p className="admin-page-description">View and manage member attendance cards</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or card number..."
          className="pl-9 h-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium text-muted-foreground">Card Number</th>
              <th className="pb-3 font-medium text-muted-foreground">Member</th>
              <th className="pb-3 font-medium text-muted-foreground">Location</th>
              <th className="pb-3 font-medium text-muted-foreground">Issued</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground w-[140px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 font-mono text-xs">{c.card_number}</td>
                <td className="py-3 font-medium">{(c as any).members?.full_name || "—"}</td>
                <td className="py-3 text-muted-foreground">
                  {(c as any).members?.locations?.name || "—"}
                </td>
                <td className="py-3 text-muted-foreground">{c.issued_date}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      statusColors[c.status] || ""
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3">
                  <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="replaced">Replaced</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No cards found</p>
            <p className="text-xs mt-1">Cards are generated from member detail pages</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="stat-card py-12 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No cards found</p>
          </div>
        )}

        {filtered.map((c) => (
          <div key={c.id} className="stat-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{(c as any).members?.full_name || "—"}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{c.card_number}</p>
                <p className="text-xs text-muted-foreground">
                  {(c as any).members?.locations?.name || "—"} · {c.issued_date}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                  statusColors[c.status] || ""
                }`}
              >
                {c.status}
              </span>
            </div>

            <div className="mt-3">
              <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="replaced">Replaced</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
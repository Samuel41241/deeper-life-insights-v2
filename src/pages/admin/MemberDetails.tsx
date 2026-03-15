import { useParams, Link } from "react-router-dom";
import { useMember, useMemberCards, useCreateCard } from "@/hooks/use-members";
import { User, QrCode, Calendar, MapPin, Phone, ArrowLeft, AlertTriangle, TrendingUp, BellRing, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = {
  adult_male: "Adult Male",
  adult_female: "Adult Female",
  youth_boy: "Youth Boy",
  youth_girl: "Youth Girl",
  children_boy: "Children Boy",
  children_girl: "Children Girl",
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const member = useMember(id!);
  const cards = useMemberCards(id!);
  const createCard = useCreateCard();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerateCard = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const cardNumber = `DLBC-${Date.now().toString(36).toUpperCase()}`;
      const qrValue = crypto.randomUUID();
      await createCard.mutateAsync({
        member_id: id,
        card_number: cardNumber,
        qr_code_value: qrValue,
      });
      toast({ title: "Card generated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const m = member.data;
  const loc = m?.locations as any;

  if (member.isLoading) {
    return (
      <div className="admin-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
          <div className="stat-card h-64" />
        </div>
      </div>
    );
  }

  if (!m) {
    return (
      <div className="admin-page">
        <p className="text-muted-foreground">Member not found</p>
        <Link to="/admin/members"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Members</Button></Link>
      </div>
    );
  }

  const locationPath = [
    loc?.districts?.group_districts?.regions?.states?.name,
    loc?.districts?.group_districts?.regions?.name,
    loc?.districts?.group_districts?.name,
    loc?.districts?.name,
    loc?.name,
  ].filter(Boolean).join(" → ");

  const activeCard = cards.data?.find((c) => c.status === "active");

  return (
    <div className="admin-page">
      <Link to="/admin/members" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Members
      </Link>

      {/* Profile Header */}
      <div className="stat-card flex flex-col sm:flex-row items-start gap-6">
        <div className="h-16 w-16 rounded-full brand-gradient flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xl font-bold">
            {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-heading font-bold">{m.full_name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{categoryLabels[m.category] || m.category}</Badge>
            <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge>
          </div>
          <div className="grid gap-2 mt-4 text-sm text-muted-foreground sm:grid-cols-2">
            {m.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{m.phone}</div>}
            {m.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{m.address}</div>}
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Joined: {m.date_joined}</div>
            {locationPath && <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4" />{locationPath}</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card Status */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold flex items-center gap-2"><QrCode className="h-5 w-5" /> QR Card</h3>
            <Button size="sm" onClick={handleGenerateCard} disabled={generating}>
              {generating ? "Generating..." : activeCard ? "Replace Card" : "Generate Card"}
            </Button>
          </div>
          {activeCard ? (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-mono text-sm">Card #: {activeCard.card_number}</p>
              <p className="text-xs text-muted-foreground mt-1">QR: {activeCard.qr_code_value.slice(0, 16)}...</p>
              <p className="text-xs text-muted-foreground mt-1">Issued: {activeCard.issued_date}</p>
              <Badge className="mt-2">{activeCard.status}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active card. Generate one to enable QR attendance.</p>
          )}
          {cards.data && cards.data.length > 1 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Card History ({cards.data.length} total)</p>
              {cards.data.filter(c => c.id !== activeCard?.id).map((c) => (
                <div key={c.id} className="text-xs text-muted-foreground flex justify-between py-1 border-t">
                  <span>{c.card_number}</span>
                  <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Health Placeholder */}
        <div className="stat-card">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" /> Attendance Health
          </h3>
          <div className="min-h-[120px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Attendance rate & trend analysis</p>
              <p className="text-xs mt-1">Coming in next phase</p>
            </div>
          </div>
        </div>

        {/* Absentee History Placeholder */}
        <div className="stat-card">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" /> Absentee History
          </h3>
          <div className="min-h-[120px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Consecutive absences & gap tracking</p>
              <p className="text-xs mt-1">Coming in next phase</p>
            </div>
          </div>
        </div>

        {/* Follow-up & Engagement Placeholder */}
        <div className="stat-card">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
            <BellRing className="h-5 w-5" /> Follow-up & Engagement Risk
          </h3>
          <div className="min-h-[120px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
            <div className="text-center">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Follow-up flags & engagement status</p>
              <p className="text-xs mt-1">Coming in next phase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

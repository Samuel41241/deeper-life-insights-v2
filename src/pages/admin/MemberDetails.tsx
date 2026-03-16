import { useParams, Link } from "react-router-dom";
import { useMember, useMemberCards, useCreateCard } from "@/hooks/use-members";
import { useMemberEngagement, useMemberAttendanceHistory } from "@/hooks/use-engagement";
import { User, QrCode, Calendar, MapPin, Phone, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, BellRing, ClipboardCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { RiskLevel } from "@/hooks/use-engagement";

const categoryLabels: Record<string, string> = {
  adult_male: "Adult Male", adult_female: "Adult Female",
  youth_boy: "Youth Boy", youth_girl: "Youth Girl",
  children_boy: "Children Boy", children_girl: "Children Girl",
};

const riskStyles: Record<RiskLevel, { label: string; class: string }> = {
  no_concern: { label: "No Concern", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  watchlist: { label: "Watchlist", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  follow_up: { label: "Follow-Up Required", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  pastoral_attention: { label: "Pastoral Attention", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const member = useMember(id!);
  const cards = useMemberCards(id!);
  const createCard = useCreateCard();
  const engagement = useMemberEngagement(id!);
  const attendanceHistory = useMemberAttendanceHistory(id!);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerateCard = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const cardNumber = `DLBC-${Date.now().toString(36).toUpperCase()}`;
      const qrValue = crypto.randomUUID();
      await createCard.mutateAsync({ member_id: id, card_number: cardNumber, qr_code_value: qrValue });
      toast({ title: "Card generated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const m = member.data;
  const loc = m?.locations as any;
  const eng = engagement.data;

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
            {eng && <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskStyles[eng.risk_level].class}`}>{riskStyles[eng.risk_level].label}</span>}
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
        {/* Engagement Summary */}
        <div className="stat-card">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5" /> Engagement Summary
          </h3>
          {eng ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  <p className="text-lg font-bold">{eng.attendance_rate}%</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Services Attended</p>
                  <p className="text-lg font-bold">{eng.attended_count}/{eng.total_services_in_window}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Consecutive Absences</p>
                  <p className={`text-lg font-bold ${eng.consecutive_absences >= 2 ? "text-destructive" : ""}`}>{eng.consecutive_absences}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    {eng.trend === "declining" && <TrendingDown className="h-4 w-4 text-destructive" />}
                    {eng.trend === "improving" && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                    {eng.trend.charAt(0).toUpperCase() + eng.trend.slice(1)}
                  </p>
                </div>
              </div>
              {eng.last_attended && (
                <p className="text-sm text-muted-foreground">Last attended: <span className="font-medium text-foreground">{eng.last_attended}</span></p>
              )}
              {!eng.last_attended && (
                <p className="text-sm text-destructive font-medium">No attendance recorded in tracking window</p>
              )}
            </div>
          ) : (
            <div className="min-h-[120px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
              <p className="text-sm">Loading engagement data...</p>
            </div>
          )}
        </div>

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

        {/* Attendance History */}
        <div className="stat-card lg:col-span-2">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5" /> Recent Attendance
          </h3>
          {attendanceHistory.data && attendanceHistory.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 font-medium text-muted-foreground">Service</th>
                    <th className="pb-2 font-medium text-muted-foreground">Time</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.data.map((a: any) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2">{a.date}</td>
                      <td className="py-2">{a.services?.name || "—"}</td>
                      <td className="py-2">{new Date(a.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2">
                        <Badge variant={a.status === "present" ? "default" : a.status === "late" ? "secondary" : "destructive"} className="text-[10px]">
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { MessageSquare, FileText, Clock, ScrollText, Settings, Send, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useMessageTemplates, useUpdateTemplate, useCreateTemplate,
  useMessageSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule,
  useMessageLogs,
  useMessagingSettings, useUpsertMessagingSettings,
  useSendTestMessage,
} from "@/hooks/use-messaging";
import { useServices } from "@/hooks/use-services";

const dayLabels: Record<string, string> = {
  sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday",
};

const recipientRuleLabels: Record<string, string> = {
  all_active: "All Active Members",
  present: "Present Members (after service)",
  absent: "Absent Members (after service)",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

export default function Messaging() {
  const { toast } = useToast();

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Messaging</h1>
        <p className="admin-page-description">Automated SMS messaging, templates, schedules, and delivery logs</p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="templates"><FileText className="h-3.5 w-3.5 mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="schedules"><Clock className="h-3.5 w-3.5 mr-1.5" />Schedules</TabsTrigger>
          <TabsTrigger value="logs"><ScrollText className="h-3.5 w-3.5 mr-1.5" />Logs</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-3.5 w-3.5 mr-1.5" />Settings</TabsTrigger>
          <TabsTrigger value="send"><Send className="h-3.5 w-3.5 mr-1.5" />Manual Send</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
        <TabsContent value="schedules" className="mt-4"><SchedulesTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        <TabsContent value="send" className="mt-4"><ManualSendTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesTab() {
  const templates = useMessageTemplates();
  const updateTemplate = useUpdateTemplate();
  const { toast } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (t: any) => {
    setEditId(t.id);
    setEditBody(t.body);
    setEditTitle(t.title);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      await updateTemplate.mutateAsync({ id: editId, body: editBody, title: editTitle });
      toast({ title: "Template updated" });
      setEditId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (t: any) => {
    try {
      await updateTemplate.mutateAsync({ id: t.id, is_active: !t.is_active });
      toast({ title: t.is_active ? "Template disabled" : "Template enabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {templates.isLoading && <p className="text-muted-foreground text-center py-8">Loading templates...</p>}
      {templates.data?.map((t) => (
        <div key={t.id} className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{t.title}</h3>
              <Badge variant="outline" className="text-xs">{t.code}</Badge>
              <Badge variant="outline" className="text-xs">{recipientRuleLabels[t.target_type] || t.target_type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
              <Button variant="outline" size="sm" onClick={() => startEdit(t)}>Edit</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t.body}</p>
        </div>
      ))}

      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} />
              <p className="text-xs text-muted-foreground">{editBody.length} characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateTemplate.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchedulesTab() {
  const schedules = useMessageSchedules();
  const templates = useMessageTemplates();
  const services = useServices();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [sendTime, setSendTime] = useState("16:00");
  const [recipientRule, setRecipientRule] = useState("all_active");
  const [serviceId, setServiceId] = useState("");

  const handleCreate = async () => {
    if (!templateId || !dayOfWeek || !sendTime) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await createSchedule.mutateAsync({
        template_id: templateId,
        day_of_week: dayOfWeek,
        send_time: sendTime,
        recipient_rule: recipientRule,
        service_id: serviceId || undefined,
      });
      toast({ title: "Schedule created" });
      setDialogOpen(false);
      setTemplateId(""); setDayOfWeek(""); setSendTime("16:00"); setRecipientRule("all_active"); setServiceId("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleSchedule = async (s: any) => {
    try {
      await updateSchedule.mutateAsync({ id: s.id, is_active: !s.is_active });
      toast({ title: s.is_active ? "Schedule paused" : "Schedule activated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule.mutateAsync(id);
      toast({ title: "Schedule deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Message Schedules</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Schedule
        </Button>
      </div>

      {schedules.isLoading && <p className="text-muted-foreground text-center py-8">Loading...</p>}
      {schedules.data?.length === 0 && !schedules.isLoading && (
        <div className="stat-card py-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No schedules configured</p>
        </div>
      )}

      {schedules.data?.map((s) => (
        <div key={s.id} className="stat-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{s.message_templates?.title || "Unknown template"}</p>
              {s.is_active ? (
                <Badge className="bg-primary/10 text-primary text-xs">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Paused</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dayLabels[s.day_of_week] || s.day_of_week} at {s.send_time} ({s.timezone})
              {s.services?.name && ` · ${s.services.name}`}
              {` · ${recipientRuleLabels[s.recipient_rule] || s.recipient_rule}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={s.is_active} onCheckedChange={() => toggleSchedule(s)} />
            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Message Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template *</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.data?.filter(t => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Send Time (WAT) *</Label>
              <Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Recipient Rule *</Label>
              <Select value={recipientRule} onValueChange={setRecipientRule}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(recipientRuleLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked Service (optional)</Label>
              <Select value={serviceId} onValueChange={(v) => setServiceId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {services.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSchedule.isPending || !templateId || !dayOfWeek}>
              {createSchedule.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogsTab() {
  const logs = useMessageLogs(200);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg">Delivery Logs</h2>
      {logs.isLoading && <p className="text-muted-foreground text-center py-8">Loading...</p>}
      {logs.data?.length === 0 && !logs.isLoading && (
        <div className="stat-card py-12 text-center text-muted-foreground">
          <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No messages sent yet</p>
        </div>
      )}

      {logs.data && logs.data.length > 0 && (
        <div className="stat-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted-foreground">Member</th>
                <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Template</th>
                <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 font-medium">{l.members?.full_name || "—"}</td>
                  <td className="py-2 text-muted-foreground hidden sm:table-cell">{l.message_templates?.title || "—"}</td>
                  <td className="py-2 text-muted-foreground hidden md:table-cell">{l.phone || "—"}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[l.status] || ""}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground text-xs hidden lg:table-cell">
                    {l.sent_at ? new Date(l.sent_at).toLocaleString() : l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const settings = useMessagingSettings();
  const upsert = useUpsertMessagingSettings();
  const { toast } = useToast();
  const [providerName, setProviderName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings.data && !initialized) {
    setProviderName(settings.data.provider_name || "twilio");
    setSenderName(settings.data.sender_name || "DLBC");
    setTimezone(settings.data.default_timezone || "Africa/Lagos");
    setEnabled(settings.data.enabled);
    setInitialized(true);
  }

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        id: settings.data?.id,
        provider_name: providerName,
        sender_name: senderName,
        default_timezone: timezone,
        enabled,
      });
      toast({ title: "Messaging settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="stat-card space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading font-bold text-lg">Messaging Configuration</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure SMS provider settings. API keys are stored securely as backend secrets.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>SMS Provider</Label>
          <Select value={providerName} onValueChange={setProviderName}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="twilio">Twilio</SelectItem>
              <SelectItem value="termii">Termii</SelectItem>
              <SelectItem value="africastalking">Africa's Talking</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sender Name / ID</Label>
          <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="DLBC" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Default Timezone</Label>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Africa/Lagos" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Messaging Enabled</Label>
          <div className="flex items-center gap-3 h-11">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <span className="text-sm text-muted-foreground">{enabled ? "Active — messages will be sent" : "Disabled — no messages will be sent"}</span>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium mb-1">API Key Configuration</p>
        <p className="text-xs text-muted-foreground">
          SMS provider API keys are managed as secure backend secrets. Contact your system administrator to configure or update the SMS provider credentials.
        </p>
      </div>

      <Button onClick={handleSave} disabled={upsert.isPending}>
        {upsert.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

function ManualSendTab() {
  const templates = useMessageTemplates();
  const sendTest = useSendTestMessage();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState("");
  const [phone, setPhone] = useState("");

  const handleSend = async () => {
    if (!templateId || !phone.trim()) {
      toast({ title: "Select a template and enter a phone number", variant: "destructive" });
      return;
    }
    try {
      await sendTest.mutateAsync({ template_id: templateId, phone: phone.trim() });
      toast({ title: "Test message sent", description: `Sent to ${phone.trim()}` });
      setPhone("");
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
  };

  const selectedTemplate = templates.data?.find(t => t.id === templateId);

  return (
    <div className="stat-card space-y-6 max-w-lg">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading font-bold text-lg">Manual / Test Send</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Send a test message to verify your SMS configuration is working.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Template *</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Select template" /></SelectTrigger>
            <SelectContent>
              {templates.data?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Message preview:</p>
            <p className="text-sm">{selectedTemplate.body}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." className="h-11" />
          <p className="text-xs text-muted-foreground">Use international format (e.g. +234XXXXXXXXXX)</p>
        </div>

        <Button onClick={handleSend} disabled={sendTest.isPending || !templateId || !phone.trim()}>
          {sendTest.isPending ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Test Message</>}
        </Button>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { ScanLine, Camera, Usb, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useRecordAttendance } from "@/hooks/use-attendance";
import { toast } from "@/hooks/use-toast";
import CameraScanner from "@/components/scanner/CameraScanner";

type ScanState = "ready" | "processing" | "success" | "error";

export default function AttendanceScanner() {
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scanState, setScanState] = useState<ScanState>("ready");
  const [resultMessage, setResultMessage] = useState("");
  const [memberName, setMemberName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const services = useServices();
  const locations = useAllLocations();
  const recordAttendance = useRecordAttendance();

  const resetToReady = useCallback(() => {
    setScanState("ready");
    setResultMessage("");
    setMemberName("");
    bufferRef.current = "";
    inputRef.current?.focus();
  }, []);

  const showResult = useCallback((state: ScanState, message: string, name = "") => {
    setScanState(state);
    setResultMessage(message);
    setMemberName(name);
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(resetToReady, state === "success" ? 1500 : 2500);
  }, [resetToReady]);

  const processScan = useCallback(async (qrValue: string) => {
    if (!serviceId || !locationId) {
      showResult("error", "Please select a service and location first");
      return;
    }
    if (scanState === "processing") return;
    
    setScanState("processing");
    const trimmed = qrValue.trim();
    if (!trimmed) { resetToReady(); return; }

    try {
      // Lookup card
      const { data: card, error: cardErr } = await supabase
        .from("cards")
        .select("*, members(id, full_name, location_id, status)")
        .or(`qr_code_value.eq.${trimmed},card_number.eq.${trimmed}`)
        .limit(1)
        .maybeSingle();

      if (cardErr || !card) {
        showResult("error", "Invalid card — not recognized");
        return;
      }
      if (card.status !== "active") {
        showResult("error", `Card is ${card.status}`);
        return;
      }
      const member = card.members as any;
      if (!member) {
        showResult("error", "Member not found for this card");
        return;
      }
      if (member.status !== "active") {
        showResult("error", `Member is ${member.status}`);
        return;
      }

      // Record attendance
      await recordAttendance.mutateAsync({
        member_id: member.id,
        location_id: locationId,
        service_id: serviceId,
        card_id: card.id,
        status: "present",
      });

      showResult("success", "Attendance Confirmed", member.full_name);
    } catch (err: any) {
      if (err.message === "DUPLICATE") {
        showResult("error", "Already checked in for this service");
      } else {
        showResult("error", "Error recording attendance");
      }
    }
  }, [serviceId, locationId, scanState, recordAttendance, showResult, resetToReady]);

  // USB scanner input handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = bufferRef.current;
      bufferRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      processScan(val);
    }
  }, [processScan]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    bufferRef.current = e.target.value;
    // Auto-submit after 100ms of no input (USB scanners type fast)
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (bufferRef.current.length > 3) {
        const val = bufferRef.current;
        bufferRef.current = "";
        if (inputRef.current) inputRef.current.value = "";
        processScan(val);
      }
    }, 150);
  }, [processScan]);

  // Keep focus on input for USB mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (scanState === "ready" && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [scanState]);

  const configReady = !!serviceId && !!locationId;

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Attendance Scanner</h1>
        <p className="admin-page-description">Scan member QR cards to record attendance</p>
      </div>

      {/* Service & Location selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger className="w-full sm:w-[260px] h-12 text-base">
            <SelectValue placeholder="Select Service" />
          </SelectTrigger>
          <SelectContent>
            {services.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.day_of_week}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full sm:w-[260px] h-12 text-base">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.data?.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!configReady && (
        <div className="stat-card py-12 text-center text-muted-foreground">
          <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Select a service and location to begin scanning</p>
        </div>
      )}

      {configReady && (
        <Tabs defaultValue="usb" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
            <TabsTrigger value="usb" className="text-base gap-2 h-10">
              <Usb className="h-4 w-4" /> USB Scanner
            </TabsTrigger>
            <TabsTrigger value="camera" className="text-base gap-2 h-10">
              <Camera className="h-4 w-4" /> Camera
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usb">
            <div className="stat-card min-h-[400px] flex flex-col items-center justify-center relative">
              {/* Hidden input for USB scanner */}
              <input
                ref={inputRef}
                className="absolute opacity-0 w-0 h-0"
                onKeyDown={handleKeyDown}
                onChange={handleInput}
                autoFocus
                aria-label="QR scanner input"
              />

              <ScanFeedback
                state={scanState}
                message={resultMessage}
                memberName={memberName}
                onTapToReset={resetToReady}
              />
            </div>
          </TabsContent>

          <TabsContent value="camera">
            <div className="stat-card min-h-[400px] flex flex-col items-center justify-center">
              {scanState === "ready" || scanState === "processing" ? (
                <CameraScanner
                  onScan={processScan}
                  isProcessing={scanState === "processing"}
                />
              ) : (
                <ScanFeedback
                  state={scanState}
                  message={resultMessage}
                  memberName={memberName}
                  onTapToReset={resetToReady}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ScanFeedback({
  state,
  message,
  memberName,
  onTapToReset,
}: {
  state: ScanState;
  message: string;
  memberName: string;
  onTapToReset: () => void;
}) {
  if (state === "ready") {
    return (
      <div className="text-center text-muted-foreground animate-pulse">
        <ScanLine className="h-20 w-20 mx-auto mb-4 opacity-50" />
        <p className="text-xl font-heading font-semibold">Ready to Scan</p>
        <p className="text-sm mt-1">Point the USB scanner at a member's QR card</p>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="text-center text-muted-foreground">
        <Loader2 className="h-20 w-20 mx-auto mb-4 animate-spin opacity-50" />
        <p className="text-xl font-heading font-semibold">Processing...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center min-h-[300px] rounded-lg"
        style={{ backgroundColor: "hsl(152, 60%, 22%)" }}
        onClick={onTapToReset}
      >
        <CheckCircle2 className="h-24 w-24 mx-auto mb-4 text-primary-foreground" />
        <p className="text-3xl font-heading font-bold text-primary-foreground">{message}</p>
        {memberName && (
          <p className="text-lg mt-2 text-primary-foreground/80">{memberName}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center min-h-[300px] rounded-lg bg-destructive"
      onClick={onTapToReset}
    >
      <XCircle className="h-24 w-24 mx-auto mb-4 text-destructive-foreground" />
      <p className="text-2xl font-heading font-bold text-destructive-foreground">{message}</p>
      <p className="text-sm mt-2 text-destructive-foreground/70">Tap to dismiss</p>
    </div>
  );
}

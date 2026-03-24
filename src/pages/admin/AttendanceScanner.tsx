import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ScanLine,
  Camera,
  Usb,
  CheckCircle2,
  XCircle,
  Loader2,
  Keyboard,
  Search,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServices } from "@/hooks/use-services";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useRecordAttendance } from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";
import CameraScanner from "@/components/scanner/CameraScanner";

type ScanState = "ready" | "processing" | "success" | "error";

export default function AttendanceScanner() {
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scanState, setScanState] = useState<ScanState>("ready");
  const [resultMessage, setResultMessage] = useState("");
  const [memberName, setMemberName] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const services = useServices();
  const locations = useAllLocations();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();
  const recordAttendance = useRecordAttendance();
  const { toast } = useToast();

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

  useEffect(() => {
    if (!locationId && visibleLocations.length === 1) {
      setLocationId(visibleLocations[0].id);
    }
  }, [locationId, visibleLocations]);

  const resetToReady = useCallback(() => {
    setScanState("ready");
    setResultMessage("");
    setMemberName("");
    bufferRef.current = "";
    inputRef.current?.focus();
  }, []);

  const showResult = useCallback(
    (state: ScanState, message: string, name = "") => {
      setScanState(state);
      setResultMessage(message);
      setMemberName(name);
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(
        resetToReady,
        state === "success" ? 1500 : 2500
      );
    },
    [resetToReady]
  );

  const ensureLocationAllowed = useCallback(
    (memberLocationId: string) => {
      if (effectiveScopedLocations === null) return true;
      return effectiveScopedLocations.includes(memberLocationId);
    },
    [effectiveScopedLocations]
  );

  const recordMemberAttendance = useCallback(
    async (member: any, cardId?: string | null) => {
      if (!serviceId || !locationId) {
        showResult("error", "Please select a service and location first");
        return;
      }

      if (!ensureLocationAllowed(member.location_id)) {
        showResult("error", "This member is outside your allowed scope");
        return;
      }

      if (member.location_id !== locationId) {
        showResult("error", "Selected location does not match member location");
        return;
      }

      try {
        await recordAttendance.mutateAsync({
          member_id: member.id,
          location_id: locationId,
          service_id: serviceId,
          card_id: cardId || undefined,
          status: "present",
        });

        showResult("success", "Present ✓", member.full_name);
      } catch (err: any) {
        if (err.message === "DUPLICATE") {
          showResult("error", "Already checked in for this service");
        } else {
          console.error("[Scanner] Attendance error:", err);
          showResult("error", "Error recording attendance");
        }
      }
    },
    [serviceId, locationId, ensureLocationAllowed, recordAttendance, showResult]
  );

  const processScan = useCallback(
    async (qrValue: string) => {
      if (!serviceId || !locationId) {
        showResult("error", "Please select a service and location first");
        return;
      }

      if (scanState === "processing") return;

      setScanState("processing");

      const trimmed = qrValue.trim();
      if (!trimmed) {
        resetToReady();
        return;
      }

      console.log("[Scanner] Processing scan value:", trimmed);

      try {
        const { data: card, error: cardErr } = await supabase
          .from("cards")
          .select("*, members(id, full_name, location_id, status)")
          .or(`qr_code_value.eq.${trimmed},card_number.eq.${trimmed}`)
          .limit(1)
          .maybeSingle();

        if (cardErr) {
          console.error("[Scanner] Card lookup error:", cardErr);
          showResult("error", "Error looking up card");
          return;
        }

        if (!card) {
          console.warn("[Scanner] Card not found for value:", trimmed);
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

        await recordMemberAttendance(member, card.id);
      } catch (err: any) {
        if (err.message === "DUPLICATE") {
          showResult("error", "Already checked in for this service");
        } else {
          console.error("[Scanner] Processing error:", err);
          showResult("error", "Error recording attendance");
        }
      }
    },
    [serviceId, locationId, scanState, showResult, resetToReady, recordMemberAttendance]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = bufferRef.current;
        bufferRef.current = "";
        if (inputRef.current) inputRef.current.value = "";
        processScan(val);
      }
    },
    [processScan]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      bufferRef.current = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (bufferRef.current.length > 3) {
          const val = bufferRef.current;
          bufferRef.current = "";
          if (inputRef.current) inputRef.current.value = "";
          processScan(val);
        }
      }, 150);
    },
    [processScan]
  );

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processScan(manualInput.trim());
      setManualInput("");
    }
  };

  const handleSearchMembers = useCallback(
    async (value: string) => {
      setSearchTerm(value);

      if (!value.trim() || value.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      let query = supabase
        .from("members")
        .select("id, full_name, location_id, status, locations(name)")
        .eq("status", "active")
        .ilike("full_name", `%${value.trim()}%`)
        .limit(10);

      if (effectiveScopedLocations && effectiveScopedLocations.length > 0) {
        query = query.in("location_id", effectiveScopedLocations);
      } else if (effectiveScopedLocations && effectiveScopedLocations.length === 0) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Scanner] Search error:", error);
        return;
      }

      setSearchResults(data || []);
    },
    [effectiveScopedLocations]
  );

  const handleSmartCheckIn = async (member: any) => {
    setSearchResults([]);
    setSearchTerm("");
    await recordMemberAttendance(member, null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (scanState === "ready" && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [scanState]);

  if (roleLoading || scopeLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Attendance Scanner</h1>
        <p className="admin-page-description">Loading scanner...</p>
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

  const configReady = !!serviceId && !!locationId;

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Attendance Scanner</h1>
        <p className="admin-page-description">
          QR scan, manual card entry, and smart member search check-in
        </p>
      </div>

      {/* Service & Location selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger className="w-full sm:w-[260px] h-12 text-base">
            <SelectValue placeholder="Select Service" />
          </SelectTrigger>
          <SelectContent>
            {services.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {s.day_of_week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full sm:w-[260px] h-12 text-base">
            <SelectValue placeholder="Select Location" />
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

      {!configReady && (
        <div className="stat-card py-12 text-center text-muted-foreground">
          <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">
            Select a service and location to begin attendance
          </p>
        </div>
      )}

      {configReady && (
        <Tabs defaultValue="usb" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
            <TabsTrigger value="usb" className="text-base gap-2 h-10">
              <Usb className="h-4 w-4" /> USB
            </TabsTrigger>
            <TabsTrigger value="camera" className="text-base gap-2 h-10">
              <Camera className="h-4 w-4" /> Camera
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-base gap-2 h-10">
              <Keyboard className="h-4 w-4" /> Manual
            </TabsTrigger>
            <TabsTrigger value="search" className="text-base gap-2 h-10">
              <Search className="h-4 w-4" /> Smart Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usb">
            <div className="stat-card min-h-[400px] flex flex-col items-center justify-center relative">
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

          <TabsContent value="manual">
            <div className="stat-card min-h-[400px] flex flex-col items-center justify-center">
              {scanState === "ready" || scanState === "processing" ? (
                <div className="w-full max-w-md space-y-4 text-center">
                  <Keyboard className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Enter card number or QR value manually</p>
                  <div className="flex gap-2">
                    <Input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Card number or QR value"
                      className="h-14 text-lg text-center"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleManualSubmit();
                      }}
                      disabled={scanState === "processing"}
                    />
                    <Button
                      onClick={handleManualSubmit}
                      disabled={!manualInput.trim() || scanState === "processing"}
                      className="h-14 px-6"
                    >
                      {scanState === "processing" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </div>
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

          <TabsContent value="search">
            <div className="stat-card min-h-[400px]">
              {scanState === "ready" || scanState === "processing" ? (
                <div className="w-full max-w-2xl mx-auto space-y-4">
                  <div className="text-center">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-3" />
                    <p className="text-muted-foreground">
                      Search member by name and check in instantly
                    </p>
                  </div>

                  <Input
                    value={searchTerm}
                    onChange={(e) => handleSearchMembers(e.target.value)}
                    placeholder="Search member name..."
                    className="h-12 text-base"
                    disabled={scanState === "processing"}
                  />

                  <div className="space-y-2">
                    {searchResults.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSmartCheckIn(member)}
                        className="w-full text-left stat-card hover:bg-accent/30 transition-colors"
                        disabled={scanState === "processing"}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(member.locations as any)?.name || "—"}
                            </p>
                          </div>
                          <span className="text-xs text-primary font-medium">
                            Check In
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {searchTerm.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No matching members found in your scope
                    </div>
                  )}
                </div>
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
        <p className="text-sm mt-1">Use USB scanner, camera, manual card entry, or smart search</p>
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
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraScannerProps {
  onScan: (value: string) => void;
  isProcessing: boolean;
}

export default function CameraScanner({ onScan, isProcessing }: CameraScannerProps) {
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");
  const containerId = "qr-camera-reader";

  const startCamera = async () => {
    setError("");
    try {
      // Clean up any previous instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          console.log("[CameraScanner] QR decoded:", decodedText);
          if (decodedText !== lastScanRef.current) {
            lastScanRef.current = decodedText;
            onScan(decodedText);
            // Reset dedup after 3 seconds
            setTimeout(() => { lastScanRef.current = ""; }, 3000);
          }
        },
        () => {} // ignore errors during scanning
      );
      setStarted(true);
    } catch (err: any) {
      console.error("[CameraScanner] Start error:", err);
      setError(err?.message || "Camera access denied. Please allow camera permissions.");
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        try { scannerRef.current.clear(); } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  if (!started) {
    return (
      <div className="text-center space-y-4">
        <Camera className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Use your device camera to scan QR codes</p>
        <Button onClick={startCamera} size="lg" className="h-14 px-8 text-lg">
          Start Camera
        </Button>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm mt-2 justify-center">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {/* Container must exist for html5-qrcode */}
        <div id={containerId} className="hidden" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div
        id={containerId}
        className="rounded-lg overflow-hidden border-2 border-primary/30"
      />
      {isProcessing && (
        <p className="text-center text-muted-foreground animate-pulse">Processing scan...</p>
      )}
    </div>
  );
}

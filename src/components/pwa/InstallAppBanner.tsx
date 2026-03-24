import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "pwa_install_banner_dismissed";

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const savedDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setDismissed(savedDismissed);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (standalone) setIsInstalled(true);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const isIOS = useMemo(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }, []);

  const isSafari = useMemo(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android");
  }, []);

  const showIOSHint = isIOS && isSafari && !isInstalled;

  const shouldShow = !dismissed && !isInstalled && (deferredPrompt || showIOSHint);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!shouldShow) return null;

  return (
    <div className="border-b bg-primary/5 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Install this app for faster access</p>
          {deferredPrompt ? (
            <p className="text-xs text-muted-foreground">
              Add it to your device so it opens like a normal app.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              On iPhone/iPad, tap Share, then choose “Add to Home Screen”.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {deferredPrompt && (
            <Button size="sm" onClick={handleInstall}>
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDismiss} title="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
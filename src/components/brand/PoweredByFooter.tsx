import { cn } from "@/lib/utils";

interface PoweredByFooterProps {
  className?: string;
  variant?: "light" | "dark" | "default";
}

export function PoweredByFooter({ className, variant = "default" }: PoweredByFooterProps) {
  const textColor = variant === "light"
    ? "text-primary-foreground/70"
    : variant === "dark"
    ? "text-sidebar-foreground/50"
    : "text-muted-foreground";

  return (
    <footer className={cn("py-4 text-center text-xs", textColor, className)}>
      Powered By: <span className="font-semibold">Xuzentra Technologies Limited</span>
    </footer>
  );
}

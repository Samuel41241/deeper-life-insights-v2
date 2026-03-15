import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const textSizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-full brand-gradient flex items-center justify-center", sizeMap[size])}>
        <span className="text-primary-foreground font-heading font-bold text-xs">DL</span>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-heading font-bold text-foreground", textSizeMap[size])}>
            Deeper Life
          </span>
          <span className="text-xs text-muted-foreground">Bible Church</span>
        </div>
      )}
    </div>
  );
}

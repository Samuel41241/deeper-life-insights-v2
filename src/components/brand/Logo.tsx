import { cn } from "@/lib/utils";
import dlbcLogo from "@/assets/dlbc-logo.png";

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
      <img
        src={dlbcLogo}
        alt="Deeper Life Bible Church"
        className={cn("rounded-full object-cover", sizeMap[size])}
      />
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

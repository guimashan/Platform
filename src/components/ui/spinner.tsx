import { Loader2 } from "lucide-react";

interface SpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function Spinner({ label, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center gap-3 py-8" data-testid="spinner-container">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} data-testid="spinner-icon" />
      {label && (
        <span className="text-sm text-muted-foreground" data-testid="spinner-label">
          {label}
        </span>
      )}
    </div>
  );
}

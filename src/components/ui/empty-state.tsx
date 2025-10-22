import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-state">
      <div className="mb-4 text-muted-foreground">
        {icon || <Inbox className="h-12 w-12" data-testid="empty-state-icon" />}
      </div>
      <h3 className="text-lg font-semibold mb-2" data-testid="empty-state-title">
        {title}
      </h3>
      {hint && (
        <p className="text-sm text-muted-foreground max-w-sm" data-testid="empty-state-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

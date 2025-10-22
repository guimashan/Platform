import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  message: string;
  title?: string;
}

export default function ErrorAlert({ message, title = "錯誤" }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" data-testid="error-alert">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle data-testid="error-alert-title">{title}</AlertTitle>
      <AlertDescription data-testid="error-alert-message">{message}</AlertDescription>
    </Alert>
  );
}

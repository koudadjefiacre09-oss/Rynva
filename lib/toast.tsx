import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/** Success toast — green check, styled via components/ui/toaster.tsx. */
export function notifySuccess(message: string) {
  toast(message, {
    icon: <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />,
  });
}

import { toast as sonnerToast } from "sonner";

interface ToastInput {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

function show({ title, description, variant = "default", duration }: ToastInput) {
  const body = title ?? description ?? "";
  const opts = description && title ? { description, duration } : { duration };
  if (variant === "destructive") return sonnerToast.error(body, opts);
  return sonnerToast.success(body, opts);
}

export function useToast() {
  return { toast: show };
}

export const toast = show;

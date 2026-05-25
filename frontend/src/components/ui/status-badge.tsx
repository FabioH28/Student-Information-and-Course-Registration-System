import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<StatusVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

function inferVariant(value: string): StatusVariant {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("paid") || normalized.includes("present") || normalized.includes("published") || normalized.includes("saved")) {
    return "success";
  }
  if (normalized.includes("pending") || normalized.includes("partial") || normalized.includes("late") || normalized.includes("risk") || normalized.includes("low")) {
    return "warning";
  }
  if (normalized.includes("absent") || normalized.includes("blocked") || normalized.includes("failed") || normalized.includes("inactive")) {
    return "danger";
  }
  if (normalized.includes("info") || normalized.includes("submitted") || normalized.includes("records")) {
    return "info";
  }
  return "neutral";
}

export function StatusBadge({
  status,
  variant,
  className,
  children,
}: {
  status?: string;
  variant?: StatusVariant;
  className?: string;
  children?: ReactNode;
}) {
  const label = String(children ?? status ?? "");
  const tone = variantClasses[variant ?? inferVariant(label)];

  return <Badge className={cn(tone, className)}>{label}</Badge>;
}

import * as React from "react";

import { Input } from "@/components/ui/input";


export function InputOTP({ value, onChange, children }: { maxLength?: number; pattern?: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Input value={value} onChange={(event) => onChange(event.target.value)} inputMode="numeric" />
      {children}
    </div>
  );
}

export function InputOTPGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}

export function InputOTPSlot({ index }: { index: number }) {
  return <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">{index + 1}</div>;
}

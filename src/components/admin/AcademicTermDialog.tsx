import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

interface AcademicTermItem {
  id: number;
  code: string;
  name: string;
  academic_year_start: number;
  academic_year_end: number;
  term_number: number;
  status: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  registration_start_at: string;
  registration_end_at: string;
}

interface AcademicTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: AcademicTermItem | null;
}

interface TermFormState {
  code: string;
  name: string;
  academic_year_start: string;
  academic_year_end: string;
  term_number: string;
  start_date: string;
  end_date: string;
  registration_start_at: string;
  registration_end_at: string;
  status: "planning" | "registration" | "active" | "completed" | "archived";
  is_current: boolean;
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeLocalInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function getDefaultFormState(): TermFormState {
  const year = new Date().getFullYear();
  return {
    code: "",
    name: "",
    academic_year_start: String(year),
    academic_year_end: String(year + 1),
    term_number: "1",
    start_date: "",
    end_date: "",
    registration_start_at: "",
    registration_end_at: "",
    status: "planning",
    is_current: false,
  };
}

function getInitialState(term?: AcademicTermItem | null): TermFormState {
  if (!term) {
    return getDefaultFormState();
  }

  return {
    code: term.code,
    name: term.name,
    academic_year_start: String(term.academic_year_start),
    academic_year_end: String(term.academic_year_end),
    term_number: String(term.term_number),
    start_date: toDateInput(term.start_date),
    end_date: toDateInput(term.end_date),
    registration_start_at: toDateTimeLocalInput(term.registration_start_at),
    registration_end_at: toDateTimeLocalInput(term.registration_end_at),
    status: term.status as TermFormState["status"],
    is_current: term.is_current,
  };
}

export function AcademicTermDialog({ open, onOpenChange, term }: AcademicTermDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TermFormState>(getInitialState(term));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(term));
    }
  }, [open, term]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim()) {
        throw new Error("Code and name are required.");
      }

      if (!form.start_date || !form.end_date || !form.registration_start_at || !form.registration_end_at) {
        throw new Error("All term dates and registration dates are required.");
      }

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        academic_year_start: Number(form.academic_year_start),
        academic_year_end: Number(form.academic_year_end),
        term_number: Number(form.term_number),
        start_date: form.start_date,
        end_date: form.end_date,
        registration_start_at: form.registration_start_at,
        registration_end_at: form.registration_end_at,
        status: form.status,
        is_current: form.is_current,
      };

      if (term) {
        return apiPut(`/academic/terms/${term.id}`, payload);
      }

      return apiPost("/academic/terms", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["academic", "terms"] }),
        queryClient.invalidateQueries({ queryKey: ["academic", "reference-data"] }),
      ]);

      toast({
        title: term ? "Semester updated" : "Semester created",
        description: "The academic term has been saved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: term ? "Unable to update semester" : "Unable to create semester",
        description: error instanceof Error ? error.message : "The academic term could not be saved.",
      });
    },
  });

  const setField = <K extends keyof TermFormState>(key: K, value: TermFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{term ? "Edit Semester" : "New Semester"}</DialogTitle>
          <DialogDescription>
            Define the academic term, its registration window, and whether it should be treated as the current active term.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="term-code">Code</Label>
            <Input id="term-code" value={form.code} onChange={(event) => setField("code", event.target.value)} placeholder="2026-SPR" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-name">Name</Label>
            <Input id="term-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Spring 2026" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year-start">Academic Year Start</Label>
            <Input
              id="year-start"
              type="number"
              value={form.academic_year_start}
              onChange={(event) => setField("academic_year_start", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-end">Academic Year End</Label>
            <Input
              id="year-end"
              type="number"
              value={form.academic_year_end}
              onChange={(event) => setField("academic_year_end", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term-number">Term Number</Label>
            <Input
              id="term-number"
              type="number"
              min={1}
              max={8}
              value={form.term_number}
              onChange={(event) => setField("term_number", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setField("status", value as TermFormState["status"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term-start-date">Start Date</Label>
            <Input id="term-start-date" type="date" value={form.start_date} onChange={(event) => setField("start_date", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-end-date">End Date</Label>
            <Input id="term-end-date" type="date" value={form.end_date} onChange={(event) => setField("end_date", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration-start">Registration Opens</Label>
            <Input
              id="registration-start"
              type="datetime-local"
              value={form.registration_start_at}
              onChange={(event) => setField("registration_start_at", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-end">Registration Closes</Label>
            <Input
              id="registration-end"
              type="datetime-local"
              value={form.registration_end_at}
              onChange={(event) => setField("registration_end_at", event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
          <Checkbox id="term-is-current" checked={form.is_current} onCheckedChange={(checked) => setField("is_current", checked === true)} />
          <div className="space-y-1">
            <Label htmlFor="term-is-current" className="text-sm font-medium">
              Mark as current term
            </Label>
            <p className="text-xs text-muted-foreground">
              If selected, CIS will treat this as the primary active term for dashboards, registration, and reporting.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : term ? "Save Changes" : "Create Semester"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

export interface ClubItem {
  club_id: number;
  club_code: string;
  club_name: string;
  category_name: string;
  club_status: string;
  join_mode: string;
  active_members: number;
  pending_requests: number;
  category_id: number;
  description: string | null;
  advisor_teacher_id: number | null;
  advisor_name: string | null;
  capacity: number | null;
  meeting_day_of_week: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_location: string | null;
  contact_email: string | null;
}

interface ClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  club?: ClubItem | null;
}

interface ClubFormState {
  category_id: string;
  code: string;
  name: string;
  description: string;
  advisor_teacher_id: string;
  join_mode: "open" | "request" | "invite_only" | "waitlist";
  status: "draft" | "active" | "recruiting" | "inactive" | "archived";
  capacity: string;
  meeting_day_of_week: string;
  meeting_start_time: string;
  meeting_end_time: string;
  meeting_location: string;
  contact_email: string;
}

function toTimeInput(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function getDefaultState(referenceData: AdminReferenceData): ClubFormState {
  return {
    category_id: referenceData.club_categories?.[0] ? String(referenceData.club_categories[0].id) : "",
    code: "",
    name: "",
    description: "",
    advisor_teacher_id: "none",
    join_mode: "request",
    status: "active",
    capacity: "",
    meeting_day_of_week: "none",
    meeting_start_time: "",
    meeting_end_time: "",
    meeting_location: "",
    contact_email: "",
  };
}

function getInitialState(referenceData: AdminReferenceData, club?: ClubItem | null): ClubFormState {
  if (!club) {
    return getDefaultState(referenceData);
  }

  return {
    category_id: String(club.category_id),
    code: club.club_code,
    name: club.club_name,
    description: club.description ?? "",
    advisor_teacher_id: club.advisor_teacher_id ? String(club.advisor_teacher_id) : "none",
    join_mode: club.join_mode as ClubFormState["join_mode"],
    status: club.club_status as ClubFormState["status"],
    capacity: club.capacity ? String(club.capacity) : "",
    meeting_day_of_week: club.meeting_day_of_week ?? "none",
    meeting_start_time: toTimeInput(club.meeting_start_time),
    meeting_end_time: toTimeInput(club.meeting_end_time),
    meeting_location: club.meeting_location ?? "",
    contact_email: club.contact_email ?? "",
  };
}

export function ClubDialog({ open, onOpenChange, referenceData, club }: ClubDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClubFormState>(getInitialState(referenceData, club));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(referenceData, club));
    }
  }, [open, club, referenceData]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.category_id || !form.code.trim() || !form.name.trim()) {
        throw new Error("Category, code, and name are required.");
      }

      const payload = {
        category_id: Number(form.category_id),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        advisor_teacher_id: form.advisor_teacher_id !== "none" ? Number(form.advisor_teacher_id) : null,
        join_mode: form.join_mode,
        status: form.status,
        capacity: form.capacity ? Number(form.capacity) : null,
        meeting_day_of_week: form.meeting_day_of_week !== "none" ? form.meeting_day_of_week : null,
        meeting_start_time: form.meeting_start_time || null,
        meeting_end_time: form.meeting_end_time || null,
        meeting_location: form.meeting_location.trim() || null,
        contact_email: form.contact_email.trim() || null,
      };

      if (club) {
        return apiPut(`/communications/clubs/${club.club_id}`, payload);
      }

      return apiPost("/communications/clubs", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["communications", "clubs"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "clubs"] }),
        queryClient.invalidateQueries({ queryKey: ["communications", "overview"] }),
      ]);
      toast({
        title: club ? "Club updated" : "Club created",
        description: "Club settings are now reflected in the campus directory.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: club ? "Unable to update club" : "Unable to create club",
        description: error instanceof Error ? error.message : "The club could not be saved.",
      });
    },
  });

  const setField = <K extends keyof ClubFormState>(key: K, value: ClubFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{club ? "Manage Club" : "New Club"}</DialogTitle>
          <DialogDescription>Configure club identity, advisor assignment, membership rules, and meeting details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[0.8fr,1.2fr]">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(value) => setField("category_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(referenceData.club_categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-code">Club Code</Label>
                <Input id="club-code" value={form.code} onChange={(event) => setField("code", event.target.value)} placeholder="ACM" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-name">Club Name</Label>
              <Input id="club-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Computing Society" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-description">Description</Label>
              <Textarea id="club-description" rows={5} value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Describe the club purpose, audience, and campus impact" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Advisor</Label>
                <Select value={form.advisor_teacher_id} onValueChange={(value) => setField("advisor_teacher_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No advisor assigned</SelectItem>
                    {(referenceData.teachers ?? []).map((teacher) => (
                      <SelectItem key={teacher.teacher_profile_id} value={String(teacher.teacher_profile_id)}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-contact-email">Contact Email</Label>
                <Input id="club-contact-email" type="email" value={form.contact_email} onChange={(event) => setField("contact_email", event.target.value)} placeholder="club@cis.edu" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Join Mode</Label>
                <Select value={form.join_mode} onValueChange={(value) => setField("join_mode", value as ClubFormState["join_mode"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select join mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="invite_only">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as ClubFormState["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="recruiting">Recruiting</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-capacity">Capacity</Label>
              <Input id="club-capacity" type="number" min="1" value={form.capacity} onChange={(event) => setField("capacity", event.target.value)} placeholder="Optional membership cap" />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">Meeting Schedule</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={form.meeting_day_of_week} onValueChange={(value) => setField("meeting_day_of_week", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No fixed day</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club-location">Location</Label>
                  <Input id="club-location" value={form.meeting_location} onChange={(event) => setField("meeting_location", event.target.value)} placeholder="Innovation Hub" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club-start">Start Time</Label>
                  <Input id="club-start" type="time" value={form.meeting_start_time} onChange={(event) => setField("meeting_start_time", event.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club-end">End Time</Label>
                  <Input id="club-end" type="time" value={form.meeting_end_time} onChange={(event) => setField("meeting_end_time", event.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : club ? "Save Changes" : "Create Club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

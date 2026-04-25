import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type ClubItem } from "@/components/admin/ClubDialog";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

export interface CampusEventItem {
  id: number;
  club_id: number | null;
  title: string;
  description: string | null;
  organizer_name: string;
  event_type: string;
  location_name: string;
  delivery_mode: string;
  status: string;
  starts_at: string;
  ends_at: string;
  registration_required: boolean;
  capacity: number | null;
  expected_attendees: number | null;
}

interface CampusEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: ClubItem[];
  event?: CampusEventItem | null;
}

interface CampusEventFormState {
  club_id: string;
  title: string;
  description: string;
  organizer_name: string;
  event_type: string;
  location_name: string;
  delivery_mode: "onsite" | "online" | "hybrid";
  starts_at: string;
  ends_at: string;
  registration_required: boolean;
  capacity: string;
  expected_attendees: string;
  status: "draft" | "scheduled" | "open" | "internal" | "cancelled" | "completed";
}

function toDateTimeLocalInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function getInitialState(event?: CampusEventItem | null): CampusEventFormState {
  return {
    club_id: event?.club_id ? String(event.club_id) : "none",
    title: event?.title ?? "",
    description: event?.description ?? "",
    organizer_name: event?.organizer_name ?? "",
    event_type: event?.event_type ?? "",
    location_name: event?.location_name ?? "",
    delivery_mode: (event?.delivery_mode as CampusEventFormState["delivery_mode"]) ?? "onsite",
    starts_at: toDateTimeLocalInput(event?.starts_at),
    ends_at: toDateTimeLocalInput(event?.ends_at),
    registration_required: event?.registration_required ?? false,
    capacity: event?.capacity ? String(event.capacity) : "",
    expected_attendees: event?.expected_attendees ? String(event.expected_attendees) : "",
    status: (event?.status as CampusEventFormState["status"]) ?? "draft",
  };
}

export function CampusEventDialog({ open, onOpenChange, clubs, event }: CampusEventDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CampusEventFormState>(getInitialState(event));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(event));
    }
  }, [open, event]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.organizer_name.trim() || !form.event_type.trim() || !form.location_name.trim() || !form.starts_at || !form.ends_at) {
        throw new Error("Title, organizer, event type, location, and both date fields are required.");
      }

      const payload = {
        club_id: form.club_id !== "none" ? Number(form.club_id) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        organizer_name: form.organizer_name.trim(),
        event_type: form.event_type.trim(),
        location_name: form.location_name.trim(),
        delivery_mode: form.delivery_mode,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        registration_required: form.registration_required,
        capacity: form.capacity ? Number(form.capacity) : null,
        expected_attendees: form.expected_attendees ? Number(form.expected_attendees) : null,
        status: form.status,
      };

      if (event) {
        return apiPut(`/communications/events/${event.id}`, payload);
      }

      return apiPost("/communications/events", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["communications", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "news"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "clubs"] }),
      ]);
      toast({
        title: event ? "Event updated" : "Event created",
        description: "Campus event details are now reflected in the news workspace.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: event ? "Unable to update event" : "Unable to create event",
        description: error instanceof Error ? error.message : "The event could not be saved.",
      });
    },
  });

  const setField = <K extends keyof CampusEventFormState>(key: K, value: CampusEventFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Campus Event" : "New Campus Event"}</DialogTitle>
          <DialogDescription>Schedule a campus event and keep the publishing layer shaped like the final product.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Linked Club</Label>
              <Select value={form.club_id} onValueChange={(value) => setField("club_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked club</SelectItem>
                  {clubs.map((clubItem) => (
                    <SelectItem key={clubItem.club_id} value={String(clubItem.club_id)}>
                      {clubItem.club_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" value={form.title} onChange={(eventItem) => setField("title", eventItem.target.value)} placeholder="Innovation Day 2026" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" rows={5} value={form.description} onChange={(eventItem) => setField("description", eventItem.target.value)} placeholder="Outline the event agenda, audience, and goals" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organizer-name">Organizer</Label>
                <Input id="organizer-name" value={form.organizer_name} onChange={(eventItem) => setField("organizer_name", eventItem.target.value)} placeholder="Student Affairs Office" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Input id="event-type" value={form.event_type} onChange={(eventItem) => setField("event_type", eventItem.target.value)} placeholder="Workshop, Fair, Competition" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input id="event-location" value={form.location_name} onChange={(eventItem) => setField("location_name", eventItem.target.value)} placeholder="Main Hall" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Mode</Label>
                <Select value={form.delivery_mode} onValueChange={(value) => setField("delivery_mode", value as CampusEventFormState["delivery_mode"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts-at">Starts At</Label>
                <Input id="starts-at" type="datetime-local" value={form.starts_at} onChange={(eventItem) => setField("starts_at", eventItem.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends-at">Ends At</Label>
                <Input id="ends-at" type="datetime-local" value={form.ends_at} onChange={(eventItem) => setField("ends_at", eventItem.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-capacity">Capacity</Label>
                <Input id="event-capacity" type="number" min="1" value={form.capacity} onChange={(eventItem) => setField("capacity", eventItem.target.value)} placeholder="Optional cap" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected-attendees">Expected Attendees</Label>
                <Input id="expected-attendees" type="number" min="0" value={form.expected_attendees} onChange={(eventItem) => setField("expected_attendees", eventItem.target.value)} placeholder="Projected reach" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value as CampusEventFormState["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
              <Checkbox id="event-registration-required" checked={form.registration_required} onCheckedChange={(checked) => setField("registration_required", checked === true)} />
              <div className="space-y-1">
                <Label htmlFor="event-registration-required" className="text-sm font-medium">
                  Registration required
                </Label>
                <p className="text-xs text-muted-foreground">Keep this on when the event should eventually support attendee sign-up and check-in.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : event ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

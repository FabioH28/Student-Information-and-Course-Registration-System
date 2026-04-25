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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

export interface AdminCourseItem {
  offering_id: number;
  course_id: number;
  department_id: number;
  code: string;
  title: string;
  description: string | null;
  credit_hours: number;
  level_number: number;
  course_type: string;
  grading_scheme: string;
  is_active: boolean;
  academic_term_id: number;
  term_name: string;
  section_code: string;
  teacher_profile_id: number | null;
  room_id: number | null;
  delivery_mode: string;
  capacity: number;
  waitlist_capacity: number;
  status: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  schedule_notes: string | null;
  instructor_name: string | null;
  enrolled_count: number;
  meeting_day_of_week: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_type: string | null;
  meeting_summary: string | null;
}

interface CourseOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  offering?: AdminCourseItem | null;
}

interface CourseFormState {
  department_id: string;
  code: string;
  title: string;
  description: string;
  credit_hours: string;
  level_number: string;
  course_type: "core" | "elective" | "lab" | "seminar" | "project";
  grading_scheme: "letter" | "pass_fail";
  is_active: boolean;
  academic_term_id: string;
  teacher_profile_id: string;
  room_id: string;
  section_code: string;
  delivery_mode: "onsite" | "online" | "hybrid";
  capacity: string;
  waitlist_capacity: string;
  status: "draft" | "open" | "closed" | "in_progress" | "completed" | "cancelled";
  registration_opens_at: string;
  registration_closes_at: string;
  schedule_notes: string;
  meeting_day_of_week: "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  meeting_start_time: string;
  meeting_end_time: string;
  meeting_type: "lecture" | "lab" | "tutorial" | "exam" | "office_hour";
}

function toDateTimeLocalInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function toTimeInput(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function getDefaultFormState(referenceData: AdminReferenceData): CourseFormState {
  return {
    department_id: referenceData.departments[0] ? String(referenceData.departments[0].id) : "",
    code: "",
    title: "",
    description: "",
    credit_hours: "3",
    level_number: "1",
    course_type: "core",
    grading_scheme: "letter",
    is_active: true,
    academic_term_id: referenceData.terms?.[0] ? String(referenceData.terms[0].id) : "",
    teacher_profile_id: "none",
    room_id: "none",
    section_code: "A",
    delivery_mode: "onsite",
    capacity: "35",
    waitlist_capacity: "0",
    status: "draft",
    registration_opens_at: "",
    registration_closes_at: "",
    schedule_notes: "",
    meeting_day_of_week: "",
    meeting_start_time: "",
    meeting_end_time: "",
    meeting_type: "lecture",
  };
}

function getInitialState(referenceData: AdminReferenceData, offering?: AdminCourseItem | null): CourseFormState {
  if (!offering) {
    return getDefaultFormState(referenceData);
  }

  return {
    department_id: String(offering.department_id),
    code: offering.code,
    title: offering.title,
    description: offering.description ?? "",
    credit_hours: String(offering.credit_hours),
    level_number: String(offering.level_number),
    course_type: offering.course_type as CourseFormState["course_type"],
    grading_scheme: offering.grading_scheme as CourseFormState["grading_scheme"],
    is_active: Boolean(offering.is_active),
    academic_term_id: String(offering.academic_term_id),
    teacher_profile_id: offering.teacher_profile_id ? String(offering.teacher_profile_id) : "none",
    room_id: offering.room_id ? String(offering.room_id) : "none",
    section_code: offering.section_code,
    delivery_mode: offering.delivery_mode as CourseFormState["delivery_mode"],
    capacity: String(offering.capacity),
    waitlist_capacity: String(offering.waitlist_capacity),
    status: offering.status as CourseFormState["status"],
    registration_opens_at: toDateTimeLocalInput(offering.registration_opens_at),
    registration_closes_at: toDateTimeLocalInput(offering.registration_closes_at),
    schedule_notes: offering.schedule_notes ?? "",
    meeting_day_of_week: (offering.meeting_day_of_week as CourseFormState["meeting_day_of_week"]) ?? "",
    meeting_start_time: toTimeInput(offering.meeting_start_time),
    meeting_end_time: toTimeInput(offering.meeting_end_time),
    meeting_type: (offering.meeting_type as CourseFormState["meeting_type"]) ?? "lecture",
  };
}

export function CourseOfferingDialog({ open, onOpenChange, referenceData, offering }: CourseOfferingDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CourseFormState>(getInitialState(referenceData, offering));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(referenceData, offering));
    }
  }, [open, offering, referenceData]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.department_id || !form.academic_term_id || !form.code.trim() || !form.title.trim()) {
        throw new Error("Department, term, course code, and title are required.");
      }

      const payload = {
        department_id: Number(form.department_id),
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        credit_hours: Number(form.credit_hours),
        level_number: Number(form.level_number),
        course_type: form.course_type,
        grading_scheme: form.grading_scheme,
        is_active: form.is_active,
        academic_term_id: Number(form.academic_term_id),
        teacher_profile_id: form.teacher_profile_id !== "none" ? Number(form.teacher_profile_id) : null,
        room_id: form.room_id !== "none" ? Number(form.room_id) : null,
        section_code: form.section_code.trim().toUpperCase(),
        delivery_mode: form.delivery_mode,
        capacity: Number(form.capacity),
        waitlist_capacity: Number(form.waitlist_capacity),
        status: form.status,
        registration_opens_at: form.registration_opens_at || null,
        registration_closes_at: form.registration_closes_at || null,
        schedule_notes: form.schedule_notes.trim() || null,
        meeting_day_of_week: form.meeting_day_of_week || null,
        meeting_start_time: form.meeting_start_time || null,
        meeting_end_time: form.meeting_end_time || null,
        meeting_type: form.meeting_type,
      };

      if (offering) {
        return apiPut(`/academic/courses/${offering.offering_id}`, payload);
      }

      return apiPost("/academic/courses", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["academic", "courses"] }),
        queryClient.invalidateQueries({ queryKey: ["system-admin", "staff"] }),
      ]);

      toast({
        title: offering ? "Offering updated" : "Offering created",
        description: "The course offering has been saved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: offering ? "Unable to update offering" : "Unable to create offering",
        description: error instanceof Error ? error.message : "The course offering could not be saved.",
      });
    },
  });

  const setField = <K extends keyof CourseFormState>(key: K, value: CourseFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offering ? "Edit Course Offering" : "Add Course Offering"}</DialogTitle>
          <DialogDescription>
            Manage the catalog details, term placement, instructor assignment, and schedule in one workflow so the rest of CIS can build on top of it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(value) => setField("department_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData.departments.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Term</Label>
                <Select value={form.academic_term_id} onValueChange={(value) => setField("academic_term_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {(referenceData.terms ?? []).map((term) => (
                      <SelectItem key={term.id} value={String(term.id)}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.7fr,1.3fr]">
              <div className="space-y-2">
                <Label htmlFor="course-code">Course Code</Label>
                <Input id="course-code" value={form.code} onChange={(event) => setField("code", event.target.value)} placeholder="CS220" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input id="course-title" value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Data Structures" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Short catalog description"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="credit-hours">Credits</Label>
                <Input id="credit-hours" type="number" min={1} value={form.credit_hours} onChange={(event) => setField("credit_hours", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level-number">Level</Label>
                <Input id="level-number" type="number" min={1} value={form.level_number} onChange={(event) => setField("level_number", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Course Type</Label>
                <Select value={form.course_type} onValueChange={(value) => setField("course_type", value as CourseFormState["course_type"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grading Scheme</Label>
                <Select value={form.grading_scheme} onValueChange={(value) => setField("grading_scheme", value as CourseFormState["grading_scheme"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grading" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="pass_fail">Pass / Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
              <Checkbox id="course-active" checked={form.is_active} onCheckedChange={(checked) => setField("is_active", checked === true)} />
              <div className="space-y-1">
                <Label htmlFor="course-active" className="text-sm font-medium">
                  Keep catalog entry active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Turning this off hides the course catalog entry for future operational use without deleting historical offerings.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="section-code">Section</Label>
                <Input id="section-code" value={form.section_code} onChange={(event) => setField("section_code", event.target.value)} placeholder="A" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as CourseFormState["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select value={form.teacher_profile_id} onValueChange={(value) => setField("teacher_profile_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(referenceData.teachers ?? []).map((teacher) => (
                      <SelectItem key={teacher.teacher_profile_id} value={String(teacher.teacher_profile_id)}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={form.room_id} onValueChange={(value) => setField("room_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No room</SelectItem>
                    {(referenceData.rooms ?? []).map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.building_name} - {room.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Delivery Mode</Label>
                <Select value={form.delivery_mode} onValueChange={(value) => setField("delivery_mode", value as CourseFormState["delivery_mode"])}>
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
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(event) => setField("capacity", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waitlist-capacity">Waitlist</Label>
                <Input
                  id="waitlist-capacity"
                  type="number"
                  min={0}
                  value={form.waitlist_capacity}
                  onChange={(event) => setField("waitlist_capacity", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registration-opens">Registration Opens</Label>
                <Input
                  id="registration-opens"
                  type="datetime-local"
                  value={form.registration_opens_at}
                  onChange={(event) => setField("registration_opens_at", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration-closes">Registration Closes</Label>
                <Input
                  id="registration-closes"
                  type="datetime-local"
                  value={form.registration_closes_at}
                  onChange={(event) => setField("registration_closes_at", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-notes">Schedule Notes</Label>
              <Textarea
                id="schedule-notes"
                value={form.schedule_notes}
                onChange={(event) => setField("schedule_notes", event.target.value)}
                placeholder="Extra scheduling notes for staff and faculty"
                rows={3}
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">Primary Meeting</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep one main meeting block here so the course shows up correctly in instructor and student schedules.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={form.meeting_day_of_week || "none"} onValueChange={(value) => setField("meeting_day_of_week", value === "none" ? "" : (value as CourseFormState["meeting_day_of_week"]))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No meeting</SelectItem>
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
                  <Label>Meeting Type</Label>
                  <Select value={form.meeting_type} onValueChange={(value) => setField("meeting_type", value as CourseFormState["meeting_type"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="office_hour">Office Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-start">Start Time</Label>
                  <Input id="meeting-start" type="time" value={form.meeting_start_time} onChange={(event) => setField("meeting_start_time", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-end">End Time</Label>
                  <Input id="meeting-end" type="time" value={form.meeting_end_time} onChange={(event) => setField("meeting_end_time", event.target.value)} />
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
            {mutation.isPending ? "Saving..." : offering ? "Save Changes" : "Create Offering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

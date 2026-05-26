import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Pencil, Trash2, X, Users as UsersIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  staffApi, coursesApi, facultyApi, semestersApi,
  type StaffOfferingOut, type OfferingCreatePayload,
} from "@/lib/api";

export default function AcademicOfferingsManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<StaffOfferingOut | null>(null);
  const [deleting, setDeleting] = useState<StaffOfferingOut | null>(null);

  const { data: offerings = [], isLoading } = useQuery({ queryKey: ["staff-course-offerings"], queryFn: staffApi.courseOfferings });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => staffApi.deleteOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-course-offerings"] });
      toast({ title: "Offering deleted" });
      setDeleting(null);
    },
    onError: (e: Error) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
      setDeleting(null);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return offerings.filter((o) => !q
      || (o.course_code ?? "").toLowerCase().includes(q)
      || (o.course_name ?? "").toLowerCase().includes(q)
      || (o.teacher_name ?? "").toLowerCase().includes(q)
      || (o.program_name ?? "").toLowerCase().includes(q));
  }, [offerings, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Course Offerings" description="Create and manage course → program → instructor mappings">
        <Button onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> New offering
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Total offerings" value={String(offerings.length)} />
        <Summary label="Active" value={String(offerings.filter((o) => o.status === "active").length)} tone="success" />
        <Summary label="Total enrollment" value={String(offerings.reduce((s, o) => s + (o.enrolled || 0), 0))} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course, program, instructor..." className="pl-9" />
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading offerings...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No offerings match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Program (major)</th>
                  <th className="px-4 py-3 text-left">Instructor</th>
                  <th className="px-4 py-3 text-left">Term</th>
                  <th className="px-4 py-3 text-center">Enrolled</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{o.course_code} {o.course_name}</p>
                      <p className="text-xs text-muted-foreground">{o.faculty_name}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{o.program_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.teacher_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{o.academic_period} · {o.academic_year}</td>
                    <td className="px-4 py-3 text-center font-mono">{o.enrolled}/{o.capacity}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={o.status === "active" && o.enrollment_open ? "success" : o.status === "full" ? "warning" : "danger"}>
                        {o.status === "active" && o.enrollment_open ? "Open" : o.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(o)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleting(o)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {composing && (
        <OfferingModal onClose={() => setComposing(false)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["staff-course-offerings"] });
          toast({ title: "Offering created" });
        }} />
      )}
      {editing && (
        <OfferingModal offering={editing} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["staff-course-offerings"] });
          toast({ title: "Offering updated" });
        }} />
      )}

      <ConfirmDialog
        open={deleting !== null}
        destructive
        title="Delete this offering?"
        confirmLabel="Yes, delete"
        loading={deleteMutation.isPending}
        description={deleting && (
          <div className="space-y-2">
            <p><strong className="text-foreground">{deleting.course_code} {deleting.course_name}</strong></p>
            <ul className="ml-4 list-disc text-xs">
              <li>Removes the offering, its timetable entries, and enrollments.</li>
              <li>This cannot be undone.</li>
              {(deleting.enrolled ?? 0) > 0 && (
                <li className="text-warning">⚠️ {deleting.enrolled} students are currently enrolled.</li>
              )}
            </ul>
          </div>
        )}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function OfferingModal({ offering, onClose, onSaved }: {
  offering?: StaffOfferingOut;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!offering;

  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: facultyApi.programs });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });
  const { data: instructors = [] } = useQuery({ queryKey: ["staff-instructors"], queryFn: staffApi.instructors });
  const activeSemester = semesters.find((s) => s.is_active);

  // For editing, we don't have all the linkage IDs from StaffOfferingOut, so prefer "create new"
  // for a clean form. Edit mode lets you adjust capacity / status / dates only via this UI.
  const [courseId, setCourseId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [instructorId, setInstructorId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>(activeSemester ? String(activeSemester.id) : "");
  const [academicYear, setAcademicYear] = useState(offering?.academic_year ?? "2025-2026");
  const [academicPeriod, setAcademicPeriod] = useState(offering?.academic_period ?? "Spring");
  const [capacity, setCapacity] = useState(String(offering?.capacity ?? 30));
  const [enrollmentOpen, setEnrollmentOpen] = useState(offering?.enrollment_open ?? true);
  const [status, setStatus] = useState(offering?.status ?? "active");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const body: OfferingCreatePayload = {
        course_id: Number(courseId),
        instructor_id: Number(instructorId),
        semester_id: Number(semesterId),
        program_id: Number(programId),
        academic_year: academicYear,
        academic_period: academicPeriod,
        capacity: Number(capacity),
        enrollment_open: enrollmentOpen,
        status,
      };
      return editing ? staffApi.updateOffering(offering!.id, body) : staffApi.createOffering(body);
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = courseId && programId && instructorId && semesterId && academicYear && academicPeriod && capacity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" /> {editing ? "Edit offering" : "New course offering"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {editing && (
          <p className="mb-4 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-foreground">
            Editing existing offering: <strong>{offering.course_code} {offering.course_name}</strong>. Select the current values for each picker — they don't auto-fill from the existing record.
          </p>
        )}

        <div className="space-y-4">
          <Field label="Course (catalog)">
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select course...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.credits} cr)</option>)}
            </select>
          </Field>

          <Field label="Program (major)">
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select program...</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </Field>

          <Field label="Instructor (professor)">
            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select instructor...</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}{i.department_name ? ` — ${i.department_name}` : ""}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground"><UsersIcon className="mr-1 inline h-3 w-3" />{instructors.length} instructor{instructors.length === 1 ? "" : "s"} available</p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester">
              <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select...</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (active)" : ""}</option>)}
              </select>
            </Field>
            <Field label="Capacity">
              <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Academic year">
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-2026" />
            </Field>
            <Field label="Academic period">
              <Input value={academicPeriod} onChange={(e) => setAcademicPeriod(e.target.value)} placeholder="Spring / Fall" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="active">Active</option>
                <option value="full">Full</option>
                <option value="cancelled">Cancelled</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Enrollment</span>
              <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <input type="checkbox" checked={enrollmentOpen} onChange={(e) => setEnrollmentOpen(e.target.checked)} />
                Open for student requests
              </label>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSave || save.isPending} onClick={() => { setError(null); save.mutate(); }}>
              {save.isPending ? "Saving..." : editing ? "Save changes" : "Create offering"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Summary({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" }) {
  const accent = tone === "success" ? "from-success/15 to-success/5" : "from-primary/10 to-primary/5";
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${accent} p-4 shadow-card`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

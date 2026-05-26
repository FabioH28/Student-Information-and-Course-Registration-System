import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Pencil, X, GraduationCap, ChevronRight, BookOpen, ClipboardList } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { studentsApi, staffApi, gradesApi, type StudentOut } from "@/lib/api";

const STATUSES = ["active", "suspended", "graduated", "withdrawn"];

export default function AcademicStudents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [editing, setEditing] = useState<StudentOut | null>(null);

  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: selections = [] } = useQuery({ queryKey: ["staff-course-selections"], queryFn: staffApi.courseSelections });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matches = !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matches && matchStatus;
    });
  }, [students, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    students.forEach((s) => { c[s.status] = (c[s.status] ?? 0) + 1; });
    return c;
  }, [students]);

  const openStudent = openId ? students.find((s) => s.id === openId) ?? null : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="All students enrolled in the institution" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Total" value={String(students.length)} />
        <Mini label="Active" value={String(counts.active ?? 0)} tone="success" />
        <Mini label="Graduated" value={String(counts.graduated ?? 0)} tone="info" />
        <Mini label="Suspended/Withdrawn" value={String((counts.suspended ?? 0) + (counts.withdrawn ?? 0))} tone="warning" />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..." className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading students...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No students match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-center">Semester</th>
                  <th className="px-4 py-3 text-right">GPA</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setOpenId(s.id)}>
                    <td className="px-4 py-3 font-medium text-foreground">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_code}</td>
                    <td className="px-4 py-3 text-center">{s.current_semester}</td>
                    <td className="px-4 py-3 text-right font-mono">{Number(s.gpa).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={s.status === "active" ? "success" : s.status === "graduated" ? "info" : "warning"}>{s.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditing(s); }}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }}>
                          <ChevronRight className="h-3.5 w-3.5" />
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

      {openStudent && (
        <StudentDetailDrawer
          student={openStudent}
          selections={selections.filter((sel) => sel.student_id === openStudent.id)}
          onClose={() => setOpenId(null)}
        />
      )}

      {editing && (
        <EditStudentModal student={editing} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["students"] });
          toast({ title: "Student updated" });
        }} />
      )}
    </div>
  );
}

function StudentDetailDrawer({ student, selections, onClose }: {
  student: StudentOut;
  selections: { id: number; course_code: string | null; course_name: string | null; status: string; selected_at: string }[];
  onClose: () => void;
}) {
  const { data: grades = [] } = useQuery({
    queryKey: ["staff-student-grades", student.user_id],
    queryFn: async () => {
      // /grades/me is student-only; we don't have a per-student endpoint here.
      // Pull all grades for offerings — fallback to empty.
      try { return await gradesApi.my(); } catch { return []; }
    },
    enabled: false, // keep light; deeper view lives in /staff/grades
  });
  void grades;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto border-l bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
              {(student.first_name?.[0] ?? "") + (student.last_name?.[0] ?? "")}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{student.first_name} {student.last_name}</h3>
              <p className="text-sm text-muted-foreground">{student.student_code} · Semester {student.current_semester}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="GPA" value={Number(student.gpa).toFixed(2)} />
          <Stat label="Semester" value={String(student.current_semester)} />
          <Stat label="Status" value={student.status} tone={student.status === "active" ? "success" : "warning"} />
        </div>

        <section className="mb-6">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><GraduationCap className="h-4 w-4" /> Personal</h4>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <KV label="Phone" value={student.phone ?? "—"} />
            <KV label="Date of birth" value={student.date_of_birth ?? "—"} />
            <KV label="Program" value={`#${student.program_id}`} />
          </dl>
        </section>

        <section className="mb-6">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><ClipboardList className="h-4 w-4" /> Subject Selections</h4>
          {selections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subject selections from this student.</p>
          ) : (
            <div className="space-y-2">
              {selections.map((sel) => (
                <div key={sel.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{sel.course_code ?? "—"} {sel.course_name ?? ""}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sel.selected_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge variant={sel.status === "approved" || sel.status === "enrolled" ? "success" : sel.status === "rejected" ? "danger" : "warning"}>
                    {sel.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="h-4 w-4" /> Detailed grades</h4>
          <p className="text-sm text-muted-foreground">
            Open the <span className="font-medium text-foreground">Grades</span> page from the sidebar to see published grades per course.
          </p>
        </section>
      </div>
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }: { student: StudentOut; onClose: () => void; onSaved: () => void }) {
  const [semester, setSemester] = useState(String(student.current_semester));
  const [status, setStatus] = useState(student.status);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => studentsApi.update(student.id, { current_semester: Number(semester), status }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><GraduationCap className="h-5 w-5 text-primary" /> Edit student</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{student.first_name} {student.last_name} · {student.student_code}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Current semester</Label>
            <Input type="number" min="1" max="12" value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => { setError(null); save.mutate(); }}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "info" | "warning" }) {
  const accent = tone === "success" ? "from-success/15 to-success/5"
    : tone === "info" ? "from-info/15 to-info/5"
    : tone === "warning" ? "from-warning/15 to-warning/5"
    : "from-primary/10 to-primary/5";
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${accent} p-4 shadow-card`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

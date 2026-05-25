import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Pencil, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, facultyApi, type CourseOut } from "@/lib/api";

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<CourseOut | null>(null);

  const { data: courses = [], isLoading } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: facultyApi.departments });

  const departmentMap = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);

  const del = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course deleted" });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [courses, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Course catalog">
        <Button onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> New course
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or name..." className="pl-9" />
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading courses...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No courses match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3 text-center">Prerequisite</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{departmentMap[c.department_id]?.name ?? `#${c.department_id}`}</td>
                    <td className="px-4 py-3 text-center font-mono">{c.credits}</td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">{c.prerequisite_course_id ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(c)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm(`Delete ${c.code}?`)) del.mutate(c.id); }}>
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
        <CourseModal courses={courses} departments={departments} onClose={() => setComposing(false)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          toast({ title: "Course created" });
        }} />
      )}
      {editing && (
        <CourseModal course={editing} courses={courses} departments={departments} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          toast({ title: "Course updated" });
        }} />
      )}
    </div>
  );
}

function CourseModal({ course, courses, departments, onClose, onSaved }: {
  course?: CourseOut;
  courses: CourseOut[];
  departments: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!course;
  const [code, setCode] = useState(course?.code ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [credits, setCredits] = useState(String(course?.credits ?? 3));
  const [departmentId, setDepartmentId] = useState(String(course?.department_id ?? (departments[0]?.id ?? "")));
  const [prereq, setPrereq] = useState(course?.prerequisite_course_id ? String(course.prerequisite_course_id) : "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code, name,
        description: description || null,
        credits: Number(credits),
        department_id: Number(departmentId),
        prerequisite_course_id: prereq ? Number(prereq) : null,
      };
      return editing ? coursesApi.update(course!.id, payload) : coursesApi.create(payload);
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = code && name && credits && departmentId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><BookOpen className="h-5 w-5 text-primary" /> {editing ? "Edit course" : "New course"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" /></Field>
            <Field label="Credits"><Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} /></Field>
          </div>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Field>
          <Field label="Department">
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select department...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Prerequisite (optional)">
            <select value={prereq} onChange={(e) => setPrereq(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">None</option>
              {courses.filter((c) => c.id !== course?.id).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSave || save.isPending} onClick={() => { setError(null); save.mutate(); }}>{save.isPending ? "Saving..." : "Save"}</Button>
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

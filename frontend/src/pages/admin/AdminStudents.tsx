import { useMemo, useState } from "react";
import { Search, GraduationCap, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useToast } from "@/hooks/use-toast";
import { studentsApi, type StudentOut } from "@/lib/api";

const STATUSES = ["active", "suspended", "graduated", "withdrawn"];

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<StudentOut | null>(null);

  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matches = !q
        || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
        || s.student_code.toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matches && matchStatus;
    });
  }, [students, search, statusFilter]);

  const pagination = usePagination(filtered, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Students</h2>
        <p className="text-sm text-muted-foreground">All enrolled students</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..." className="pl-9" />
        </div>
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </NativeSelect>
      </div>

      <section className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading students...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No students match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs font-medium text-muted-foreground">
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
                {pagination.pageItems.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_code}</td>
                    <td className="px-4 py-3 text-center">{s.current_semester}</td>
                    <td className="px-4 py-3 text-right font-mono">{Number(s.gpa).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={s.status === "active" ? "success" : s.status === "graduated" ? "info" : "warning"}>{s.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DataPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="students"
        />
      </section>

      {editing && (
        <EditStudentModal student={editing} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["students"] });
          toast({ title: "Student updated" });
        }} />
      )}
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }: { student: StudentOut; onClose: () => void; onSaved: () => void }) {
  const [semester, setSemester] = useState(String(student.current_semester));
  const [status, setStatus] = useState(student.status);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => studentsApi.update(student.id, {
      current_semester: Number(semester),
      status,
    }),
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
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </NativeSelect>
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

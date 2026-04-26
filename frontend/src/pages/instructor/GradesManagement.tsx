import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offeringsApi, registrationsApi, gradesApi, studentsApi, coursesApi, CourseOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function calcLetter(total: number): string {
  if (total >= 93) return "A";
  if (total >= 90) return "A-";
  if (total >= 87) return "B+";
  if (total >= 83) return "B";
  if (total >= 80) return "B-";
  if (total >= 77) return "C+";
  if (total >= 73) return "C";
  if (total >= 70) return "C-";
  if (total >= 60) return "D";
  return "F";
}

export default function GradesManagement() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [localGrades, setLocalGrades] = useState<Record<number, { midterm: string; assignment: string; final: string }>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: myOfferings = [] } = useQuery({
    queryKey: ["offerings-my"],
    queryFn: offeringsApi.my,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));
  const activeOfferingId = selectedOfferingId ?? myOfferings[0]?.id ?? null;

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-offering", activeOfferingId],
    queryFn: () => registrationsApi.list({ offering_id: activeOfferingId! }),
    enabled: activeOfferingId !== null,
  });

  const activeRegs = registrations.filter(r => r.status === "active");

  const { data: gradesList = [] } = useQuery({
    queryKey: ["grades-offering", activeOfferingId],
    queryFn: () => gradesApi.forOffering(activeOfferingId!),
    enabled: activeOfferingId !== null,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const gradeByRegId = Object.fromEntries(gradesList.map(g => [g.registration_id, g]));

  const saveMutation = useMutation({
    mutationFn: async ({ regId, offeringId, data }: { regId: number; offeringId: number; data: { midterm_score?: number; assignment_score?: number; final_score?: number } }) => {
      return gradesApi.upsert(offeringId, regId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades-offering", activeOfferingId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (regIds: number[]) => gradesApi.publish(regIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["grades-offering", activeOfferingId] });
      toast({ title: `Published ${data.published} grade(s)` });
    },
    onError: (err: Error) => {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    },
  });

  function handleSave(regId: number, offeringId: number) {
    const local = localGrades[regId];
    if (!local) return;
    const data: { midterm_score?: number; assignment_score?: number; final_score?: number } = {};
    if (local.midterm) data.midterm_score = Number(local.midterm);
    if (local.assignment) data.assignment_score = Number(local.assignment);
    if (local.final) data.final_score = Number(local.final);
    saveMutation.mutate({ regId, offeringId, data });
  }

  function handlePublishAll() {
    const regIds = activeRegs.map(r => r.id);
    if (regIds.length === 0) return;
    publishMutation.mutate(regIds);
  }

  const filtered = activeRegs.filter(r => {
    const student = studentMap[r.student_id];
    if (!student) return true;
    const name = `${student.first_name} ${student.last_name}`.toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Grades Management" description="Enter and publish student grades">
        <Button
          onClick={handlePublishAll}
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          disabled={publishMutation.isPending || activeRegs.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />{publishMutation.isPending ? "Publishing…" : "Publish All Grades"}
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={activeOfferingId ?? ""}
          onChange={e => { setSelectedOfferingId(Number(e.target.value)); setLocalGrades({}); }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm"
        >
          {myOfferings.map(o => {
            const course = courseMap[o.course_id];
            return (
              <option key={o.id} value={o.id}>
                {course?.code ?? `Offering #${o.id}`} — {course?.name ?? "—"}
              </option>
            );
          })}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-card text-xs text-muted-foreground flex gap-6">
        <span>Midterm: <strong className="text-foreground">30%</strong></span>
        <span>Assignments: <strong className="text-foreground">30%</strong></span>
        <span>Final Exam: <strong className="text-foreground">40%</strong></span>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Midterm (30%)", "Assignment (30%)", "Final (40%)", "Total", "Letter", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {myOfferings.length === 0 ? "No offerings assigned." : "No students enrolled."}
                  </td>
                </tr>
              ) : filtered.map((reg, i) => {
                const student = studentMap[reg.student_id];
                const existing = gradeByRegId[reg.id];
                const local = localGrades[reg.id] ?? { midterm: "", assignment: "", final: "" };
                const total = existing?.total_score ? Number(existing.total_score).toFixed(1) : null;
                const letter = existing?.letter_grade ?? null;
                const isPublished = existing?.is_published ?? false;

                return (
                  <motion.tr key={reg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student ? `${student.first_name} ${student.last_name}` : `Student #${reg.student_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} max={100} placeholder={existing?.midterm_score ? String(existing.midterm_score) : "0–100"}
                        value={local.midterm}
                        onChange={e => setLocalGrades(p => ({ ...p, [reg.id]: { ...local, midterm: e.target.value } }))}
                        className="w-20 h-8 text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} max={100} placeholder={existing?.assignment_score ? String(existing.assignment_score) : "0–100"}
                        value={local.assignment}
                        onChange={e => setLocalGrades(p => ({ ...p, [reg.id]: { ...local, assignment: e.target.value } }))}
                        className="w-20 h-8 text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} max={100} placeholder={existing?.final_score ? String(existing.final_score) : "0–100"}
                        value={local.final}
                        onChange={e => setLocalGrades(p => ({ ...p, [reg.id]: { ...local, final: e.target.value } }))}
                        className="w-20 h-8 text-sm" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{total ?? "—"}</td>
                    <td className="px-4 py-3">
                      {letter ? (
                        <StatusBadge variant={letter.startsWith("A") ? "success" : letter.startsWith("B") ? "info" : letter.startsWith("C") ? "warning" : "danger"}>
                          {letter}
                        </StatusBadge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={isPublished ? "success" : "warning"}>
                        {isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(reg.id, activeOfferingId!)}
                        disabled={saveMutation.isPending || !localGrades[reg.id]}
                        className="text-xs"
                      >
                        Save
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

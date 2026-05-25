import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationsApi, gradesApi, studentsApi, materialApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SCORE_FIELD: Record<string, keyof import("@/lib/api").GradeOut> = {
  midterm: "midterm_score",
  final_exam: "final_exam_score",
  project: "project_score",
  assignments: "assignment_score",
  quizzes: "quiz_score",
  attendance: "attendance_score",
  participation: "participation_score",
  lab_work: "lab_work_score",
};

function calcFinalGrade(total: number): { grade: number; status: "passed" | "failed" } {
  if (total < 45) return { grade: 4, status: "failed" };
  if (total <= 54) return { grade: 5, status: "passed" };
  if (total <= 64) return { grade: 6, status: "passed" };
  if (total <= 74) return { grade: 7, status: "passed" };
  if (total <= 84) return { grade: 8, status: "passed" };
  if (total <= 94) return { grade: 9, status: "passed" };
  return { grade: 10, status: "passed" };
}

export default function GradesManagement({ initialOfferingId }: { initialOfferingId?: number } = {}) {
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [programStudyLevel, setProgramStudyLevel] = useState("");
  const [academicYearSemester, setAcademicYearSemester] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(initialOfferingId ?? null);
  const [search, setSearch] = useState("");
  const [localGrades, setLocalGrades] = useState<Record<number, Record<string, string>>>({});
  const [configDraft, setConfigDraft] = useState<Record<string, { label: string; selected: boolean; points: string }>>({});
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: filters } = useQuery({ queryKey: ["teacher-grades-filters"], queryFn: materialApi.getTeacherMaterialFilters });
  const selectedProgramStudy = filters?.programStudyLevels.find((item) => item.id === programStudyLevel);
  const programStudyOptions = useMemo(() => (filters?.programStudyLevels ?? []).filter((item) => !facultyId || item.faculty_id === facultyId), [filters, facultyId]);
  const { data: termsResult, isLoading: termsLoading } = useQuery({
    queryKey: ["teacher-grades-terms", facultyId, programStudyLevel],
    queryFn: () => materialApi.getTeacherMaterialTerms({
      faculty_id: facultyId!,
      program_id: selectedProgramStudy!.program_id,
      study_level: selectedProgramStudy!.study_level,
    }),
    enabled: Boolean(facultyId && selectedProgramStudy),
  });
  const terms = termsResult?.terms ?? [];
  const selectedYearSemester = terms.find((item) => item.value === academicYearSemester);
  const { data: myOfferings = [] } = useQuery({
    queryKey: ["teacher-grades-courses", facultyId, programStudyLevel, academicYearSemester],
    queryFn: async () => (await materialApi.getTeacherMaterialCourses({
      faculty_id: facultyId!,
      program_id: selectedProgramStudy!.program_id,
      study_level: selectedProgramStudy!.study_level,
      academic_year: selectedYearSemester!.academic_year_name,
      semester_id: selectedYearSemester!.semester_id,
    })).map((offering) => ({ ...offering, id: offering.course_offering_id })),
    enabled: Boolean(facultyId && selectedProgramStudy && selectedYearSemester),
  });

  const activeOfferingId = selectedOfferingId;
  const courseMap = Object.fromEntries(myOfferings.map((offering) => [offering.course_id, { code: offering.course_code, name: offering.course_name }]));

  useEffect(() => {
    if (!selectedOfferingId && myOfferings.length > 0) {
      setSelectedOfferingId(myOfferings[0].course_offering_id);
    }
  }, [myOfferings, selectedOfferingId]);

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

  const { data: gradeConfig } = useQuery({
    queryKey: ["grade-config", activeOfferingId],
    queryFn: () => gradesApi.configuration(activeOfferingId!),
    enabled: activeOfferingId !== null,
  });

  useEffect(() => {
    if (!gradeConfig) return;
    setConfigDraft(Object.fromEntries(gradeConfig.components.map((item) => [item.key, { label: item.label, selected: item.selected, points: item.points ? String(item.points) : "" }])));
  }, [gradeConfig]);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const gradeByRegId = Object.fromEntries(gradesList.map(g => [g.registration_id, g]));

  const saveMutation = useMutation({
    mutationFn: async ({ regId, offeringId, data }: { regId: number; offeringId: number; data: Record<string, number> }) => {
      return gradesApi.upsert(offeringId, regId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grades-offering", activeOfferingId] });
      setSavedRows((current) => new Set(current).add(variables.regId));
      window.setTimeout(() => setSavedRows((current) => {
        const next = new Set(current);
        next.delete(variables.regId);
        return next;
      }), 1800);
      toast({ title: "Grade saved and published to the student." });
    },
    onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const configMutation = useMutation({
    mutationFn: () => gradesApi.saveConfiguration(activeOfferingId!, Object.entries(configDraft).map(([key, value]) => ({
      key,
      label: value.label,
      selected: value.selected,
      points: value.selected ? Number(value.points) : 0,
    }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-config", activeOfferingId] });
      queryClient.invalidateQueries({ queryKey: ["grades-offering", activeOfferingId] });
      toast({ title: "Grading configuration saved" });
    },
    onError: (err: Error) => toast({ title: "Configuration failed", description: err.message, variant: "destructive" }),
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
    if (gradeByRegId[regId]?.exam_blocked_due_to_absence) {
      toast({ title: "Grade blocked", description: "Exam blocked — absences over 15%", variant: "destructive" });
      return;
    }
    const local = localGrades[regId] ?? {};
    const selectedComponents = (gradeConfig?.components ?? []).filter((item) => item.selected && item.points > 0);
    const data: Record<string, number> = {};
    for (const component of selectedComponents) {
      const field = SCORE_FIELD[component.key] as string;
      const value = local[component.key];
      if (value !== undefined && value !== "") data[field] = Number(value);
      if ((data[field] ?? 0) < 0 || (data[field] ?? 0) > component.points) {
        toast({ title: "Invalid score", description: `${component.label} must be between 0 and ${component.points}.`, variant: "destructive" });
        return;
      }
    }
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
    const code = student.student_code.toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || code.includes(q);
  });
  const selectedComponents = (gradeConfig?.components ?? []).filter((item) => item.selected && item.points > 0);
  const configTotal = Object.values(configDraft).reduce((sum, item) => sum + (item.selected ? Number(item.points || 0) : 0), 0);
  const configValid = configTotal === 100 && Object.values(configDraft).some((item) => item.selected) && Object.values(configDraft).every((item) => !item.selected || Number(item.points) > 0);

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

      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-card md:grid-cols-2 xl:grid-cols-5">
        <select value={facultyId ?? ""} onChange={e => { setFacultyId(e.target.value ? Number(e.target.value) : null); setProgramStudyLevel(""); setAcademicYearSemester(""); setSelectedOfferingId(null); setLocalGrades({}); }} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
          <option value="">Faculty</option>
          {filters?.faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={programStudyLevel} onChange={e => { setProgramStudyLevel(e.target.value); setAcademicYearSemester(""); setSelectedOfferingId(null); setLocalGrades({}); }} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground" disabled={!facultyId}>
          <option value="">Program & Study Level</option>
          {programStudyOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select value={academicYearSemester} onChange={e => { setAcademicYearSemester(e.target.value); setSelectedOfferingId(null); setLocalGrades({}); }} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground" disabled={!programStudyLevel}>
          <option value="">{termsLoading ? "Loading terms..." : "Academic Year & Semester"}</option>
          {terms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select
          value={activeOfferingId ?? ""}
          onChange={e => { setSelectedOfferingId(e.target.value ? Number(e.target.value) : null); setLocalGrades({}); }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm"
          disabled={!academicYearSemester}
        >
          <option value="">Course</option>
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
        <span>Final grade is calculated out of <strong className="text-foreground">100 points</strong>.</span>
        <span>Pass minimum: <strong className="text-foreground">45</strong></span>
      </div>

      {activeOfferingId && (
        <section className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Grading Structure</h3>
              <p className="text-sm text-muted-foreground">Choose only the components used for this course. Total must equal 100.</p>
            </div>
            <div className={`text-sm font-medium ${configTotal === 100 ? "text-emerald-600" : "text-destructive"}`}>Total: {configTotal} / 100</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(configDraft).map(([key, item]) => (
              <label key={key} className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm">
                <input type="checkbox" checked={item.selected} onChange={(event) => setConfigDraft((prev) => ({ ...prev, [key]: { ...item, selected: event.target.checked, points: event.target.checked ? item.points : "" } }))} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.selected && <Input type="number" min={0} max={100} value={item.points} onChange={(event) => setConfigDraft((prev) => ({ ...prev, [key]: { ...item, points: event.target.value } }))} className="h-8 w-20" />}
              </label>
            ))}
          </div>
          {configTotal !== 100 && <p className="mt-3 text-sm text-destructive">Total grading points must equal 100. Current total: {configTotal}.</p>}
          <Button className="mt-4" onClick={() => configMutation.mutate()} disabled={!configValid || configMutation.isPending}>Save Grading Structure</Button>
        </section>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", ...selectedComponents.map((component) => `${component.label} /${component.points}`), "Total /100", "Final Grade", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={selectedComponents.length + 4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {!activeOfferingId ? "Select filters to load data." : "No students approved for this course."}
                  </td>
                </tr>
              ) : filtered.map((reg, i) => {
                const student = studentMap[reg.student_id];
                const existing = gradeByRegId[reg.id];
                const local = localGrades[reg.id] ?? {};
                const liveTotal = selectedComponents.reduce((sum, component) => {
                  const existingValue = Number(existing?.[SCORE_FIELD[component.key]] ?? 0);
                  return sum + (local[component.key] ? Number(local[component.key]) : existingValue);
                }, 0);
                const liveGrade = calcFinalGrade(liveTotal);
                const total = existing?.total_score ? Number(existing.total_score).toFixed(1) : null;
                const finalGrade = existing?.final_grade ?? null;
                const blocked = Boolean(existing?.exam_blocked_due_to_absence);

                return (
                  <motion.tr key={reg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student ? `${student.first_name} ${student.last_name}` : `Student #${reg.student_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                    </td>
                    {selectedComponents.map((component) => (
                      <td key={component.key} className="px-4 py-3">
                        <Input type="number" min={0} max={component.points} disabled={blocked} placeholder={blocked ? "Blocked" : existing?.[SCORE_FIELD[component.key]] ? String(existing[SCORE_FIELD[component.key]]) : `0-${component.points}`}
                          value={local[component.key] ?? ""}
                          onChange={e => setLocalGrades(p => ({ ...p, [reg.id]: { ...local, [component.key]: e.target.value } }))}
                          className="w-20 h-8 text-sm" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{localGrades[reg.id] ? liveTotal.toFixed(1) : total ?? "—"}</td>
                    <td className="px-4 py-3">
                      {finalGrade || localGrades[reg.id] ? (
                        <StatusBadge variant={(finalGrade ?? liveGrade.grade) >= 8 ? "success" : (finalGrade ?? liveGrade.grade) >= 5 ? "info" : "danger"}>
                          {finalGrade ?? liveGrade.grade}
                        </StatusBadge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(reg.id, activeOfferingId!)}
                        disabled={blocked || saveMutation.isPending || !localGrades[reg.id]}
                        className={`text-xs ${savedRows.has(reg.id) ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                      >
                        {savedRows.has(reg.id) ? "Saved" : "Save"}
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

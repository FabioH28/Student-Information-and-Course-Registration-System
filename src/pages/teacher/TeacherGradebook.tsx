import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, ClipboardList, GraduationCap, Plus, Sigma } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet, apiPost } from "@/lib/api";
import { formatDateTime, titleize } from "@/lib/formatters";
import { toast } from "@/components/ui/use-toast";
import { getTeachingApiBase, getTeachingQueryScope, getTeachingWorkspaceLabel } from "@/lib/teaching-workspace";

interface TeacherGradebookResponse {
  summary: {
    grade_components: number;
    graded_records: number;
    published_final_grades: number;
  };
  offerings: Array<{
    offering_id: number;
    code: string;
    title: string;
    section_code: string;
    component_count: number;
    graded_records: number;
    published_final_grades: number;
  }>;
  components: Array<{
    component_id: number;
    offering_id: number;
    name: string;
    component_type: string;
    max_points: number;
    weight_percentage: number;
    due_at: string | null;
    sort_order: number;
    is_published: boolean;
  }>;
}

interface TeacherStudentsResponse {
  items: Array<{
    enrollment_id: number;
    offering_id: number;
    student_id: number;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    course_code: string;
    course_title: string;
    section_code: string;
    enrollment_status: string;
    numeric_grade: number | null;
    letter_grade: string | null;
  }>;
}

interface ComponentFormState {
  offering_id: string;
  name: string;
  component_type: string;
  max_points: string;
  weight_percentage: string;
  due_at: string;
}

function getDefaultComponentForm(): ComponentFormState {
  return {
    offering_id: "",
    name: "",
    component_type: "assignment",
    max_points: "100",
    weight_percentage: "10",
    due_at: "",
  };
}

export default function TeacherGradebook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [finalDialogOpen, setFinalDialogOpen] = useState(false);
  const [componentForm, setComponentForm] = useState<ComponentFormState>(getDefaultComponentForm);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [selectedFinalOfferingId, setSelectedFinalOfferingId] = useState<string>("");
  const [scoreMap, setScoreMap] = useState<Record<number, string>>({});
  const [finalGradeMap, setFinalGradeMap] = useState<Record<number, string>>({});
  const apiBase = getTeachingApiBase(user?.primary_role);
  const queryScope = getTeachingQueryScope(user?.primary_role);
  const workspaceLabel = getTeachingWorkspaceLabel(user?.primary_role);

  const gradebookQuery = useQuery({
    queryKey: [queryScope, "grades"],
    queryFn: () => apiGet<TeacherGradebookResponse>(`${apiBase}/grades`),
  });

  const studentsQuery = useQuery({
    queryKey: [queryScope, "students"],
    queryFn: () => apiGet<TeacherStudentsResponse>(`${apiBase}/students`),
  });

  const offerings = useMemo(() => gradebookQuery.data?.offerings ?? [], [gradebookQuery.data?.offerings]);
  const components = useMemo(() => gradebookQuery.data?.components ?? [], [gradebookQuery.data?.components]);
  const students = useMemo(() => studentsQuery.data?.items ?? [], [studentsQuery.data?.items]);

  useEffect(() => {
    if (componentDialogOpen && !componentForm.offering_id && offerings.length > 0) {
      setComponentForm((current) => ({ ...current, offering_id: String(offerings[0].offering_id) }));
    }
  }, [componentDialogOpen, componentForm.offering_id, offerings]);

  useEffect(() => {
    if (scoreDialogOpen && !selectedComponentId && components.length > 0) {
      setSelectedComponentId(String(components[0].component_id));
    }
  }, [scoreDialogOpen, selectedComponentId, components]);

  useEffect(() => {
    if (finalDialogOpen && !selectedFinalOfferingId && offerings.length > 0) {
      setSelectedFinalOfferingId(String(offerings[0].offering_id));
    }
  }, [finalDialogOpen, selectedFinalOfferingId, offerings]);

  const selectedComponent = useMemo(
    () => components.find((component) => String(component.component_id) === selectedComponentId) ?? null,
    [components, selectedComponentId],
  );

  const selectedComponentStudents = useMemo(() => {
    if (!selectedComponent) {
      return [];
    }
    return students.filter((student) => student.offering_id === selectedComponent.offering_id);
  }, [selectedComponent, students]);

  const selectedFinalStudents = useMemo(() => {
    if (!selectedFinalOfferingId) {
      return [];
    }
    return students.filter((student) => String(student.offering_id) === selectedFinalOfferingId);
  }, [selectedFinalOfferingId, students]);

  const createComponentMutation = useMutation({
    mutationFn: async () => {
      if (!componentForm.offering_id || !componentForm.name.trim()) {
        throw new Error("Offering and component name are required.");
      }

      await apiPost(`${apiBase}/grades/components`, {
        offering_id: Number(componentForm.offering_id),
        name: componentForm.name.trim(),
        component_type: componentForm.component_type,
        max_points: Number(componentForm.max_points),
        weight_percentage: Number(componentForm.weight_percentage),
        due_at: componentForm.due_at ? new Date(componentForm.due_at).toISOString() : null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryScope, "grades"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "dashboard"] }),
      ]);
      toast({
        title: "Component created",
        description: "The new grade component is ready for scoring.",
      });
      setComponentDialogOpen(false);
      setComponentForm(getDefaultComponentForm());
    },
    onError: (error) => {
      toast({
        title: "Unable to create component",
        description: error instanceof Error ? error.message : "The grade component could not be created.",
      });
    },
  });

  const saveScoresMutation = useMutation({
    mutationFn: async () => {
      if (!selectedComponentId || !selectedComponent) {
        throw new Error("Select a component first.");
      }

      const records = selectedComponentStudents
        .filter((student) => scoreMap[student.student_id] !== undefined && scoreMap[student.student_id] !== "")
        .map((student) => ({
          student_id: student.student_id,
          score_awarded: Number(scoreMap[student.student_id]),
          publish: selectedComponent.is_published,
        }));

      if (records.length === 0) {
        throw new Error("Enter at least one score before saving.");
      }

      await apiPost(`${apiBase}/grades/components/${selectedComponent.component_id}/scores`, {
        records,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryScope, "grades"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "students"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "dashboard"] }),
      ]);
      toast({
        title: "Scores saved",
        description: "The component scores were recorded successfully.",
      });
      setScoreDialogOpen(false);
      setScoreMap({});
    },
    onError: (error) => {
      toast({
        title: "Unable to save scores",
        description: error instanceof Error ? error.message : "The component scores could not be recorded.",
      });
    },
  });

  const publishFinalGradesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFinalOfferingId) {
        throw new Error("Select an offering first.");
      }

      const grades = selectedFinalStudents
        .filter((student) => finalGradeMap[student.enrollment_id] !== undefined && finalGradeMap[student.enrollment_id] !== "")
        .map((student) => ({
          enrollment_id: student.enrollment_id,
          numeric_grade: Number(finalGradeMap[student.enrollment_id]),
        }));

      if (grades.length === 0) {
        throw new Error("Enter at least one final grade before publishing.");
      }

      await apiPost(`${apiBase}/grades/final-grades/publish`, {
        offering_id: Number(selectedFinalOfferingId),
        grades,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryScope, "grades"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "students"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "dashboard"] }),
      ]);
      toast({
        title: "Final grades published",
        description: "Student final grades are now available through the live records.",
      });
      setFinalDialogOpen(false);
      setFinalGradeMap({});
    },
    onError: (error) => {
      toast({
        title: "Unable to publish finals",
        description: error instanceof Error ? error.message : "The final grades could not be published.",
      });
    },
  });

  if (gradebookQuery.isLoading || studentsQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (gradebookQuery.isError) {
    return (
      <ErrorState
        description={gradebookQuery.error instanceof Error ? gradebookQuery.error.message : "Gradebook data could not be loaded."}
        onRetry={() => void gradebookQuery.refetch()}
      />
    );
  }

  if (studentsQuery.isError) {
    return (
      <ErrorState
        description={studentsQuery.error instanceof Error ? studentsQuery.error.message : "Student roster could not be loaded for grading."}
        onRetry={() => void studentsQuery.refetch()}
      />
    );
  }

  const data = gradebookQuery.data;
  if (!data) {
    return <EmptyState title="No gradebook data" description={`Gradebook data will appear when ${workspaceLabel} course offerings exist.`} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Grade Components" value={data.summary.grade_components} icon={BookOpen} variant="primary" />
          <StatCard title="Graded Records" value={data.summary.graded_records} icon={ClipboardList} variant="info" />
          <StatCard title="Published Finals" value={data.summary.published_final_grades} icon={CheckCircle2} variant="success" />
          <StatCard title="Tracked Offerings" value={data.offerings.length} icon={GraduationCap} variant="warning" />
        </div>
        <div className="flex flex-wrap gap-2 sm:self-start">
          <Button variant="outline" onClick={() => setScoreDialogOpen(true)} disabled={components.length === 0}>
            <Sigma className="mr-2 h-4 w-4" /> Record Scores
          </Button>
          <Button variant="outline" onClick={() => setFinalDialogOpen(true)} disabled={offerings.length === 0}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Publish Finals
          </Button>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setComponentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Component
          </Button>
        </div>
      </div>

      {data.offerings.length === 0 ? (
        <EmptyState
          title="No grading activity yet"
          description={`The gradebook workspace is in place. Once the ${workspaceLabel} workspace has offerings, scoring and final grade publishing can happen here.`}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.offerings.map((offering) => {
            const offeringComponents = data.components.filter((component) => component.offering_id === offering.offering_id);

            return (
              <div key={offering.offering_id} className="rounded-xl border bg-card p-5 shadow-card">
                <p className="font-mono text-xs text-muted-foreground">
                  {offering.code} - Section {offering.section_code}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{offering.title}</h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Components</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{offering.component_count}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Graded</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{offering.graded_records}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Published Finals</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{offering.published_final_grades}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Components</p>
                  {offeringComponents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No components defined yet.</p>
                  ) : (
                    offeringComponents.map((component) => (
                      <div key={component.component_id} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {titleize(component.component_type)} - {component.max_points} pts - {component.weight_percentage}%
                            </p>
                            {component.due_at && <p className="mt-1 text-xs text-muted-foreground">Due {formatDateTime(component.due_at)}</p>}
                          </div>
                          <StatusBadge variant={component.is_published ? "success" : "default"}>
                            {component.is_published ? "Published" : "Draft"}
                          </StatusBadge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Grade Component</DialogTitle>
            <DialogDescription>Define a component so instructors or academic staff can record scores against a specific offering.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="component-offering">Offering</Label>
              <select
                id="component-offering"
                value={componentForm.offering_id}
                onChange={(event) => setComponentForm((current) => ({ ...current, offering_id: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select an offering</option>
                {offerings.map((offering) => (
                  <option key={offering.offering_id} value={offering.offering_id}>
                    {offering.code} - Section {offering.section_code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-name">Name</Label>
              <Input
                id="component-name"
                value={componentForm.name}
                onChange={(event) => setComponentForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Midterm, Lab 1, Quiz 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-type">Type</Label>
              <select
                id="component-type"
                value={componentForm.component_type}
                onChange={(event) => setComponentForm((current) => ({ ...current, component_type: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["assignment", "quiz", "midterm", "final", "project", "lab", "participation", "attendance", "custom"].map((type) => (
                  <option key={type} value={type}>
                    {titleize(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-due-at">Due At</Label>
              <Input
                id="component-due-at"
                type="datetime-local"
                value={componentForm.due_at}
                onChange={(event) => setComponentForm((current) => ({ ...current, due_at: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-points">Max Points</Label>
              <Input
                id="component-points"
                type="number"
                min={1}
                value={componentForm.max_points}
                onChange={(event) => setComponentForm((current) => ({ ...current, max_points: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-weight">Weight %</Label>
              <Input
                id="component-weight"
                type="number"
                min={1}
                max={100}
                value={componentForm.weight_percentage}
                onChange={(event) => setComponentForm((current) => ({ ...current, weight_percentage: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setComponentDialogOpen(false)} disabled={createComponentMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => createComponentMutation.mutate()}
              disabled={createComponentMutation.isPending}
            >
              {createComponentMutation.isPending ? "Creating..." : "Create Component"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Component Scores</DialogTitle>
            <DialogDescription>Choose a component and record student scores against its configured maximum.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="score-component">Component</Label>
            <select
              id="score-component"
              value={selectedComponentId}
              onChange={(event) => setSelectedComponentId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a component</option>
              {components.map((component) => {
                const offering = offerings.find((item) => item.offering_id === component.offering_id);
                return (
                  <option key={component.component_id} value={component.component_id}>
                    {offering?.code || "Course"} - {component.name}
                  </option>
                );
              })}
            </select>
          </div>

          {!selectedComponent ? (
            <EmptyState title="No component selected" description="Pick a component first to enter scores." />
          ) : selectedComponentStudents.length === 0 ? (
            <EmptyState title="No roster found" description="This component does not have enrolled students yet." />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Student", "Email", "Score"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedComponentStudents.map((student) => (
                      <tr key={student.enrollment_id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.student_number}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            max={selectedComponent.max_points}
                            value={scoreMap[student.student_id] ?? ""}
                            onChange={(event) =>
                              setScoreMap((current) => ({
                                ...current,
                                [student.student_id]: event.target.value,
                              }))
                            }
                            placeholder={`0 - ${selectedComponent.max_points}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScoreDialogOpen(false)} disabled={saveScoresMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => saveScoresMutation.mutate()}
              disabled={saveScoresMutation.isPending || !selectedComponent}
            >
              {saveScoresMutation.isPending ? "Saving..." : "Save Scores"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalDialogOpen} onOpenChange={setFinalDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish Final Grades</DialogTitle>
            <DialogDescription>Enter final numeric grades for an offering. The backend will publish letter grades and grade points automatically.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="final-offering">Offering</Label>
            <select
              id="final-offering"
              value={selectedFinalOfferingId}
              onChange={(event) => setSelectedFinalOfferingId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an offering</option>
              {offerings.map((offering) => (
                <option key={offering.offering_id} value={offering.offering_id}>
                  {offering.code} - Section {offering.section_code}
                </option>
              ))}
            </select>
          </div>

          {selectedFinalStudents.length === 0 ? (
            <EmptyState title="No students to grade" description="This offering has no enrolled students available for final grade publishing." />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Student", "Current Final", "Numeric Grade"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedFinalStudents.map((student) => (
                      <tr key={student.enrollment_id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.student_number}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {student.letter_grade ? `${student.letter_grade} (${student.numeric_grade ?? "-"})` : "Not published"}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={finalGradeMap[student.enrollment_id] ?? ""}
                            onChange={(event) =>
                              setFinalGradeMap((current) => ({
                                ...current,
                                [student.enrollment_id]: event.target.value,
                              }))
                            }
                            placeholder="0 - 100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFinalDialogOpen(false)} disabled={publishFinalGradesMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => publishFinalGradesMutation.mutate()}
              disabled={publishFinalGradesMutation.isPending || !selectedFinalOfferingId}
            >
              {publishFinalGradesMutation.isPending ? "Publishing..." : "Publish Final Grades"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

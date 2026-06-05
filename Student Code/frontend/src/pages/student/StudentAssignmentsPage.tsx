import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, coursesApi, materialApi, offeringsApi, registrationsApi } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState, WeekSelector, WeeklyTopicCard } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function deadlinePassed(date?: string | null, time?: string | null) {
  if (!date) return false;
  return new Date() > new Date(`${date}T${time || "23:59"}`);
}

export default function StudentAssignmentsPage() {
  const [offeringId, setOfferingId] = useState<number | null>(null);
  const [week, setWeek] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => offeringsApi.list() });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const myOfferingIds = new Set(registrations.filter((reg) => reg.status === "active").map((reg) => reg.offering_id));
  const myOfferings = offerings.filter((offering) => myOfferingIds.has(offering.id));
  const { data: topic } = useQuery({ queryKey: ["student-topic", offeringId, week], queryFn: () => materialApi.getStudentTopic(offeringId!, week), enabled: Boolean(offeringId) });
  const { data: assignments = [], isLoading, error } = useQuery({ queryKey: ["student-assignments-page", offeringId, week], queryFn: () => assignmentsApi.studentList(offeringId!, week), enabled: Boolean(offeringId) });
  const submitMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => assignmentsApi.submit(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments-page", offeringId, week] });
      toast({ title: "Assignment submitted" });
    },
    onError: (err: Error) => toast({ title: "Submission failed", description: err.message, variant: "destructive" }),
  });
  function submit(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    submitMutation.mutate({ id, form: new FormData(e.currentTarget) });
  }
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Assignments" description="Weekly assignments for your enrolled courses" />
      <section className="rounded-lg border bg-card p-4 shadow-card">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <select value={offeringId ?? ""} onChange={(e) => setOfferingId(e.target.value ? Number(e.target.value) : null)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Select course</option>
            {myOfferings.map((offering) => {
              const course = courses.find((item) => item.id === offering.course_id);
              return <option key={offering.id} value={offering.id}>{course ? `${course.code} - ${course.name}` : `Offering #${offering.id}`}</option>;
            })}
          </select>
          <WeekSelector value={week} onChange={setWeek} />
        </div>
      </section>
      <section className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
        {offeringId && <WeeklyTopicCard week={week} topic={topic} />}
        {!offeringId ? <EmptyState label="Select a course and week to see assignments." /> : isLoading ? <LoadingState label="Loading assignments..." /> : error ? <ErrorState message={(error as Error).message} /> : assignments.length === 0 ? <EmptyState label={`No published assignments for Week ${week}.`} /> : assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-lg border bg-background p-4">
            <h4 className="font-medium">{assignment.title}</h4>
            {assignment.description && <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>}
            {assignment.instructions && <p className="mt-2 text-sm text-muted-foreground">{assignment.instructions}</p>}
            <p className="mt-2 text-xs text-muted-foreground">Due {assignment.due_date ?? "-"} {assignment.due_time ?? ""} · {assignment.max_points}/100 max</p>
            {assignment.my_submission && <p className="mt-2 text-sm text-muted-foreground">Submitted · {assignment.my_submission.status}{assignment.my_submission.score != null ? ` · Score ${assignment.my_submission.score}` : ""}{assignment.my_submission.feedback ? ` · ${assignment.my_submission.feedback}` : ""}</p>}
            {deadlinePassed(assignment.due_date, assignment.due_time) ? (
              <p className="mt-3 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">Deadline passed</p>
            ) : (
              <form onSubmit={(event) => submit(event, assignment.id)} className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_14rem_auto]">
                <Textarea name="submitted_text" placeholder="Submission note" rows={2} />
                <Input name="file" type="file" />
                <Button type="submit" disabled={submitMutation.isPending}>Submit</Button>
              </form>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

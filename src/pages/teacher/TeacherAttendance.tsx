import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Plus, TriangleAlert, Users } from "lucide-react";

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
import { formatDate, titleize } from "@/lib/formatters";
import { toast } from "@/components/ui/use-toast";
import { getTeachingApiBase, getTeachingQueryScope, getTeachingWorkspaceLabel } from "@/lib/teaching-workspace";

interface TeacherAttendanceResponse {
  summary: {
    total_sessions: number;
    today_sessions: number;
    recorded_marks: number;
    absences_logged: number;
  };
  offerings: Array<{
    offering_id: number;
    code: string;
    title: string;
    section_code: string;
    status: string;
    enrolled_count: number;
  }>;
  recent_sessions: Array<{
    session_id: number;
    offering_id: number;
    code: string;
    title: string;
    section_code: string;
    session_date: string;
    topic: string | null;
    status: string;
    recorded_students: number;
    absent_students: number;
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
  }>;
}

function getVariant(status: string) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "scheduled") {
    return "warning" as const;
  }

  return "default" as const;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(todayValue());
  const [topic, setTopic] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, "present" | "absent" | "late" | "excused">>({});
  const apiBase = getTeachingApiBase(user?.primary_role);
  const queryScope = getTeachingQueryScope(user?.primary_role);
  const workspaceLabel = getTeachingWorkspaceLabel(user?.primary_role);

  const attendanceQuery = useQuery({
    queryKey: [queryScope, "attendance"],
    queryFn: () => apiGet<TeacherAttendanceResponse>(`${apiBase}/attendance`),
  });

  const rosterQuery = useQuery({
    queryKey: [queryScope, "students"],
    queryFn: () => apiGet<TeacherStudentsResponse>(`${apiBase}/students`),
  });

  const offerings = attendanceQuery.data?.offerings ?? [];
  const rosterItems = rosterQuery.data?.items ?? [];

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (!selectedOfferingId && offerings.length > 0) {
      setSelectedOfferingId(String(offerings[0].offering_id));
    }
  }, [dialogOpen, offerings, selectedOfferingId]);

  const selectedOfferingRoster = useMemo(
    () => rosterItems.filter((student) => String(student.offering_id) === selectedOfferingId),
    [rosterItems, selectedOfferingId],
  );

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    setAttendanceMap((current) => {
      const next: Record<number, "present" | "absent" | "late" | "excused"> = {};
      for (const student of selectedOfferingRoster) {
        next[student.student_id] = current[student.student_id] ?? "present";
      }
      return next;
    });
  }, [dialogOpen, selectedOfferingRoster]);

  const attendanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOfferingId) {
        throw new Error("Select a course offering first.");
      }

      if (selectedOfferingRoster.length === 0) {
        throw new Error("There are no enrolled students in this offering yet.");
      }

      const session = await apiPost<{ session_id: number }>(`${apiBase}/attendance/sessions`, {
        offering_id: Number(selectedOfferingId),
        session_date: sessionDate,
        topic: topic.trim() || null,
        status: "completed",
      });

      await apiPost(`${apiBase}/attendance/sessions/${session.session_id}/records`, {
        records: selectedOfferingRoster.map((student) => ({
          student_id: student.student_id,
          status: attendanceMap[student.student_id] ?? "present",
        })),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryScope, "attendance"] }),
        queryClient.invalidateQueries({ queryKey: [queryScope, "dashboard"] }),
      ]);
      toast({
        title: "Attendance saved",
        description: "The attendance session and student marks were recorded successfully.",
      });
      setDialogOpen(false);
      setSelectedOfferingId("");
      setSessionDate(todayValue());
      setTopic("");
      setAttendanceMap({});
    },
    onError: (error) => {
      toast({
        title: "Unable to save attendance",
        description: error instanceof Error ? error.message : "The attendance session could not be recorded.",
      });
    },
  });

  if (attendanceQuery.isLoading || rosterQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (attendanceQuery.isError) {
    return (
      <ErrorState
        description={attendanceQuery.error instanceof Error ? attendanceQuery.error.message : "Attendance workspace could not be loaded."}
        onRetry={() => void attendanceQuery.refetch()}
      />
    );
  }

  if (rosterQuery.isError) {
    return (
      <ErrorState
        description={rosterQuery.error instanceof Error ? rosterQuery.error.message : "Student roster could not be loaded."}
        onRetry={() => void rosterQuery.refetch()}
      />
    );
  }

  const data = attendanceQuery.data;
  if (!data) {
    return <EmptyState title="No attendance data" description={`Attendance sessions will appear here when the ${workspaceLabel} workspace has active offerings.`} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Sessions" value={data.summary.total_sessions} icon={CalendarDays} variant="primary" />
          <StatCard title="Today" value={data.summary.today_sessions} icon={ClipboardList} variant="info" />
          <StatCard title="Recorded Marks" value={data.summary.recorded_marks} icon={Users} variant="success" />
          <StatCard title="Absences Logged" value={data.summary.absences_logged} icon={TriangleAlert} variant="warning" />
        </div>
        <div className="sm:self-start">
          <Button className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Take Attendance
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Assigned Offerings</h3>
        {data.offerings.length === 0 ? (
          <EmptyState
            title="No assigned offerings"
            description={`Once offerings are available to this ${workspaceLabel} workspace, attendance can be taken directly from this page.`}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {data.offerings.map((offering) => (
              <div key={offering.offering_id} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {offering.code} - Section {offering.section_code}
                    </p>
                    <h4 className="mt-1 font-semibold text-foreground">{offering.title}</h4>
                  </div>
                  <StatusBadge variant={getVariant(offering.status)}>{titleize(offering.status)}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{offering.enrolled_count} enrolled students</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedOfferingId(String(offering.offering_id));
                    setDialogOpen(true);
                  }}
                >
                  Take Attendance
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Sessions</h3>
        {data.recent_sessions.length === 0 ? (
          <EmptyState
            title="No attendance sessions yet"
            description="Your recorded sessions will show up here after you start taking attendance."
          />
        ) : (
          <div className="space-y-4">
            {data.recent_sessions.map((session) => (
              <div key={session.session_id} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {session.code} - {session.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Section {session.section_code} - {formatDate(session.session_date)}
                    </p>
                    {session.topic && <p className="mt-3 text-sm text-muted-foreground">{session.topic}</p>}
                  </div>
                  <StatusBadge variant={getVariant(session.status)}>{titleize(session.status)}</StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recorded Students</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{session.recorded_students}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Absences</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{session.absent_students}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Take Attendance</DialogTitle>
            <DialogDescription>Create a session and mark attendance for the selected offering in one step.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attendance-offering">Offering</Label>
              <select
                id="attendance-offering"
                value={selectedOfferingId}
                onChange={(event) => setSelectedOfferingId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select an offering</option>
                {data.offerings.map((offering) => (
                  <option key={offering.offering_id} value={offering.offering_id}>
                    {offering.code} - Section {offering.section_code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance-date">Session Date</Label>
              <Input id="attendance-date" type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendance-topic">Topic or Notes</Label>
            <Input
              id="attendance-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Lecture topic, lab, quiz, or class note"
            />
          </div>

          {selectedOfferingRoster.length === 0 ? (
            <EmptyState title="No enrolled students" description="This offering has no enrolled students to mark yet." />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Student", "Email", "Status"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOfferingRoster.map((student) => (
                      <tr key={student.student_id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.student_number}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={attendanceMap[student.student_id] ?? "present"}
                            onChange={(event) =>
                              setAttendanceMap((current) => ({
                                ...current,
                                [student.student_id]: event.target.value as "present" | "absent" | "late" | "excused",
                              }))
                            }
                            className="flex h-10 min-w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={attendanceMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => attendanceMutation.mutate()}
              disabled={attendanceMutation.isPending || !selectedOfferingId || selectedOfferingRoster.length === 0}
            >
              {attendanceMutation.isPending ? "Saving Attendance..." : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

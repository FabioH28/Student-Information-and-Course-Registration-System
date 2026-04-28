import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Check, X, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offeringsApi, registrationsApi, studentsApi, attendanceApi, coursesApi, CourseOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AttStatus = "present" | "absent" | "late";

export default function AttendancePage() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<number, AttStatus>>({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
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

  const { data: sessions = [] } = useQuery({
    queryKey: ["attendance-sessions", activeOfferingId],
    queryFn: () => attendanceApi.sessions(activeOfferingId!),
    enabled: activeOfferingId !== null,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-offering", activeOfferingId],
    queryFn: () => registrationsApi.list({ offering_id: activeOfferingId! }),
    enabled: activeOfferingId !== null,
  });

  const enrolledStudentIds = registrations.filter(r => r.status === "active").map(r => r.student_id);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
    enabled: enrolledStudentIds.length > 0,
  });

  const students = allStudents.filter(s => enrolledStudentIds.includes(s.id));
  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const createSessionMutation = useMutation({
    mutationFn: () => attendanceApi.createSession(activeOfferingId!, {
      session_date: new Date().toISOString().split("T")[0],
      topic: "Class session",
    }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", activeOfferingId] });
      setActiveSessionId(session.id);
      toast({ title: "Session created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create session", description: err.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (sessionId: number) => attendanceApi.submit(
      sessionId,
      students.map(s => ({ student_id: s.id, status: attendance[s.id] ?? "absent" }))
    ),
    onSuccess: (data) => {
      toast({ title: `Attendance saved for ${data.saved} student(s)` });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const mark = (id: number, status: AttStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttStatus) => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, status])));
  };

  const currentSession = activeSessionId
    ? sessions.find(s => s.id === activeSessionId)
    : sessions[sessions.length - 1] ?? null;

  const summary = {
    present: Object.values(attendance).filter(v => v === "present").length,
    absent: Object.values(attendance).filter(v => v === "absent").length,
    late: Object.values(attendance).filter(v => v === "late").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Mark attendance for today's sessions">
        <div className="flex gap-2">
          {!currentSession ? (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending || activeOfferingId === null}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createSessionMutation.isPending ? "Creating…" : "Start Session"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => submitMutation.mutate(currentSession.id)}
              disabled={submitMutation.isPending}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Saving…" : "Save Attendance"}
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={activeOfferingId ?? ""}
          onChange={e => { setSelectedOfferingId(Number(e.target.value)); setAttendance({}); setActiveSessionId(null); }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm"
        >
          {myOfferings.map(o => {
            const course = courseMap[o.course_id];
            return (
              <option key={o.id} value={o.id}>
                {course?.code ?? `#${o.id}`} — {course?.name ?? "—"} ({o.schedule ?? "—"})
              </option>
            );
          })}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {currentSession && (
        <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span>Session: {currentSession.session_date}</span>
          {currentSession.topic && <span>Topic: {currentSession.topic}</span>}
          <span className="text-primary font-medium">ID: {currentSession.id}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Present", count: summary.present, variant: "success" as const },
          { label: "Absent", count: summary.absent, variant: "danger" as const },
          { label: "Late", count: summary.late, variant: "warning" as const },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <StatusBadge variant={s.variant} className="mt-1">{s.label}</StatusBadge>
          </div>
        ))}
      </div>

      {/* Quick mark all */}
      <div className="flex gap-2">
        <button onClick={() => markAll("present")} className="text-xs px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 font-medium transition-colors">Mark All Present</button>
        <button onClick={() => markAll("absent")} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors">Mark All Absent</button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Code", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {myOfferings.length === 0 ? "No offerings assigned." : "No enrolled students."}
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const status = attendance[s.id] ?? null;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.student_code}</td>
                    <td className="px-4 py-3">
                      {status ? (
                        <StatusBadge variant={status === "present" ? "success" : status === "absent" ? "danger" : "warning"}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not marked</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => mark(s.id, "present")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "present" ? "bg-success/20 text-success" : "hover:bg-muted text-muted-foreground"}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => mark(s.id, "absent")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "absent" ? "bg-destructive/20 text-destructive" : "hover:bg-muted text-muted-foreground"}`}>
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => mark(s.id, "late")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "late" ? "bg-warning/20 text-warning" : "hover:bg-muted text-muted-foreground"}`}>
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {sessions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-3">Session History</h3>
          <div className="space-y-2">
            {[...sessions].reverse().map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.session_date}</p>
                  {s.topic && <p className="text-xs text-muted-foreground">{s.topic}</p>}
                </div>
                <button
                  onClick={() => setActiveSessionId(s.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

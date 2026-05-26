import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, BookOpen, ClipboardList, Calendar, Megaphone,
  ArrowRight, Building2, Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { coursesApi, studentsApi, semestersApi, staffApi, api } from "@/lib/api";

interface CommsDashboard {
  stats: { announcements: number; events: number; upcoming_events: number; clubs: number; pending_requests: number };
}

export default function AcademicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaffRoute = window.location.pathname.startsWith("/staff");
  const base = isStaffRoute ? "/staff" : "/academic-staff";

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });
  const { data: offerings = [] } = useQuery({ queryKey: ["staff-course-offerings"], queryFn: staffApi.courseOfferings });
  const { data: selections = [] } = useQuery({ queryKey: ["staff-course-selections"], queryFn: staffApi.courseSelections });
  const { data: comms } = useQuery({ queryKey: ["comms-dashboard"], queryFn: () => api.get<CommsDashboard>("/communications/dashboard") });

  const activeSemester = semesters.find((s) => s.is_active);
  const pendingSelections = selections.filter((s) => s.status === "pending").length;
  const totalCapacity = useMemo(() => offerings.reduce((sum, o) => sum + (o.capacity || 0), 0), [offerings]);
  const totalEnrolled = useMemo(() => offerings.reduce((sum, o) => sum + (o.enrolled || 0), 0), [offerings]);
  const fillRate = totalCapacity ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const firstName = user?.display_name?.split(" ")[0] ?? "Staff";
  const recentSelections = [...selections].sort((a, b) => (b.selected_at ?? "").localeCompare(a.selected_at ?? "")).slice(0, 5);

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Welcome back, {firstName}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {activeSemester?.name ?? "No active semester"} · {offerings.length} course offerings · {students.length} students
          {pendingSelections > 0 ? ` · ${pendingSelections} pending registration${pendingSelections === 1 ? "" : "s"}` : ""}.
        </p>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Students" value={String(students.length)} icon={GraduationCap} accent="from-info/15 to-info/5" onClick={() => navigate(`${base}/students`)} />
        <StatTile label="Courses" value={String(courses.length)} icon={BookOpen} accent="from-primary/15 to-primary/5" onClick={() => navigate(`${base}/courses`)} hint={`${offerings.length} offerings`} />
        <StatTile label="Pending Registrations" value={String(pendingSelections)} icon={ClipboardList} accent={pendingSelections ? "from-warning/15 to-warning/5" : "from-muted/40 to-muted/10"} onClick={() => navigate(`${base}/registrations`)} hint={pendingSelections ? "Needs review" : "All cleared"} />
        <StatTile label="Capacity fill" value={`${fillRate}%`} icon={Building2} accent="from-success/15 to-success/5" onClick={() => navigate(`${base === "/staff" ? "/staff/course-offerings" : "/academic-staff/staff-course-offerings"}`)} hint={`${totalEnrolled} / ${totalCapacity}`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Recent Registration Requests</h3>
              <p className="text-xs text-muted-foreground">{pendingSelections > 0 ? `${pendingSelections} awaiting your decision` : "No pending requests"}</p>
            </div>
            <button onClick={() => navigate(`${base}/registrations`)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Open queue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentSelections.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No subject selection activity yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Course</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentSelections.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-foreground">{s.student_name ?? `Student #${s.student_id}`}</td>
                      <td className="px-4 py-2 text-muted-foreground">{s.course_code ?? "—"} {s.course_name ?? ""}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "approved" || s.status === "enrolled" ? "bg-success/15 text-success"
                          : s.status === "rejected" ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">{s.selected_at ? new Date(s.selected_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Active Semester
            </h3>
            {activeSemester ? (
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={activeSemester.name} />
                <Row label="Starts" value={activeSemester.start_date} />
                <Row label="Ends" value={activeSemester.end_date} />
                <Row label="Reg. deadline" value={activeSemester.registration_deadline} />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No active semester configured.</p>
            )}
          </div>

          {comms?.stats && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Megaphone className="h-4 w-4 text-primary" /> Communications
              </h3>
              <dl className="space-y-2 text-sm">
                <Row label="Announcements" value={comms.stats.announcements} />
                <Row label="Upcoming events" value={comms.stats.upcoming_events} />
                <Row label="Active clubs" value={comms.stats.clubs} />
                <Row label="Pending club requests" value={comms.stats.pending_requests} />
              </dl>
              <button onClick={() => navigate(`${base}/communications`)} className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Open communications <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickLink icon={ClipboardList} label="Review registrations" onClick={() => navigate(`${base}/registrations`)} />
        <QuickLink icon={GraduationCap} label="Grades overview" onClick={() => navigate(`${base}/grades`)} />
        <QuickLink icon={BookOpen} label="Course catalog" onClick={() => navigate(`${base}/courses`)} />
        <QuickLink icon={Megaphone} label="Communications" onClick={() => navigate(`${base}/communications`)} />
      </motion.section>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent, hint, onClick }: {
  label: string; value: string; icon: React.ElementType; accent: string; hint?: string; onClick?: () => void;
}) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${accent} p-5 text-left shadow-card transition-shadow hover:shadow-card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur"><Icon className="h-5 w-5 text-foreground" /></div>
      </div>
    </motion.button>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15"><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

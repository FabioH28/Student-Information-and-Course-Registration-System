import { motion } from "framer-motion";
import {
  BookOpen, CalendarDays, GraduationCap, Bell, ClipboardList,
  TrendingUp, AlertTriangle, ArrowRight, Clock, MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import {
  studentsApi, offeringsApi, gradesApi, notificationsApi,
  attendanceApi, registrationsApi, progressionApi,
} from "@/lib/api";
import { gpaSeverity } from "@/lib/utils";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function minutesNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(value?: string | null) {
  if (!value) return 0;
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({ queryKey: ["student-me"], queryFn: studentsApi.me });
  const { data: myCourses = [] } = useQuery({ queryKey: ["student-my-courses"], queryFn: offeringsApi.studentMyCourses });
  const { data: timetable = [] } = useQuery({ queryKey: ["student-timetable"], queryFn: offeringsApi.studentTimetable });
  const { data: grades = [] } = useQuery({ queryKey: ["grades-me"], queryFn: gradesApi.my });
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["student-attendance"], queryFn: attendanceApi.studentGrouped });
  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const { data: progression } = useQuery({ queryKey: ["student-progression"], queryFn: progressionApi.me });

  const firstName = user?.display_name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Student";
  const gpa = profile ? Number(profile.gpa).toFixed(2) : "—";
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const activeRegs = registrations.filter((r) => r.status === "active").length;

  const today = todayName();
  const nowMin = minutesNow();
  const todays = timetable
    .filter((entry) => entry.day_of_week === today)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const nextClass = todays.find((entry) => timeToMinutes(entry.end_time) >= nowMin) ?? todays[0];

  const absences = attendance.filter((r) => r.status === "absent").length;
  const totalAttendance = attendance.length;
  const absenceRate = totalAttendance ? Math.round((absences / totalAttendance) * 100) : 0;
  const gpaNum = Number(profile?.gpa ?? 0);
  const atRisk = absenceRate >= 15 || gpaSeverity(gpaNum) === "critical";

  const upcomingDays = DAY_ORDER.slice(DAY_ORDER.indexOf(today)).concat(DAY_ORDER.slice(0, DAY_ORDER.indexOf(today)));
  const weekPreview = upcomingDays
    .map((day) => ({ day, entries: timetable.filter((e) => e.day_of_week === day) }))
    .filter((d) => d.entries.length > 0)
    .slice(0, 3);

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
          {nextClass
            ? `Your next class is ${nextClass.course_code ?? nextClass.course_name} at ${nextClass.start_time}.`
            : todays.length === 0
              ? "No classes scheduled today — enjoy the breather."
              : "All of today's classes are done."}
        </p>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Cumulative GPA"
          value={gpa}
          icon={GraduationCap}
          accent="from-primary/15 to-primary/5"
          onClick={() => navigate("/student/grades")}
          hint={progression ? `${progression.total_passed_credits} / ${progression.graduation_required_credits} credits` : undefined}
        />
        <StatTile
          label="Active Courses"
          value={String(activeRegs)}
          icon={BookOpen}
          accent="from-info/15 to-info/5"
          onClick={() => navigate("/student/courses")}
          hint={myCourses.length ? `${myCourses.length} this semester` : undefined}
        />
        <StatTile
          label="Unread Notifications"
          value={String(unreadCount)}
          icon={Bell}
          accent="from-warning/15 to-warning/5"
          onClick={() => navigate("/student/inbox")}
          hint={unreadCount ? "Tap to review" : "All caught up"}
        />
        <StatTile
          label="Absence Rate"
          value={`${absenceRate}%`}
          icon={atRisk ? AlertTriangle : TrendingUp}
          accent={atRisk ? "from-destructive/15 to-destructive/5" : "from-success/15 to-success/5"}
          onClick={() => navigate("/student/attendance")}
          hint={atRisk ? "Above 15% threshold" : "Within safe range"}
        />
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
              <h3 className="font-semibold text-foreground">Today's Schedule</h3>
              <p className="text-xs text-muted-foreground">{today}, {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
            </div>
            <button onClick={() => navigate("/student/timetable")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Full week <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {todays.length === 0 ? (
            <EmptyTile icon={CalendarDays} label="No classes scheduled for today." />
          ) : (
            <div className="space-y-2">
              {todays.map((entry, i) => {
                const isPast = timeToMinutes(entry.end_time) < nowMin;
                const isLive = timeToMinutes(entry.start_time) <= nowMin && timeToMinutes(entry.end_time) >= nowMin;
                return (
                  <div
                    key={`${entry.timetable_entry_id}-${i}`}
                    onClick={() => entry.course_offering_id && navigate(`/student/courses/${entry.course_offering_id}`)}
                    className={`group flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/40 ${
                      isPast ? "opacity-60" : ""
                    } ${isLive ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-md bg-muted/50 py-1 text-xs">
                      <span className="font-mono font-semibold text-foreground">{entry.start_time}</span>
                      <span className="font-mono text-muted-foreground">{entry.end_time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{entry.course_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.course_code}</p>
                    </div>
                    <div className="hidden text-xs text-muted-foreground sm:flex sm:flex-col sm:items-end">
                      {entry.room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.room}</span>}
                      {isLive && <span className="mt-0.5 font-semibold text-primary">In progress</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {weekPreview.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next days</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {weekPreview.map(({ day, entries }) => (
                  <div key={day} className="rounded-lg bg-muted/30 p-3 text-xs">
                    <p className="font-semibold text-foreground">{day}</p>
                    <p className="mt-0.5 text-muted-foreground">{entries.length} class{entries.length !== 1 ? "es" : ""}</p>
                  </div>
                ))}
              </div>
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
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Latest Grades</h3>
              <button onClick={() => navigate("/student/grades")} className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            {grades.length === 0 ? (
              <EmptyTile icon={GraduationCap} label="No published grades yet." />
            ) : (
              <div className="space-y-2">
                {grades.slice(0, 4).map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{g.course_code ?? `#${g.registration_id}`}</p>
                      <p className="truncate text-xs text-muted-foreground">{g.course_name ?? "—"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      g.pass_status === "failed" ? "bg-destructive/15 text-destructive"
                      : (g.final_grade ?? 0) >= 8 ? "bg-success/15 text-success"
                      : "bg-muted text-foreground"
                    }`}>
                      {g.final_grade ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Notifications</h3>
              <button onClick={() => navigate("/student/inbox")} className="text-xs font-medium text-primary hover:underline">Inbox</button>
            </div>
            {notifications.length === 0 ? (
              <EmptyTile icon={Bell} label="No notifications yet." />
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className={`rounded-lg p-3 text-sm ${n.is_read ? "bg-muted/20" : "border-l-2 border-l-primary bg-primary/5"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-foreground">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        <Clock className="inline h-3 w-3" /> {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickLink icon={ClipboardList} label="Register Subjects" onClick={() => navigate("/student/available-subjects")} />
        <QuickLink icon={BookOpen} label="Course Materials" onClick={() => navigate("/student/materials")} />
        <QuickLink icon={CalendarDays} label="Assignments" onClick={() => navigate("/student/assignments")} />
        <QuickLink icon={AlertTriangle} label="Risk Assessment" onClick={() => navigate("/student/risk")} />
      </motion.section>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent, onClick, hint }: {
  label: string; value: string; icon: React.ElementType; accent: string; onClick?: () => void; hint?: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${accent} p-5 text-left shadow-card transition-shadow hover:shadow-card-hover`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
      </div>
    </motion.button>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyTile({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

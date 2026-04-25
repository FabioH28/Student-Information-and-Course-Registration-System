import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, Bot, CalendarDays, Clock, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { useAuth } from "@/components/auth/AuthProvider";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatTimeValue, titleize } from "@/lib/formatters";

interface StudentDashboardResponse {
  student: {
    student_id: number;
    student_number: string;
    full_name: string;
    department_name: string;
    program_name: string;
    current_semester: number;
    cumulative_gpa: number;
  };
  summary: {
    registered_courses: number;
    registered_credits: number;
    unread_notifications: number;
    risk_level: string;
    risk_score: number | null;
  };
  next_classes: Array<{
    code: string;
    title: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location_name: string | null;
  }>;
  recent_grades: Array<{
    code: string;
    title: string;
    letter_grade: string;
    numeric_grade: number | null;
    published_at: string | null;
  }>;
}

function getRiskVariant(riskLevel: string) {
  if (riskLevel === "high") {
    return "danger" as const;
  }

  if (riskLevel === "medium") {
    return "warning" as const;
  }

  return "success" as const;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiGet<StudentDashboardResponse>("/students/me/dashboard"),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        description={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Dashboard data could not be loaded."}
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  const data = dashboardQuery.data;
  if (!data) {
    return <EmptyState title="No dashboard data yet" description="Student dashboard information will appear here once your account is linked to academic records." />;
  }

  const firstName = (user?.first_name ?? data.student.full_name.split(" ")[0] ?? "there").trim();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-primary p-5 text-primary-foreground shadow-card sm:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {firstName}</h2>
            <p className="mt-1 text-primary-foreground/80">
              {data.student.program_name} - Semester {data.student.current_semester}
            </p>
          </div>
          <button
            onClick={() => navigate("/student/chatbot")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20 md:w-auto"
          >
            <Bot className="h-4 w-4" />
            Ask AI Assistant
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Registered Courses"
          value={data.summary.registered_courses}
          subtitle={`${data.summary.registered_credits} Credits`}
          icon={BookOpen}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          title="Current GPA"
          value={data.student.cumulative_gpa.toFixed(2)}
          subtitle={data.student.department_name}
          icon={GraduationCap}
          variant="success"
          delay={0.15}
        />
        <StatCard
          title="Unread Notifications"
          value={data.summary.unread_notifications}
          subtitle="Inbox items awaiting review"
          icon={Clock}
          variant="warning"
          delay={0.2}
        />
        <StatCard
          title="Academic Risk"
          value={titleize(data.summary.risk_level, "Unknown")}
          subtitle={data.summary.risk_score ? `Score ${data.summary.risk_score.toFixed(1)}` : "No score available"}
          icon={AlertTriangle}
          variant="info"
          delay={0.25}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2"
        >
          <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Classes
            </h3>
            <button onClick={() => navigate("/student/timetable")} className="text-xs font-medium text-primary hover:underline">
              View full timetable
            </button>
          </div>

          {data.next_classes.length === 0 ? (
            <EmptyState title="No upcoming classes yet" description="Once you are enrolled in active offerings, the next scheduled meetings will appear here." />
          ) : (
            <div className="space-y-3">
              {data.next_classes.map((item) => (
                <div key={`${item.code}-${item.day_of_week}-${item.start_time}`} className="flex flex-col gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-auto font-mono text-sm font-semibold text-primary sm:w-28">
                    {titleize(item.day_of_week)} {formatTimeValue(item.start_time)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.code} - {item.location_name || "Location pending"} - until {formatTimeValue(item.end_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              Recent Grades
            </h3>
            <button onClick={() => navigate("/student/grades")} className="text-xs font-medium text-primary hover:underline">
              View all
            </button>
          </div>

          {data.recent_grades.length === 0 ? (
            <EmptyState title="No published grades yet" description="Published assessments and final grades will show up here as soon as faculty release them." />
          ) : (
            <div className="space-y-3">
              {data.recent_grades.map((item) => (
                <div key={`${item.code}-${item.published_at}`} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                  </div>
                  <StatusBadge variant={getRiskVariant(item.letter_grade.startsWith("C") ? "medium" : "low")}>
                    {item.letter_grade}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

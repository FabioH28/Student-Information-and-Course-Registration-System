import { motion } from "framer-motion";
import { Activity, AlertTriangle, BookOpen, CalendarDays, Clock, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/AuthProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatRelativeDateTime, titleize } from "@/lib/formatters";
import { ROLE_ACADEMIC_STAFF } from "@/lib/rbac";

interface AdminDashboardResponse {
  summary: {
    total_students: number;
    active_courses: number;
    current_registrations: number;
    at_risk_students: number;
  };
  popular_courses: Array<{
    code: string;
    title: string;
    enrolled_count: number;
    capacity: number;
  }>;
  risk_distribution: Array<{
    risk_level: string;
    total: number;
  }>;
  recent_activity: Array<{
    action: string;
    summary: string;
    entity_type: string;
    created_at: string;
  }>;
}

function getRiskVariant(level: string) {
  if (level === "high") {
    return "danger" as const;
  }

  if (level === "medium") {
    return "warning" as const;
  }

  return "success" as const;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const dashboardScope = user?.primary_role === ROLE_ACADEMIC_STAFF ? "academic" : "system-admin";
  const heading = user?.primary_role === ROLE_ACADEMIC_STAFF ? "Academic Staff Dashboard" : "System Admin Dashboard";
  const subtitle =
    user?.primary_role === ROLE_ACADEMIC_STAFF
      ? "Live academic operations overview from the CIS backend and database"
      : "Live system oversight view from the CIS backend and database";

  const dashboardQuery = useQuery({
    queryKey: [dashboardScope, "dashboard"],
    queryFn: () =>
      apiGet<AdminDashboardResponse>(
        dashboardScope === "academic" ? "/academic/dashboard" : "/system-admin/dashboard",
      ),
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

  const dashboard = dashboardQuery.data;
  if (!dashboard) {
    return <EmptyState title="No dashboard data yet" description="Overview metrics will appear here once the workspace has active records." />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={dashboard.summary.total_students} icon={Users} variant="primary" delay={0.05} />
        <StatCard title="Active Courses" value={dashboard.summary.active_courses} icon={BookOpen} variant="info" delay={0.1} />
        <StatCard title="Registrations" value={dashboard.summary.current_registrations} icon={CalendarDays} variant="success" delay={0.15} />
        <StatCard title="At-Risk Students" value={dashboard.summary.at_risk_students} icon={AlertTriangle} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Most Popular Courses
          </h3>

          {dashboard.popular_courses.length === 0 ? (
            <EmptyState title="No course demand data yet" description="Popular course enrollment trends will appear here once offerings and registrations exist." />
          ) : (
            <div className="space-y-3">
              {dashboard.popular_courses.map((course) => (
                <div key={`${course.code}-${course.capacity}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.code}</p>
                  </div>
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted sm:w-24 sm:flex-none">
                      <div
                        className="h-full rounded-full gradient-primary"
                        style={{ width: `${Math.min((Number(course.enrolled_count || 0) / Math.max(Number(course.capacity || 1), 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs text-muted-foreground">
                      {course.enrolled_count}/{course.capacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </h3>

          {dashboard.recent_activity.length === 0 ? (
            <EmptyState title="No audit activity yet" description="Administrative and system actions will appear here as they are recorded." />
          ) : (
            <div className="space-y-3">
              {dashboard.recent_activity.map((activity) => (
                <div key={`${activity.action}-${activity.created_at}`} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-start sm:gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{titleize(activity.action)}</p>
                    <p className="text-xs text-muted-foreground">{activity.summary}</p>
                  </div>
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:self-auto">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDateTime(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border bg-card p-5 shadow-card"
      >
        <h3 className="mb-4 font-semibold text-foreground">Student Risk Distribution</h3>
        {dashboard.risk_distribution.length === 0 ? (
          <EmptyState title="No risk data available" description="Risk distribution will appear here once risk snapshots are generated for students." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {dashboard.risk_distribution.map((risk) => (
              <div key={risk.risk_level} className="rounded-lg bg-muted/50 p-4 text-center">
                <StatusBadge variant={getRiskVariant(risk.risk_level)}>{titleize(risk.risk_level)} Risk</StatusBadge>
                <p className="mt-2 text-2xl font-bold text-foreground">{risk.total}</p>
                <p className="text-xs text-muted-foreground">Students in this band</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

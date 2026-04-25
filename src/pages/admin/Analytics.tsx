import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, Download, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";

interface AnalyticsResponse {
  metrics: {
    enrollment_growth: number;
    average_gpa: number;
    fill_rate: number;
    at_risk_rate: number;
  };
  department_breakdown: Array<{
    department_name: string;
    student_count: number;
    average_gpa: number;
    at_risk_percentage: number;
  }>;
}

export default function Analytics() {
  const analyticsQuery = useQuery({
    queryKey: ["system-admin", "analytics"],
    queryFn: () => apiGet<AnalyticsResponse>("/system-admin/analytics"),
  });

  if (analyticsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (analyticsQuery.isError) {
    return (
      <ErrorState
        description={analyticsQuery.error instanceof Error ? analyticsQuery.error.message : "Analytics data could not be loaded."}
        onRetry={() => void analyticsQuery.refetch()}
      />
    );
  }

  const analytics = analyticsQuery.data;
  if (!analytics) {
    return <EmptyState title="No analytics yet" description="Analytics will appear here once CIS has enough academic activity to report on." />;
  }

  const metrics = [
    {
      title: "Enrollment Growth",
      value: `${analytics.metrics.enrollment_growth >= 0 ? "+" : ""}${analytics.metrics.enrollment_growth.toFixed(1)}%`,
      desc: "Compared to the previous term",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Avg GPA (University)",
      value: analytics.metrics.average_gpa.toFixed(2),
      desc: "Across all student profiles",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Course Fill Rate",
      value: `${analytics.metrics.fill_rate.toFixed(1)}%`,
      desc: "Current-term capacity utilization",
      icon: BookOpen,
      color: "text-info",
    },
    {
      title: "At-Risk Rate",
      value: `${analytics.metrics.at_risk_rate.toFixed(1)}%`,
      desc: "Students requiring intervention",
      icon: AlertTriangle,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Reports" description="Comprehensive academic insights and operational trend data">
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border bg-card p-5 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{metric.title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.desc}</p>
              </div>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border bg-card shadow-card"
      >
        <div className="border-b border-border p-5">
          <h3 className="font-semibold text-foreground">Department Performance</h3>
        </div>
        {analytics.department_breakdown.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No department analytics yet" description="Department-level trends will appear here once student records are available." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Department", "Students", "Avg GPA", "At-Risk %"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.department_breakdown.map((department) => (
                  <tr key={department.department_name} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{department.department_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{department.student_count}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(department.average_gpa || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          department.at_risk_percentage > 3
                            ? "text-destructive"
                            : department.at_risk_percentage > 1.5
                              ? "text-warning"
                              : "text-success"
                        }
                      >
                        {Number(department.at_risk_percentage || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

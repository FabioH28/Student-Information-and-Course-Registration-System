import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Edit2, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { RegistrationStatusDialog, type RegistrationItem } from "@/components/admin/RegistrationStatusDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, titleize } from "@/lib/formatters";

interface RegistrationOverviewResponse {
  summary: {
    total_registrations: number;
    unique_students: number;
    average_courses_per_student: number;
  };
  items: RegistrationItem[];
}

function getRegistrationVariant(status: string) {
  if (status === "enrolled" || status === "completed") {
    return "success" as const;
  }

  if (status === "pending" || status === "waitlisted") {
    return "warning" as const;
  }

  return "danger" as const;
}

export default function RegistrationOverview() {
  const [search, setSearch] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);

  const registrationsQuery = useQuery({
    queryKey: ["academic", "registrations"],
    queryFn: () => apiGet<RegistrationOverviewResponse>("/academic/registrations/overview"),
  });

  const filteredItems = useMemo(
    () =>
      (registrationsQuery.data?.items ?? []).filter((item) => {
        const haystack =
          `${item.student_name} ${item.student_number} ${item.course_title} ${item.course_code} ${item.section_code} ${item.term_name}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [registrationsQuery.data?.items, search],
  );

  if (registrationsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (registrationsQuery.isError) {
    return (
      <ErrorState
        description={registrationsQuery.error instanceof Error ? registrationsQuery.error.message : "Registration overview could not be loaded."}
        onRetry={() => void registrationsQuery.refetch()}
      />
    );
  }

  const registrations = registrationsQuery.data;
  if (!registrations) {
    return <EmptyState title="No registration data yet" description="Registration overview data will appear here once students enroll in course offerings." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Registration Overview" description="Track student registrations and step them through the approval or completion workflow" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Registrations" value={registrations.summary.total_registrations} icon={BookOpen} variant="primary" />
        <StatCard title="Unique Students" value={registrations.summary.unique_students} icon={Users} variant="info" />
        <StatCard
          title="Avg Courses/Student"
          value={registrations.summary.average_courses_per_student.toFixed(2)}
          icon={CalendarDays}
          variant="success"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search registrations..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState title="No registrations found" description="Try a different student, course, or term search term." />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Student", "Course", "Term", "Date", "Status", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.enrollment_id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.student_name}</p>
                      <p className="text-xs text-muted-foreground">{item.student_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{item.course_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.course_code} · Section {item.section_code}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.term_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(item.registered_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getRegistrationVariant(item.status)}>{titleize(item.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRegistration(item)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <RegistrationStatusDialog open={Boolean(selectedRegistration)} onOpenChange={(open) => !open && setSelectedRegistration(null)} registration={selectedRegistration} />
    </div>
  );
}

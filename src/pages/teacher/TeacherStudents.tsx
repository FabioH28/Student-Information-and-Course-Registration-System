import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/formatters";
import { getTeachingApiBase, getTeachingQueryScope, getTeachingWorkspaceLabel } from "@/lib/teaching-workspace";

interface TeacherStudentsResponse {
  items: Array<{
    enrollment_id: number;
    student_id: number;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    course_code: string;
    course_title: string;
    section_code: string;
    enrollment_status: string;
    risk_level: string;
    numeric_grade: number | null;
    letter_grade: string | null;
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

export default function TeacherStudents() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const apiBase = getTeachingApiBase(user?.primary_role);
  const queryScope = getTeachingQueryScope(user?.primary_role);
  const workspaceLabel = getTeachingWorkspaceLabel(user?.primary_role);

  const studentsQuery = useQuery({
    queryKey: [queryScope, "students"],
    queryFn: () => apiGet<TeacherStudentsResponse>(`${apiBase}/students`),
  });

  const filtered = useMemo(
    () =>
      (studentsQuery.data?.items ?? []).filter((student) =>
        `${student.first_name} ${student.last_name} ${student.student_number} ${student.course_code} ${student.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [studentsQuery.data?.items, search],
  );

  if (studentsQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (studentsQuery.isError) {
    return (
      <ErrorState
        description={studentsQuery.error instanceof Error ? studentsQuery.error.message : "Student roster could not be loaded."}
        onRetry={() => void studentsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`This roster is grouped from every course offering visible to the ${workspaceLabel} workspace.`} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No students found" description="Students will appear here once enrollments exist in the offerings available to this workspace." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Student", "Email", "Course", "Enrollment", "Risk", "Current Grade"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student) => (
                  <tr key={student.enrollment_id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.student_number}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student.course_code} - {student.course_title}
                      </p>
                      <p className="text-xs text-muted-foreground">Section {student.section_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant="default">{titleize(student.enrollment_status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getRiskVariant(student.risk_level)}>{titleize(student.risk_level)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {student.letter_grade || student.numeric_grade || "Not published"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

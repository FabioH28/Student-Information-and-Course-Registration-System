import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { UserAccountDialog } from "@/components/admin/UserAccountDialog";
import { UserProvisionDialog, type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/formatters";
import { ROLE_STUDENT } from "@/lib/rbac";

interface StudentManagementResponse {
  items: Array<{
    student_id: number;
    user_id: number;
    student_number: string;
    first_name: string;
    last_name: string;
    email: string;
    academic_status: string;
    account_status: string;
    must_change_password: boolean;
    current_semester: number;
    cumulative_gpa: number;
    department_name: string;
    program_name: string;
  }>;
}

function getAccountVariant(status: string) {
  if (status === "active") {
    return "success" as const;
  }

  if (status === "pending" || status === "suspended") {
    return "warning" as const;
  }

  return "danger" as const;
}

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended" | "disabled">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["system-admin", "students"],
    queryFn: () => apiGet<StudentManagementResponse>("/system-admin/students"),
  });

  const referenceDataQuery = useQuery({
    queryKey: ["system-admin", "reference-data"],
    queryFn: () => apiGet<AdminReferenceData>("/system-admin/reference-data"),
  });

  const filtered = useMemo(
    () =>
      (studentsQuery.data?.items ?? []).filter((student) => {
        const haystack =
          `${student.first_name} ${student.last_name} ${student.student_number} ${student.email} ${student.program_name}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) {
          return false;
        }

        if (statusFilter !== "all" && student.account_status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [search, statusFilter, studentsQuery.data?.items],
  );

  if (studentsQuery.isLoading || referenceDataQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (studentsQuery.isError) {
    return (
      <ErrorState
        description={studentsQuery.error instanceof Error ? studentsQuery.error.message : "Student data could not be loaded."}
        onRetry={() => void studentsQuery.refetch()}
      />
    );
  }

  if (referenceDataQuery.isError || !referenceDataQuery.data) {
    return (
      <ErrorState
        description={
          referenceDataQuery.error instanceof Error
            ? referenceDataQuery.error.message
            : "Reference data for account creation could not be loaded."
        }
        onRetry={() => void referenceDataQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student Accounts" description="Create student accounts with generated IDs and manage learner access from the system admin workspace">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
        <div className="w-full sm:w-44">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Use Add Student to provision the first learner account and attach it to an academic profile."
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Student", "Email", "Department", "Sem", "GPA", "Academic", "Account", "Program", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student, index) => (
                  <motion.tr
                    key={student.student_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.student_number}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.department_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.current_semester}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(student.cumulative_gpa || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={student.academic_status === "active" ? "success" : "warning"}>{titleize(student.academic_status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getAccountVariant(student.account_status)}>{titleize(student.account_status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.program_name}</td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedUserId(student.user_id)}>
                        <MoreHorizontal className="mr-2 h-4 w-4" /> Manage
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <UserProvisionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        role={ROLE_STUDENT}
        referenceData={referenceDataQuery.data}
        invalidateQueries={[
          ["system-admin", "students"],
          ["system-admin", "dashboard"],
          ["system-admin", "analytics"],
        ]}
      />
      <UserAccountDialog
        open={selectedUserId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null);
          }
        }}
        user={
          selectedUserId === null
            ? null
            : (() => {
                const student = (studentsQuery.data?.items ?? []).find((item) => item.user_id === selectedUserId);
                return student
                  ? {
                      user_id: student.user_id,
                      full_name: `${student.first_name} ${student.last_name}`,
                      email: student.email,
                      account_status: student.account_status,
                      primary_role: ROLE_STUDENT,
                    }
                  : null;
              })()
        }
        invalidateQueries={[
          ["system-admin", "students"],
          ["system-admin", "dashboard"],
          ["system-admin", "analytics"],
        ]}
      />
    </div>
  );
}

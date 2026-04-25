import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Plus, Search, ShieldCheck, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { TeacherAssignmentDialog } from "@/components/admin/TeacherAssignmentDialog";
import { UserAccountDialog } from "@/components/admin/UserAccountDialog";
import { UserProvisionDialog, type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/formatters";
import {
  ROLE_ACADEMIC_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_INSTRUCTOR,
  ROLE_SYSTEM_ADMIN,
} from "@/lib/rbac";

interface StaffOverviewResponse {
  summary: {
    teachers: number;
    staff_members: number;
  };
  teachers: Array<{
    teacher_profile_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    employee_number: string;
    title: string | null;
    office_location: string | null;
    employment_status: string;
    department_name: string;
    primary_role: string | null;
    assigned_offerings: number;
  }>;
  staff_members: Array<{
    admin_profile_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    employee_number: string;
    title: string | null;
    office_location: string | null;
    employment_status: string;
    primary_role: string | null;
    roles_csv: string | null;
  }>;
}

function getAccountVariant(status: string) {
  if (status === "active") {
    return "success" as const;
  }

  if (status === "pending" || status === "on_leave" || status === "suspended") {
    return "warning" as const;
  }

  return "danger" as const;
}

export default function TeacherStaffManagement() {
  const [instructorOpen, setInstructorOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTeacherProfileId, setSelectedTeacherProfileId] = useState<number | null>(null);
  const [selectedManagedUserId, setSelectedManagedUserId] = useState<number | null>(null);

  const staffQuery = useQuery({
    queryKey: ["system-admin", "staff"],
    queryFn: () => apiGet<StaffOverviewResponse>("/system-admin/staff"),
  });

  const referenceDataQuery = useQuery({
    queryKey: ["system-admin", "reference-data"],
    queryFn: () => apiGet<AdminReferenceData>("/system-admin/reference-data"),
  });

  const instructors = useMemo(() => {
    const term = search.toLowerCase();
    return (staffQuery.data?.teachers ?? []).filter((teacher) =>
      `${teacher.first_name} ${teacher.last_name} ${teacher.email} ${teacher.employee_number} ${teacher.department_name} ${teacher.title ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, staffQuery.data?.teachers]);

  const staffMembers = useMemo(() => {
    const term = search.toLowerCase();
    return (staffQuery.data?.staff_members ?? []).filter((staffMember) =>
      `${staffMember.first_name} ${staffMember.last_name} ${staffMember.email} ${staffMember.employee_number} ${staffMember.title ?? ""} ${staffMember.primary_role ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, staffQuery.data?.staff_members]);

  if (staffQuery.isLoading || referenceDataQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (staffQuery.isError) {
    return (
      <ErrorState
        description={staffQuery.error instanceof Error ? staffQuery.error.message : "Instructors and staff could not be loaded."}
        onRetry={() => void staffQuery.refetch()}
      />
    );
  }

  if (referenceDataQuery.isError || !referenceDataQuery.data) {
    return (
      <ErrorState
        description={
          referenceDataQuery.error instanceof Error
            ? referenceDataQuery.error.message
            : "Reference data for user provisioning could not be loaded."
        }
        onRetry={() => void referenceDataQuery.refetch()}
      />
    );
  }

  const summary = staffQuery.data?.summary ?? { teachers: 0, staff_members: 0 };
  const selectedInstructor = (staffQuery.data?.teachers ?? []).find((teacher) => teacher.teacher_profile_id === selectedTeacherProfileId) ?? null;
  const selectedManagedUser =
    selectedManagedUserId === null
      ? null
      : (() => {
          const instructor = (staffQuery.data?.teachers ?? []).find((item) => item.user_id === selectedManagedUserId);
          if (instructor) {
            return {
              user_id: instructor.user_id,
              full_name: `${instructor.first_name} ${instructor.last_name}`,
              email: instructor.email,
              account_status: instructor.status,
              primary_role: ROLE_INSTRUCTOR,
              available_roles: [ROLE_INSTRUCTOR],
            };
          }

          const staffMember = (staffQuery.data?.staff_members ?? []).find((item) => item.user_id === selectedManagedUserId);
          return staffMember
            ? {
                user_id: staffMember.user_id,
                full_name: `${staffMember.first_name} ${staffMember.last_name}`,
                email: staffMember.email,
                account_status: staffMember.status,
                primary_role:
                  staffMember.primary_role === ROLE_ACADEMIC_STAFF ||
                  staffMember.primary_role === ROLE_FINANCE_STAFF ||
                  staffMember.primary_role === ROLE_COMMUNICATION_STAFF ||
                  staffMember.primary_role === ROLE_SYSTEM_ADMIN
                    ? staffMember.primary_role
                    : null,
                available_roles: [ROLE_ACADEMIC_STAFF, ROLE_FINANCE_STAFF, ROLE_COMMUNICATION_STAFF, ROLE_SYSTEM_ADMIN],
              }
            : null;
        })();

  return (
    <div className="space-y-6">
      <PageHeader title="Instructors & Staff" description="Provision instructor, staff, and system admin accounts with generated employee IDs and one-time credentials">
        <Button variant="outline" size="sm" onClick={() => setInstructorOpen(true)}>
          <GraduationCap className="mr-2 h-4 w-4" /> Add Instructor
        </Button>
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setStaffOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff Role
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Instructors</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{summary.teachers}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Staff & System Admins</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{summary.staff_members}</p>
            </div>
            <div className="rounded-xl bg-secondary/70 p-3">
              <Briefcase className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search instructors or staff..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Instructors</h3>
        </div>

        {instructors.length === 0 ? (
          <EmptyState title="No instructors found" description="Use Add Instructor to provision teaching accounts." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Instructor", "Department", "Role", "Title", "Office", "Offerings", "User Status", "Employment", "Actions"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {instructors.map((teacher, index) => (
                    <motion.tr
                      key={teacher.teacher_profile_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {teacher.first_name} {teacher.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.employee_number} - {teacher.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.department_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.primary_role || ROLE_INSTRUCTOR}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.title || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.office_location || "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{teacher.assigned_offerings}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getAccountVariant(teacher.status)}>{titleize(teacher.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getAccountVariant(teacher.employment_status)}>
                          {titleize(teacher.employment_status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedTeacherProfileId(teacher.teacher_profile_id)}>
                            <UserCheck className="mr-2 h-4 w-4" /> Assign Courses
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedManagedUserId(teacher.user_id)}>
                            Manage Account
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Operational Staff</h3>
        </div>

        {staffMembers.length === 0 ? (
          <EmptyState title="No staff members found" description="Use Add Staff Role to provision academic, finance, communications, or system admin accounts." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Staff Member", "Primary Role", "All Roles", "Title", "Office", "User Status", "Employment", "Actions"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffMembers.map((staffMember, index) => (
                    <motion.tr
                      key={staffMember.admin_profile_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {staffMember.first_name} {staffMember.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {staffMember.employee_number} - {staffMember.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{staffMember.primary_role || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{staffMember.roles_csv || staffMember.primary_role || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{staffMember.title || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{staffMember.office_location || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getAccountVariant(staffMember.status)}>{titleize(staffMember.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getAccountVariant(staffMember.employment_status)}>
                          {titleize(staffMember.employment_status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedManagedUserId(staffMember.user_id)}>
                          Manage Account
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </section>

      <UserProvisionDialog
        open={instructorOpen}
        onOpenChange={setInstructorOpen}
        role={ROLE_INSTRUCTOR}
        referenceData={referenceDataQuery.data}
        invalidateQueries={[
          ["system-admin", "staff"],
          ["academic", "courses"],
        ]}
      />
      <UserProvisionDialog
        open={staffOpen}
        onOpenChange={setStaffOpen}
        role={ROLE_ACADEMIC_STAFF}
        allowedRoles={[ROLE_ACADEMIC_STAFF, ROLE_FINANCE_STAFF, ROLE_COMMUNICATION_STAFF, ROLE_SYSTEM_ADMIN]}
        referenceData={referenceDataQuery.data}
        invalidateQueries={[["system-admin", "staff"]]}
      />
      <TeacherAssignmentDialog
        open={Boolean(selectedInstructor)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTeacherProfileId(null);
          }
        }}
        teacher={selectedInstructor}
      />
      <UserAccountDialog
        open={selectedManagedUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedManagedUserId(null);
          }
        }}
        user={selectedManagedUser}
        availableRoles={selectedManagedUser?.available_roles}
        invalidateQueries={[
          ["system-admin", "staff"],
          ["academic", "courses"],
        ]}
      />
    </div>
  );
}

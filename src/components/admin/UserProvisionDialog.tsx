import { useEffect, useMemo, useState } from "react";
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";
import {
  ROLE_ACADEMIC_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_INSTRUCTOR,
  ROLE_STUDENT,
  ROLE_SYSTEM_ADMIN,
  type AppRole,
} from "@/lib/rbac";

export interface AdminReferenceData {
  departments: Array<{
    id: number;
    code: string;
    name: string;
    status: string;
  }>;
  programs: Array<{
    id: number;
    department_id: number;
    code: string;
    name: string;
    degree_level: string;
    duration_semesters: number;
    total_credits_required: number;
    status: string;
  }>;
  teachers?: Array<{
    teacher_profile_id: number;
    employee_number: string;
    full_name: string;
    email: string;
    title: string | null;
    department_name: string;
  }>;
  rooms?: Array<{
    id: number;
    code: string;
    name: string;
    capacity: number;
    room_type: string;
    building_name: string;
  }>;
  terms?: Array<{
    id: number;
    code: string;
    name: string;
    status: string;
    is_current: boolean;
    start_date: string;
    end_date: string;
  }>;
  students?: Array<{
    student_id: number;
    student_number: string;
    user_id: number;
    full_name: string;
    email: string;
    department_name: string;
    program_name: string;
  }>;
  club_categories?: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
  }>;
  roles?: Array<{
    code: AppRole;
    name: string;
  }>;
}

interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  status: string;
  roles: string[];
  primary_role: string | null;
  must_change_password: boolean;
}

interface ProvisioningResult {
  user: UserSummary;
  generated_identifiers: {
    student_number: string | null;
    employee_number: string | null;
  };
  temporary_password: string | null;
}

interface UserProvisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AppRole;
  allowedRoles?: AppRole[];
  referenceData: AdminReferenceData;
  invalidateQueries?: QueryKey[];
}

interface CreateUserFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "suspended" | "disabled";
  must_change_password: boolean;
  department_id: string;
  program_id: string;
  admission_date: string;
  current_semester: string;
  title: string;
  office_location: string;
  hire_date: string;
}

function getDefaultFormState(): CreateUserFormState {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "active",
    must_change_password: true,
    department_id: "",
    program_id: "",
    admission_date: "",
    current_semester: "1",
    title: "",
    office_location: "",
    hire_date: "",
  };
}

function copyToClipboard(text: string, label: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast({
      title: "Clipboard unavailable",
      description: `Copy the ${label} manually.`,
    });
    return;
  }

  void navigator.clipboard.writeText(text).then(
    () => {
      toast({
        title: `${label} copied`,
        description: "You can paste it wherever you need to share it securely.",
      });
    },
    () => {
      toast({
        title: "Copy failed",
        description: `Copy the ${label} manually.`,
      });
    },
  );
}

const ROLE_COPY: Record<AppRole, { title: string; description: string; submit: string; identifierLabel: string }> = {
  [ROLE_STUDENT]: {
    title: "Add Student",
    description: "Create the campus account and student profile. Student number and temporary credentials are generated automatically.",
    submit: "Provision Student",
    identifierLabel: "Student Number",
  },
  [ROLE_INSTRUCTOR]: {
    title: "Add Instructor",
    description: "Create an instructor account with a generated employee number and one-time temporary password.",
    submit: "Provision Instructor",
    identifierLabel: "Employee Number",
  },
  [ROLE_ACADEMIC_STAFF]: {
    title: "Add Academic Staff",
    description: "Create an academic staff account for scheduling, registration, records, and academic administration.",
    submit: "Provision Academic Staff",
    identifierLabel: "Employee Number",
  },
  [ROLE_FINANCE_STAFF]: {
    title: "Add Finance Staff",
    description: "Create a finance staff account for invoices, payments, holds, and finance reporting.",
    submit: "Provision Finance Staff",
    identifierLabel: "Employee Number",
  },
  [ROLE_COMMUNICATION_STAFF]: {
    title: "Add Communication Staff",
    description: "Create a communication staff account for announcements, events, media, and campus communications.",
    submit: "Provision Communication Staff",
    identifierLabel: "Employee Number",
  },
  [ROLE_SYSTEM_ADMIN]: {
    title: "Add System Admin",
    description: "Create a System Admin account with oversight of users, roles, settings, and platform administration.",
    submit: "Provision System Admin",
    identifierLabel: "Employee Number",
  },
};

export function UserProvisionDialog({
  open,
  onOpenChange,
  role,
  allowedRoles,
  referenceData,
  invalidateQueries = [],
}: UserProvisionDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserFormState>(getDefaultFormState);
  const [result, setResult] = useState<ProvisioningResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>(role);

  useEffect(() => {
    if (!open) {
      setForm(getDefaultFormState());
      setResult(null);
      setSelectedRole(role);
    }
  }, [open, role]);

  const availableRoles = allowedRoles && allowedRoles.length > 0 ? allowedRoles : [role];
  const showRoleSelector = availableRoles.length > 1;
  const isStudent = selectedRole === ROLE_STUDENT;
  const isInstructor = selectedRole === ROLE_INSTRUCTOR;
  const roleFieldPrefix = selectedRole.toLowerCase().replace(/\s+/g, "-");

  const filteredPrograms = useMemo(() => {
    if (!form.department_id) {
      return referenceData.programs;
    }

    const departmentId = Number(form.department_id);
    return referenceData.programs.filter((program) => program.department_id === departmentId);
  }, [form.department_id, referenceData.programs]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
        throw new Error("First name, last name, and email are required.");
      }

      if (isStudent && (!form.department_id || !form.program_id)) {
        throw new Error("Department and program are required for student accounts.");
      }

      if (isInstructor && !form.department_id) {
        throw new Error("Department is required for instructor accounts.");
      }

      return apiPost<ProvisioningResult>("/system-admin/users", {
        role: selectedRole,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        status: form.status,
        must_change_password: form.must_change_password,
        department_id:
          isStudent || isInstructor
            ? form.department_id
              ? Number(form.department_id)
              : null
            : null,
        program_id: isStudent && form.program_id ? Number(form.program_id) : null,
        admission_date: isStudent ? form.admission_date || null : null,
        current_semester: isStudent ? Number(form.current_semester || "1") : null,
        title: !isStudent ? form.title.trim() || null : null,
        office_location: !isStudent ? form.office_location.trim() || null : null,
        hire_date: isInstructor ? form.hire_date || null : null,
      });
    },
    onSuccess: async (payload) => {
      await Promise.all(
        invalidateQueries.map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey,
          }),
        ),
      );

      setResult(payload);
      toast({
        title: `${selectedRole} account provisioned`,
        description: "The institutional account was created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: `Unable to create ${selectedRole}`,
        description: error instanceof Error ? error.message : "The account could not be created.",
      });
    },
  });

  const setField = <K extends keyof CreateUserFormState>(key: K, value: CreateUserFormState[K]) => {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "department_id" && current.program_id) {
        const selectedProgramMatches = referenceData.programs.some(
          (program) => program.id === Number(current.program_id) && program.department_id === Number(value || "0"),
        );
        if (!selectedProgramMatches) {
          next.program_id = "";
        }
      }

      return next;
    });
  };

  const currentCopy = ROLE_COPY[selectedRole];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{result ? "Account Provisioned" : currentCopy.title}</DialogTitle>
          <DialogDescription>
            {result
              ? "Share these credentials securely. The temporary password is shown once and the user will be asked to change it on first sign-in."
              : currentCopy.description}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">{result.user.full_name} is ready to access CIS.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the details below to complete onboarding. This mirrors the production handoff flow without forcing the system admin to type a password upfront.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Campus Email</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{result.user.email}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => copyToClipboard(result.user.email, "email")}>
                  <Copy className="mr-2 h-4 w-4" /> Copy email
                </Button>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{currentCopy.identifierLabel}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {result.generated_identifiers.student_number || result.generated_identifiers.employee_number || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Temporary Password</p>
                  <p className="mt-1 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm text-foreground">
                    {result.temporary_password || "Generated outside this workflow"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.temporary_password ? (
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.temporary_password ?? "", "temporary password")}>
                        <Copy className="mr-2 h-4 w-4" /> Copy password
                      </Button>
                    ) : null}
                    <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Must change password on first sign-in
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">What happens next</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The account already exists in the system. The next step is assignment and workflow expansion, not rebuilding the access layer.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(getDefaultFormState());
                  setResult(null);
                  setSelectedRole(role);
                }}
              >
                Create Another
              </Button>
              <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {showRoleSelector ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((roleOption) => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {roleOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor={`${roleFieldPrefix}-first-name`}>First Name</Label>
                <Input
                  id={`${roleFieldPrefix}-first-name`}
                  value={form.first_name}
                  onChange={(event) => setField("first_name", event.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${roleFieldPrefix}-last-name`}>Last Name</Label>
                <Input
                  id={`${roleFieldPrefix}-last-name`}
                  value={form.last_name}
                  onChange={(event) => setField("last_name", event.target.value)}
                  placeholder="Last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${roleFieldPrefix}-email`}>Institutional Email</Label>
                <Input
                  id={`${roleFieldPrefix}-email`}
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="user@campus.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${roleFieldPrefix}-phone`}>Phone</Label>
                <Input
                  id={`${roleFieldPrefix}-phone`}
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as CreateUserFormState["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isStudent ? (
                <>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={form.department_id} onValueChange={(value) => setField("department_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceData.departments.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Select value={form.program_id} onValueChange={(value) => setField("program_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPrograms.map((program) => (
                          <SelectItem key={program.id} value={String(program.id)}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admission-date">Admission Date</Label>
                    <Input
                      id="admission-date"
                      type="date"
                      value={form.admission_date}
                      onChange={(event) => setField("admission_date", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-semester">Current Semester</Label>
                    <Input
                      id="current-semester"
                      type="number"
                      min={1}
                      max={20}
                      value={form.current_semester}
                      onChange={(event) => setField("current_semester", event.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {isInstructor ? (
                    <>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={form.department_id} onValueChange={(value) => setField("department_id", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {referenceData.departments.map((department) => (
                              <SelectItem key={department.id} value={String(department.id)}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hire-date">Hire Date</Label>
                        <Input
                          id="hire-date"
                          type="date"
                          value={form.hire_date}
                          onChange={(event) => setField("hire_date", event.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor={`${roleFieldPrefix}-title`}>Title</Label>
                    <Input
                      id={`${roleFieldPrefix}-title`}
                      value={form.title}
                      onChange={(event) => setField("title", event.target.value)}
                      placeholder={isInstructor ? "Senior Lecturer" : "Operations Manager"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${roleFieldPrefix}-office-location`}>Office Location</Label>
                    <Input
                      id={`${roleFieldPrefix}-office-location`}
                      value={form.office_location}
                      onChange={(event) => setField("office_location", event.target.value)}
                      placeholder="Administration Block"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Generated automatically</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isStudent
                      ? "Student number and first-login password are generated by the backend so system admins only focus on identity and academic placement."
                      : "Employee number and first-login password are generated by the backend so this stays close to a real production provisioning flow."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
              <Checkbox
                id={`${roleFieldPrefix}-must-change-password`}
                checked={form.must_change_password}
                onCheckedChange={(checked) => setField("must_change_password", checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor={`${roleFieldPrefix}-must-change-password`} className="text-sm font-medium">
                  Require password change on first sign-in
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recommended for all newly provisioned institutional accounts.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createUserMutation.isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => createUserMutation.mutate()}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Provisioning..." : currentCopy.submit}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

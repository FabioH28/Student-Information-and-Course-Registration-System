import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { usersApi, studentsApi, coursesApi, semestersApi, offeringsApi, financeApi } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  student: "Students", teacher: "Instructors", instructor: "Instructors",
  staff: "Academic Staff", academic_staff: "Academic Staff",
  finance_staff: "Finance Staff", admin: "Admins", system_admin: "Admins",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: pendingUsers = [] } = useQuery({ queryKey: ["admin-users-pending"], queryFn: usersApi.pending });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => offeringsApi.list() });
  const { data: holds = [] } = useQuery({ queryKey: ["finance-holds", true], queryFn: () => financeApi.holds({ active_only: true }) });

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const k = ROLE_LABELS[u.role] ?? u.role;
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const activeSemester = semesters.find((s) => s.is_active);
  const inactiveAccounts = users.filter((u) => !u.is_active).length;
  const firstName = user?.display_name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2 className="text-lg font-semibold text-foreground">Welcome back, {firstName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} accounts · {students.length} students · {courses.length} courses · {activeSemester?.name ?? "no active semester"}.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y rounded-lg border lg:grid-cols-4">
        <button onClick={() => navigate("/admin/users")} className="p-4 text-left hover:bg-muted/30">
          <p className="text-2xl font-semibold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground">Total users{inactiveAccounts ? ` · ${inactiveAccounts} inactive` : ""}</p>
        </button>
        <button onClick={() => navigate("/admin/students")} className="p-4 text-left hover:bg-muted/30">
          <p className="text-2xl font-semibold text-foreground">{students.length}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </button>
        <button onClick={() => navigate("/admin/courses")} className="p-4 text-left hover:bg-muted/30">
          <p className="text-2xl font-semibold text-foreground">{courses.length}</p>
          <p className="text-xs text-muted-foreground">Courses · {offerings.length} offerings</p>
        </button>
        <button onClick={() => navigate("/admin/users")} className="p-4 text-left hover:bg-muted/30">
          <p className="text-2xl font-semibold text-foreground">{pendingUsers.length}</p>
          <p className="text-xs text-muted-foreground">Pending approval{pendingUsers.length ? " · review now" : ""}</p>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-lg border xl:col-span-2">
          <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Accounts by role</div>
          <div className="divide-y">
            {roleBreakdown.map(([label, count]) => {
              const pct = users.length ? (count / users.length) * 100 : 0;
              return (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground"><span className="font-semibold text-foreground">{count}</span> · {pct.toFixed(1)}%</span>
                </div>
              );
            })}
            {roleBreakdown.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No accounts yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Current semester</div>
            {activeSemester ? (
              <dl className="divide-y">
                <Row label="Name" value={activeSemester.name} />
                <Row label="Starts" value={activeSemester.start_date} />
                <Row label="Ends" value={activeSemester.end_date} />
                <Row label="Reg. deadline" value={activeSemester.registration_deadline} />
                <Row label="Drop deadline" value={activeSemester.drop_deadline} />
              </dl>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No semester is currently active.</p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Active account holds</div>
            <div className="px-4 py-4">
              <p className="text-2xl font-semibold text-foreground">{holds.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">{holds.length ? "Students with restrictions" : "No active holds"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Quick actions</div>
        <div className="divide-y">
          <QuickLink label="Manage users" onClick={() => navigate("/admin/users")} />
          <QuickLink label="Manage semesters" onClick={() => navigate("/admin/semesters")} />
          <QuickLink label="Registrations" onClick={() => navigate("/admin/registrations")} />
          <QuickLink label="View analytics" onClick={() => navigate("/admin/analytics")} />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted/30">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">Open →</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

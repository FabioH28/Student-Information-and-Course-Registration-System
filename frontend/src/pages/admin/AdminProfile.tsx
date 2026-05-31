import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { usersApi, studentsApi, coursesApi, semestersApi } from "@/lib/api";

export default function AdminProfile() {
  const { user } = useAuth();
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });

  const fullName = user?.display_name ?? user?.name ?? "System Admin";
  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const activeSem = semesters.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">Your CIS administrator account</p>
      </div>

      <section className="flex flex-col gap-5 rounded-lg border p-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-bold text-foreground">
          {initials || "A"}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-foreground">{fullName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{user?.role ?? "system_admin"}</Badge>
            <Badge>Full system access</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-lg border lg:col-span-2">
          <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Account information</div>
          <dl className="divide-y">
            <ReadField label="Email" value={user?.email} />
            <ReadField label="Role" value={user?.role ?? "system_admin"} />
            <ReadField label="Account status" value="Active" />
            <ReadField label="Active semester" value={activeSem?.name ?? "None set"} />
          </dl>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">System snapshot</div>
          <div className="divide-y">
            <Metric label="Total accounts" value={String(users.length)} />
            <Metric label="Students" value={String(students.length)} />
            <Metric label="Courses" value={String(courses.length)} />
            <Metric label="Semesters" value={String(semesters.length)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

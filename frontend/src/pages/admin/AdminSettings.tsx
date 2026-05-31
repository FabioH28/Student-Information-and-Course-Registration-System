import { useQuery } from "@tanstack/react-query";

import { StatusBadge } from "@/components/ui/status-badge";
import { api, usersApi, semestersApi } from "@/lib/api";

interface HealthResponse { status?: string; ok?: boolean; }

export default function AdminSettings() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthResponse>("/health").catch(() => null),
    retry: false,
  });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";
  const activeSem = semesters.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">System configuration and health</p>
      </div>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">System health</div>
        <div className="divide-y">
          <HealthRow label="Backend API" status={health.isLoading ? "checking" : "ok"} note={apiBase} />
          <HealthRow label="User accounts" status="ok" note={`${users.length} active`} />
          <HealthRow label="Active semester" status={activeSem ? "ok" : "warn"} note={activeSem?.name ?? "none configured"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Environment</div>
        <dl className="divide-y">
          <KV label="API base URL" value={apiBase} />
          <KV label="Frontend mode" value={(import.meta.env.MODE as string) ?? "production"} />
          <KV label="System name" value="CIS — Campus Information System" />
          <KV label="Build version" value="0.1.0" />
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Security policies</div>
        <dl className="divide-y">
          <KV label="Minimum password length" value="8 characters" />
          <KV label="Default password (reset)" value="password123 (force change)" />
          <KV label="Session token" value="JWT (HS256, 480 min)" />
          <KV label="Account approval" value="Pending → admin review" />
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Notifications & email</div>
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Email delivery is configured server-side via SMTP environment variables in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">backend/.env</code>.
          User-facing notifications use the in-app inbox.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Database</div>
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Connection details are managed on the backend. To rotate credentials, update <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DATABASE_URL</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">backend/.env</code> and restart the service.
        </p>
      </section>
    </div>
  );
}

function HealthRow({ label, status, note }: { label: string; status: "ok" | "warn" | "error" | "checking"; note?: string }) {
  const variant = status === "ok" ? "success" : status === "warn" ? "warning" : status === "error" ? "danger" : "info";
  const text = status === "ok" ? "Online" : status === "warn" ? "Warning" : status === "error" ? "Offline" : "Checking";
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <StatusBadge variant={variant}>{text}</StatusBadge>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

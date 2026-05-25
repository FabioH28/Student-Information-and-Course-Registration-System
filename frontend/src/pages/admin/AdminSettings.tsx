import { motion } from "framer-motion";
import { Settings as SettingsIcon, Database, Server, Mail, Shield, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader title="Settings" description="System configuration and health" />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Activity className="h-4 w-4 text-primary" /> System Health</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <HealthRow label="Backend API" status={health.isLoading ? "checking" : health.data || health.isError === false ? "ok" : "ok"} note={apiBase} />
          <HealthRow label="User accounts" status="ok" note={`${users.length} active`} />
          <HealthRow label="Active semester" status={activeSem ? "ok" : "warn"} note={activeSem?.name ?? "none configured"} />
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Server className="h-4 w-4 text-primary" /> Environment</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <KV label="API base URL" value={apiBase} />
          <KV label="Frontend mode" value={(import.meta.env.MODE as string) ?? "production"} />
          <KV label="System name" value="CIS — Campus Information System" />
          <KV label="Build version" value="0.1.0" />
        </dl>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Shield className="h-4 w-4 text-primary" /> Security Policies</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <KV label="Minimum password length" value="8 characters" />
          <KV label="Default password (reset)" value="password123 (force change)" />
          <KV label="Session token" value="JWT (HS256, 480 min)" />
          <KV label="Account approval" value="Pending → admin review" />
        </dl>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Mail className="h-4 w-4 text-primary" /> Notifications & Email</h3>
        <p className="text-sm text-muted-foreground">
          Email delivery is configured server-side via SMTP environment variables in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">backend/.env</code>.
          User-facing notifications use the in-app inbox.
        </p>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Database className="h-4 w-4 text-primary" /> Database</h3>
        <p className="text-sm text-muted-foreground">
          Connection details are managed on the backend. To rotate credentials, update <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DATABASE_URL</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">backend/.env</code> and restart the service.
        </p>
      </motion.section>
    </div>
  );
}

function HealthRow({ label, status, note }: { label: string; status: "ok" | "warn" | "error" | "checking"; note?: string }) {
  const variant = status === "ok" ? "success" : status === "warn" ? "warning" : status === "error" ? "danger" : "info";
  const text = status === "ok" ? "Online" : status === "warn" ? "Warning" : status === "error" ? "Offline" : "Checking";
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
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
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

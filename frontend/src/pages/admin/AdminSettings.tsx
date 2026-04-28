import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, KeyRound, ShieldOff, ShieldCheck, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, UserOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["student", "instructor", "academic_staff", "finance_staff", "system_admin"];

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function roleVariant(role: string) {
  if (role === "system_admin") return "danger" as const;
  if (role === "instructor") return "info" as const;
  if (role === "academic_staff") return "warning" as const;
  if (role === "finance_staff") return "warning" as const;
  return "success" as const;
}

export default function AdminSettings() {
  const [tab, setTab] = useState<"users" | "pending">("pending");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [approveRole, setApproveRole] = useState<Record<number, string>>({});
  const [refuseReason, setRefuseReason] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["users-pending"],
    queryFn: usersApi.pending,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.approve(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-pending"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User approved and notified by email" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const refuseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => usersApi.refuse(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-pending"] });
      toast({ title: "User refused and notified by email" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({ email: newEmail, password: newPassword, role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("student");
      toast({ title: "User created" });
    },
    onError: (err: Error) => toast({ title: "Failed to create user", description: err.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      usersApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated" });
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => usersApi.resetPassword(id),
    onSuccess: () => toast({ title: "Password reset to ChangeMe123!" }),
    onError: (err: Error) => toast({ title: "Reset failed", description: err.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    return u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage accounts, approve registrations, and assign roles">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-4 h-4 mr-2" /> New User
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {([["pending", "Pending Approvals"], ["users", "All Users"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
              tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
            {key === "pending" && pendingUsers.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Create User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => createMutation.mutate()}
              disabled={!newEmail || !newPassword || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Pending approvals tab */}
      {tab === "pending" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Applicant", "Email", "Registered", "Assign Role", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
                ) : pendingUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No pending registrations.</td></tr>
                ) : pendingUsers.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{u.full_name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={approveRole[u.id] ?? "student"}
                        onChange={e => setApproveRole(r => ({ ...r, [u.id]: e.target.value }))}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveMutation.mutate({ id: u.id, role: approveRole[u.id] ?? "student" })}
                          disabled={approveMutation.isPending}
                          title="Approve"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-medium transition-colors">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => refuseMutation.mutate({ id: u.id, reason: refuseReason[u.id] })}
                          disabled={refuseMutation.isPending}
                          title="Refuse"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors">
                          <X className="w-3.5 h-3.5" /> Refuse
                        </button>
                        <input
                          placeholder="Reason (optional)"
                          value={refuseReason[u.id] ?? ""}
                          onChange={e => setRefuseReason(r => ({ ...r, [u.id]: e.target.value }))}
                          className="h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground w-32"
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "users" && <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Role", "Status", "First Login", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</td></tr>
              ) : filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={u.is_active ? "success" : "danger"}>
                      {u.is_active ? "Active" : "Suspended"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={u.is_first_login ? "warning" : "success"}>
                      {u.is_first_login ? "Pending" : "Done"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        title={u.is_active ? "Suspend" : "Activate"}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {u.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => resetMutation.mutate(u.id)}
                        title="Reset password"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      </>}
    </div>
  );
}

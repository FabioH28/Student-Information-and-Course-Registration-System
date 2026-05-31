import { useMemo, useState } from "react";
import { Search, Plus, X, KeyRound, UserCog, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useToast } from "@/hooks/use-toast";
import { usersApi, type UserOut } from "@/lib/api";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Instructor (teacher)" },
  { value: "instructor", label: "Instructor" },
  { value: "staff", label: "Academic Staff (staff)" },
  { value: "academic_staff", label: "Academic Staff" },
  { value: "finance_staff", label: "Finance Staff" },
  { value: "admin", label: "System Admin (admin)" },
  { value: "system_admin", label: "System Admin" },
];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<UserOut | null>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: pending = [] } = useQuery({ queryKey: ["admin-users-pending"], queryFn: usersApi.pending });

  const reset = useMutation({
    mutationFn: (id: number) => usersApi.resetPassword(id),
    onSuccess: (res) => toast({
      title: "Password reset",
      description: res.email_sent ? "New password emailed to the user." : "User must change it on next login. (Email not sent)",
    }),
    onError: (e: Error) => toast({ title: "Reset failed", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => usersApi.update(id, { is_active }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User updated", description: res.email_sent ? "User notified by email." : undefined });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matches = !q || u.email.toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter
        || (statusFilter === "active" && u.is_active)
        || (statusFilter === "inactive" && !u.is_active);
      return matches && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const pagination = usePagination(filtered, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground">System accounts and roles</p>
        </div>
        <Button size="sm" onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> New user
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {pending.length} account{pending.length === 1 ? "" : "s"} awaiting approval
          </p>
          <div className="mt-3 space-y-2">
            {pending.map((u) => (
              <PendingRow key={u.id} user={u} onChanged={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                queryClient.invalidateQueries({ queryKey: ["admin-users-pending"] });
              }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="pl-9" />
        </div>
        <NativeSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-auto">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </NativeSelect>
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </NativeSelect>
      </div>

      <section className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No users match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagination.pageItems.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{u.full_name ?? u.display_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge variant="info">{u.role}</StatusBadge></td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "Active" : "Inactive"}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                          <UserCog className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reset.mutate(u.id)} disabled={reset.isPending}>
                          <KeyRound className="mr-1 h-3.5 w-3.5" /> Reset
                        </Button>
                        <label className={`flex items-center gap-1.5 text-xs select-none ${["admin","system_admin"].includes(u.role) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                          <Switch
                            checked={u.is_active}
                            onCheckedChange={(val) => toggleActive.mutate({ id: u.id, is_active: val })}
                            disabled={toggleActive.isPending || ["admin", "system_admin"].includes(u.role)}
                          />
                          <span className="text-muted-foreground">{u.is_active ? "Active" : "Inactive"}</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DataPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="users"
        />
      </section>

      {composing && (
        <NewUserModal onClose={() => setComposing(false)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          toast({ title: "User created" });
        }} />
      )}
      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          toast({ title: "User updated" });
        }} />
      )}
    </div>
  );
}

function PendingRow({ user, onChanged }: { user: UserOut; onChanged: () => void }) {
  const { toast } = useToast();
  const [role, setRole] = useState(user.role || "student");
  const approve = useMutation({
    mutationFn: () => usersApi.approve(user.id, role),
    onSuccess: (res) => {
      toast({ title: "User approved", description: res.email_sent ? "Approval emailed to the user." : "(Email not sent)" });
      onChanged();
    },
  });
  const refuse = useMutation({
    mutationFn: () => usersApi.refuse(user.id, "Refused by admin"),
    onSuccess: (res) => {
      toast({ title: "User refused", description: res.email_sent ? "Notification emailed to the user." : "(Email not sent)" });
      onChanged();
    },
  });
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{user.full_name ?? user.email}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <NativeSelect value={role} onChange={(e) => setRole(e.target.value)} className="h-9 w-auto px-2 text-xs">
        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </NativeSelect>
      <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate()}>
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
      </Button>
      <Button size="sm" variant="outline" disabled={refuse.isPending} onClick={() => refuse.mutate()}>
        Refuse
      </Button>
    </div>
  );
}

function NewUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => usersApi.create({ email, password, role, full_name: name || undefined }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = email.includes("@") && password.length >= 6 && role;

  return (
    <Modal title="New user" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full name (optional)"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></Field>
        <Field label="Role">
          <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </NativeSelect>
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ModalActions onClose={onClose} onSave={() => { setError(null); create.mutate(); }} canSave={canSave} saving={create.isPending} />
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: UserOut; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.is_active);
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => usersApi.update(user.id, { role, is_active: active }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <Modal title={`Edit user · ${user.email}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Role">
          <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </NativeSelect>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Account active
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ModalActions onClose={onClose} onSave={() => { setError(null); save.mutate(); }} canSave={true} saving={save.isPending} />
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ModalActions({ onClose, onSave, canSave, saving }: { onClose: () => void; onSave: () => void; canSave: boolean; saving: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button disabled={!canSave || saving} onClick={onSave}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
}

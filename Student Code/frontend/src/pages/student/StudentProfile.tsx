import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, GraduationCap, IdCard, Calendar, Pencil, X, Save, ShieldCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { studentsApi, progressionApi } from "@/lib/api";

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ["student-me"], queryFn: studentsApi.me });
  const { data: progression } = useQuery({ queryKey: ["student-progression"], queryFn: progressionApi.me });

  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", date_of_birth: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        phone: profile.phone ?? "",
        date_of_birth: profile.date_of_birth ?? "",
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => studentsApi.updateMe({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-me"] });
      toast({ title: "Profile updated" });
      setEditing(false);
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.display_name || "Student";
  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const gpa = profile ? Number(profile.gpa).toFixed(2) : "—";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
            {initials || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-semibold text-foreground">{fullName}</h2>
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{profile?.student_code ?? "No student code"}</Badge>
              <Badge>Semester {profile?.current_semester ?? "—"}</Badge>
              <Badge>{profile?.status ?? "—"}</Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            ) : (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2"
        >
          <h3 className="mb-4 font-semibold text-foreground">Personal information</h3>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </Field>
              <Field label="Last name">
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+355 6X XXX XXXX" />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </Field>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <ReadField icon={IdCard} label="Student code" value={profile?.student_code} />
              <ReadField icon={Mail} label="Email" value={user?.email} />
              <ReadField icon={Phone} label="Phone" value={profile?.phone || "Not set"} />
              <ReadField icon={Calendar} label="Date of birth" value={profile?.date_of_birth || "Not set"} />
              <ReadField icon={GraduationCap} label="Current semester" value={String(profile?.current_semester ?? "—")} />
              <ReadField icon={ShieldCheck} label="Account status" value={profile?.status ?? "—"} />
            </dl>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-foreground">Academic snapshot</h3>
            <div className="space-y-4">
              <Metric label="Cumulative GPA" value={gpa} />
              {progression && (
                <>
                  <Metric label="Degree level" value={progression.degree_level} />
                  <Metric label="Academic year" value={progression.current_academic_year} />
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Credits passed</span>
                      <span className="font-semibold text-foreground">{progression.total_passed_credits} / {progression.graduation_required_credits}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{
                        width: `${Math.min(100, (progression.total_passed_credits / Math.max(1, progression.graduation_required_credits)) * 100)}%`,
                      }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
      {children}
    </span>
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

function ReadField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted/60 p-1.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate font-medium text-foreground">{value || "—"}</dd>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

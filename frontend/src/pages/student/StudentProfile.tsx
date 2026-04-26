import { motion } from "framer-motion";
import { Mail, Phone, Calendar, BookOpen, GraduationCap } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["student-me"],
    queryFn: studentsApi.me,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading profile…</p></div>;
  }

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : (user?.display_name.split(" ").map(n => n[0]).join("") ?? "?");

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : user?.display_name ?? "—";

  const statusVariant = profile?.status === "active" ? "success" : profile?.status === "probation" ? "warning" : "danger";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="h-28 sm:h-32 gradient-primary" />
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-secondary text-2xl font-bold text-secondary-foreground ring-4 ring-card shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
              </div>
              <div className="pt-1 sm:pt-0">
                <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
                <p className="text-sm text-muted-foreground">Student ID: {profile?.student_code ?? "—"}</p>
              </div>
            </div>
            <div className="sm:pb-2">
              <StatusBadge variant={statusVariant}>{profile?.status ?? "—"}</StatusBadge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-5 shadow-card space-y-4">
          <h3 className="font-semibold text-foreground">Personal Information</h3>
          {[
            { icon: Mail, label: "Email", value: user?.email ?? "—" },
            { icon: Phone, label: "Phone", value: profile?.phone ?? "—" },
            { icon: Calendar, label: "Date of Birth", value: profile?.date_of_birth ?? "—" },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted"><Icon className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Academic Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border p-5 shadow-card space-y-4">
          <h3 className="font-semibold text-foreground">Academic Information</h3>
          {[
            { icon: BookOpen, label: "Program ID", value: profile ? `Program #${profile.program_id}` : "—" },
            { icon: Calendar, label: "Current Semester", value: profile ? `Semester ${profile.current_semester}` : "—" },
            { icon: GraduationCap, label: "Cumulative GPA", value: profile ? `${Number(profile.gpa).toFixed(2)} / 4.00` : "—" },
            { icon: GraduationCap, label: "Status", value: profile?.status ?? "—" },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

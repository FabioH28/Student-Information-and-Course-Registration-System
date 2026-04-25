import { motion } from "framer-motion";
import { BookOpen, Calendar, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProfileEditDialog } from "@/components/student/ProfileEditDialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/formatters";

interface StudentProfileResponse {
  student_number: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country: string | null;
  current_semester: number;
  cumulative_gpa: number;
  earned_credits: number;
  academic_status: string;
  department_id: number;
  department_name: string;
  program_id: number;
  program_name: string;
  current_term_name: string | null;
}

function buildAddress(profile: StudentProfileResponse) {
  return [
    profile.address_line_1,
    profile.address_line_2,
    profile.city,
    profile.state_region,
    profile.postal_code,
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiGet<StudentProfileResponse>("/students/me/profile"),
  });

  if (profileQuery.isLoading) {
    return <LoadingState lines={4} />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        description={profileQuery.error instanceof Error ? profileQuery.error.message : "Profile data could not be loaded."}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return <EmptyState title="No profile linked yet" description="This account has not been linked to a student profile yet." />;
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const address = buildAddress(profile);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border bg-card shadow-card"
      >
        <div className="relative h-28 gradient-primary sm:h-32">
          <div className="absolute bottom-0 left-4 translate-y-1/2 rounded-2xl border-4 border-card shadow-lg sm:left-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl gradient-secondary text-2xl font-bold text-secondary-foreground sm:h-24 sm:w-24 sm:text-3xl">
              {initials || "ST"}
            </div>
          </div>
        </div>

        <div className="px-4 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{fullName || user?.full_name || "Student"}</h2>
              <p className="text-sm text-muted-foreground">Student ID: {profile.student_number}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={profile.academic_status === "active" ? "success" : "warning"} className="w-fit">
                {profile.academic_status === "active" ? "Active" : profile.academic_status}
              </StatusBadge>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit contact info
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="font-semibold text-foreground">Personal Information</h3>
          {[
            { icon: Mail, label: "Email", value: profile.email },
            { icon: Phone, label: "Phone", value: profile.phone || "Not provided" },
            { icon: MapPin, label: "Address", value: address || "No address on file" },
            { icon: Calendar, label: "Date of Birth", value: formatDate(profile.date_of_birth, "Not provided") },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4 rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="font-semibold text-foreground">Academic Information</h3>
          {[
            { icon: BookOpen, label: "Department", value: profile.department_name },
            { icon: GraduationCap, label: "Program", value: profile.program_name },
            {
              icon: Calendar,
              label: "Semester",
              value: `${profile.current_semester}${profile.current_semester === 1 ? "st" : profile.current_semester === 2 ? "nd" : profile.current_semester === 3 ? "rd" : "th"} Semester${profile.current_term_name ? ` - ${profile.current_term_name}` : ""}`,
            },
            { icon: GraduationCap, label: "Cumulative GPA", value: `${Number(profile.cumulative_gpa || 0).toFixed(2)} / 4.00` },
            { icon: BookOpen, label: "Earned Credits", value: `${profile.earned_credits} credits` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={{
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          address_line_1: profile.address_line_1,
          address_line_2: profile.address_line_2,
          city: profile.city,
          state_region: profile.state_region,
          postal_code: profile.postal_code,
          country: profile.country,
        }}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, IdCard, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserProfileEditDialog } from "@/components/profile/UserProfileEditDialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";

interface UserProfileResponse {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  roles: string[];
  primary_role: string | null;
  department_name: string | null;
  program_name: string | null;
  student_number: string | null;
  employee_number: string | null;
  title: string | null;
  office_location: string | null;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => apiGet<UserProfileResponse>("/users/me/profile"),
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
    return <EmptyState title="No profile linked yet" description="This account has not been linked to a profile record yet." />;
  }

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
              {initials || "CI"}
            </div>
          </div>
        </div>

        <div className="px-4 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile.full_name || user?.full_name || "CIS User"}</h2>
              <p className="text-sm text-muted-foreground">{profile.primary_role || "Campus user"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="success" className="w-fit">
                Active
              </StatusBadge>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit profile
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
          <h3 className="font-semibold text-foreground">Contact Information</h3>
          {[
            { icon: Mail, label: "Email", value: profile.email },
            { icon: Phone, label: "Phone", value: profile.phone || "Not provided" },
            { icon: Briefcase, label: "Title", value: profile.title || "Not provided" },
            { icon: Building2, label: "Office", value: profile.office_location || "Not provided" },
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
          <h3 className="font-semibold text-foreground">Institutional Details</h3>
          {[
            { icon: IdCard, label: "Employee Number", value: profile.employee_number || "Not assigned" },
            { icon: IdCard, label: "Student Number", value: profile.student_number || "Not applicable" },
            { icon: Building2, label: "Department", value: profile.department_name || "Not assigned" },
            { icon: Briefcase, label: "Program", value: profile.program_name || "Not applicable" },
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

      <UserProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={{
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          title: profile.title,
          office_location: profile.office_location,
        }}
      />
    </div>
  );
}

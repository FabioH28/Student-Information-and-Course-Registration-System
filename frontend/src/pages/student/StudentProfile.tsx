import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Calendar, BookOpen, GraduationCap } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function StudentProfile() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="h-28 sm:h-32 gradient-primary" />
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-secondary text-2xl font-bold text-secondary-foreground ring-4 ring-card shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                AJ
              </div>
              <div className="pt-1 sm:pt-0">
                <h2 className="text-2xl font-bold text-foreground">Alex Johnson</h2>
                <p className="text-sm text-muted-foreground">Student ID: STU-2024-0847</p>
              </div>
            </div>
            <div className="sm:pb-2">
              <StatusBadge variant="success">Active</StatusBadge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-5 shadow-card space-y-4">
          <h3 className="font-semibold text-foreground">Personal Information</h3>
          {[
            { icon: Mail, label: "Email", value: "alex.johnson@university.edu" },
            { icon: Phone, label: "Phone", value: "+1 (555) 234-5678" },
            { icon: MapPin, label: "Address", value: "123 University Ave, Suite 4B" },
            { icon: Calendar, label: "Date of Birth", value: "March 15, 2003" },
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
            { icon: BookOpen, label: "Department", value: "Computer Science" },
            { icon: GraduationCap, label: "Program", value: "B.Sc. Computer Science" },
            { icon: Calendar, label: "Semester", value: "6th Semester — Spring 2026" },
            { icon: GraduationCap, label: "Cumulative GPA", value: "3.72 / 4.00" },
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

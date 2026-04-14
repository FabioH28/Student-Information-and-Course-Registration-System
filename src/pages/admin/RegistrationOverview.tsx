import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { BookOpen, Users, CalendarDays } from "lucide-react";

const registrations = [
  { student: "Alex Johnson", id: "STU-2024-0847", course: "Data Structures", code: "CS201", date: "Dec 5, 2025", status: "Confirmed" },
  { student: "Sarah Kim", id: "STU-2024-0912", course: "Machine Learning", code: "CS301", date: "Dec 6, 2025", status: "Confirmed" },
  { student: "James Williams", id: "STU-2023-0234", course: "AI Foundations", code: "CS250", date: "Dec 7, 2025", status: "Pending" },
  { student: "Maria Garcia", id: "STU-2024-1001", course: "Linear Algebra", code: "MATH301", date: "Dec 8, 2025", status: "Confirmed" },
  { student: "David Brown", id: "STU-2023-0567", course: "Software Eng.", code: "CS302", date: "Dec 9, 2025", status: "Dropped" },
];

export default function RegistrationOverview() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader title="Registration Overview" description="Track and manage all student registrations">
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Registrations" value="3,482" icon={BookOpen} variant="primary" />
        <StatCard title="Unique Students" value="1,247" icon={Users} variant="info" />
        <StatCard title="Avg Courses/Student" value="4.2" icon={CalendarDays} variant="success" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search registrations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Student", "Course", "Date", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registrations.map((r, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{r.student}</p>
                  <p className="text-xs text-muted-foreground">{r.id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-foreground">{r.course}</p>
                  <p className="text-xs text-muted-foreground">{r.code}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{r.date}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={r.status === "Confirmed" ? "success" : r.status === "Pending" ? "warning" : "danger"}>{r.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

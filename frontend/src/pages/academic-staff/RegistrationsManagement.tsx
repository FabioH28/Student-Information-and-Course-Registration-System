import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const registrations = [
  { id: "REG-001", student: "Alex Johnson", studentId: "STU-001", course: "Machine Learning", code: "CS401", credits: 3, date: "Apr 10, 2026", status: "Approved" },
  { id: "REG-002", student: "Sarah Kim", studentId: "STU-002", course: "Software Engineering", code: "CS302", credits: 3, date: "Apr 10, 2026", status: "Pending" },
  { id: "REG-003", student: "James Williams", studentId: "STU-003", course: "Computer Networks", code: "CS350", credits: 3, date: "Apr 11, 2026", status: "Pending" },
  { id: "REG-004", student: "Maria Garcia", studentId: "STU-004", course: "AI Foundations", code: "CS250", credits: 3, date: "Apr 11, 2026", status: "Approved" },
  { id: "REG-005", student: "David Brown", studentId: "STU-005", course: "Database Systems", code: "CS220", credits: 3, date: "Apr 12, 2026", status: "Rejected" },
];

export default function RegistrationsManagement() {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(registrations.map(r => [r.id, r.status]))
  );

  const filtered = registrations.filter(r =>
    r.student.toLowerCase().includes(search.toLowerCase()) || r.course.toLowerCase().includes(search.toLowerCase())
  );

  const approve = (id: string) => setStatuses(prev => ({ ...prev, [id]: "Approved" }));
  const reject = (id: string) => setStatuses(prev => ({ ...prev, [id]: "Rejected" }));

  return (
    <div className="space-y-6">
      <PageHeader title="Registrations" description="Review and manage student course registrations" />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Approved", count: Object.values(statuses).filter(s => s === "Approved").length, variant: "success" as const },
          { label: "Pending", count: Object.values(statuses).filter(s => s === "Pending").length, variant: "warning" as const },
          { label: "Rejected", count: Object.values(statuses).filter(s => s === "Rejected").length, variant: "danger" as const },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <StatusBadge variant={s.variant} className="mt-1">{s.label}</StatusBadge>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Course", "Credits", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{r.student}</p>
                    <p className="text-xs text-muted-foreground">{r.studentId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{r.course}</p>
                    <p className="text-xs text-muted-foreground">{r.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.credits}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={statuses[r.id] === "Approved" ? "success" : statuses[r.id] === "Pending" ? "warning" : "danger"}>
                      {statuses[r.id]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    {statuses[r.id] === "Pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => approve(r.id)} className="p-1.5 rounded-lg hover:bg-success/20 text-muted-foreground hover:text-success transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => reject(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

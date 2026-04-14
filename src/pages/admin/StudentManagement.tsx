import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const students = [
  { id: "STU-2024-0847", name: "Alex Johnson", dept: "Computer Science", semester: 6, gpa: 3.72, status: "Active", risk: "Low" },
  { id: "STU-2024-0912", name: "Sarah Kim", dept: "Computer Science", semester: 4, gpa: 3.45, status: "Active", risk: "Low" },
  { id: "STU-2023-0234", name: "James Williams", dept: "Mathematics", semester: 5, gpa: 2.85, status: "Active", risk: "Medium" },
  { id: "STU-2024-1001", name: "Maria Garcia", dept: "Information Systems", semester: 3, gpa: 3.90, status: "Active", risk: "Low" },
  { id: "STU-2023-0567", name: "David Brown", dept: "Computer Science", semester: 7, gpa: 2.10, status: "Probation", risk: "High" },
  { id: "STU-2024-0789", name: "Emma Davis", dept: "Data Science", semester: 2, gpa: 3.55, status: "Active", risk: "Low" },
];

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Student Management" description="View and manage enrolled students">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
      </PageHeader>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Department", "Sem", "GPA", "Status", "Risk", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.dept}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.semester}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{s.gpa}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={s.status === "Active" ? "success" : "danger"}>{s.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={s.risk === "Low" ? "success" : s.risk === "Medium" ? "warning" : "danger"}>{s.risk}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
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

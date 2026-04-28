import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/lib/api";

export default function StudentsView() {
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || s.student_code.toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading students…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="View and monitor student academic records" />

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
                {["Student", "Code", "Sem", "GPA", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground">{s.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{s.student_code}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.current_semester}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(s.gpa).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={s.status === "active" ? "success" : s.status === "probation" ? "warning" : "danger"}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </StatusBadge>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

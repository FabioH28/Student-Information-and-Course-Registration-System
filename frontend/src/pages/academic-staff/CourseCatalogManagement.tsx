import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = [
  { code: "CS201", name: "Data Structures", dept: "Computer Science", credits: 3, enrolled: 42, capacity: 45, instructor: "Dr. Smith", status: "Active" },
  { code: "CS301", name: "Algorithms", dept: "Computer Science", credits: 3, enrolled: 38, capacity: 40, instructor: "Dr. Smith", status: "Active" },
  { code: "CS220", name: "Database Systems", dept: "Computer Science", credits: 3, enrolled: 55, capacity: 60, instructor: "Dr. Johnson", status: "Active" },
  { code: "CS250", name: "AI Foundations", dept: "Computer Science", credits: 3, enrolled: 38, capacity: 40, instructor: "Dr. Lee", status: "Active" },
  { code: "MATH301", name: "Linear Algebra", dept: "Mathematics", credits: 4, enrolled: 70, capacity: 70, instructor: "Prof. Adams", status: "Full" },
  { code: "ENG101", name: "Technical Writing", dept: "English", credits: 2, enrolled: 30, capacity: 50, instructor: "Prof. Brown", status: "Active" },
];

export default function CourseCatalogManagement() {
  const [search, setSearch] = useState("");
  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Course Catalog" description="Manage course offerings for the current semester">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </Button>
      </PageHeader>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Course", "Department", "Credits", "Instructor", "Enrollment", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, i) => (
                <motion.tr key={c.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.dept}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.credits}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.instructor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.enrolled}/{c.capacity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={c.status === "Active" ? "success" : "warning"}>{c.status}</StatusBadge>
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

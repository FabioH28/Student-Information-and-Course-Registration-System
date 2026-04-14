import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, MoreHorizontal, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = [
  { code: "CS201", title: "Data Structures", credits: 3, instructor: "Dr. Smith", semester: "Spring 2026", enrolled: 55, capacity: 60, status: "Active" },
  { code: "CS250", title: "AI Foundations", credits: 3, instructor: "Dr. Patel", semester: "Spring 2026", enrolled: 38, capacity: 40, status: "Active" },
  { code: "CS301", title: "Machine Learning Intro", credits: 3, instructor: "Prof. Lee", semester: "Spring 2026", enrolled: 48, capacity: 50, status: "Active" },
  { code: "CS305", title: "Compiler Design", credits: 3, instructor: "Prof. Wang", semester: "Spring 2026", enrolled: 30, capacity: 30, status: "Full" },
  { code: "MATH301", title: "Linear Algebra", credits: 4, instructor: "Dr. Kim", semester: "Spring 2026", enrolled: 42, capacity: 50, status: "Active" },
];

export default function CourseManagement() {
  const [search, setSearch] = useState("");
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Course Management" description="Manage courses, schedules, and assignments">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> Add Course</Button>
      </PageHeader>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-4 h-4 text-primary" /></div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={c.status === "Active" ? "success" : "warning"}>{c.status}</StatusBadge>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
            <h4 className="font-semibold text-foreground mt-1">{c.title}</h4>
            <p className="text-xs text-muted-foreground mt-2">{c.instructor} • {c.credits} credits</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{c.enrolled}/{c.capacity}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

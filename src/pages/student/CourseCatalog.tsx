import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = [
  { code: "CS301", title: "Machine Learning Intro", credits: 3, instructor: "Dr. Smith", time: "Mon/Wed 10:00-11:30", status: "Open", seats: 12 },
  { code: "CS302", title: "Software Engineering", credits: 3, instructor: "Prof. Lee", time: "Tue/Thu 09:00-10:30", status: "Open", seats: 5 },
  { code: "CS303", title: "Computer Networks", credits: 3, instructor: "Dr. Patel", time: "Mon/Wed 14:00-15:30", status: "Open", seats: 20 },
  { code: "CS304", title: "Operating Systems", credits: 4, instructor: "Prof. Garcia", time: "Tue/Thu 11:00-12:30", status: "Waitlist", seats: 0 },
  { code: "MATH201", title: "Discrete Mathematics", credits: 3, instructor: "Dr. Kim", time: "Mon/Wed 08:00-09:30", status: "Open", seats: 30 },
  { code: "CS305", title: "Compiler Design", credits: 3, instructor: "Prof. Wang", time: "Fri 10:00-13:00", status: "Closed", seats: 0 },
];

export default function CourseCatalog() {
  const [search, setSearch] = useState("");
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Course Catalog" description="Browse and register for available courses">
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-4 h-4 text-primary" /></div>
              <StatusBadge variant={c.status === "Open" ? "success" : c.status === "Waitlist" ? "warning" : "danger"}>{c.status}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
            <h4 className="font-semibold text-foreground mt-1">{c.title}</h4>
            <p className="text-xs text-muted-foreground mt-2">{c.instructor} • {c.credits} credits</p>
            <p className="text-xs text-muted-foreground">{c.time}</p>
            {c.status === "Open" && (
              <Button size="sm" className="w-full mt-4 gradient-primary text-primary-foreground hover:opacity-90">Register</Button>
            )}
            {c.status === "Waitlist" && (
              <Button size="sm" variant="outline" className="w-full mt-4">Join Waitlist</Button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

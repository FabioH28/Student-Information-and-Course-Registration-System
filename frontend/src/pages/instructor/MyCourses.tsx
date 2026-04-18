import { motion } from "framer-motion";
import { BookOpen, Users, CalendarDays, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useNavigate } from "react-router-dom";

const courses = [
  { code: "CS201", name: "Data Structures", schedule: "Mon/Wed 09:00–10:30", room: "Hall A-201", enrolled: 42, capacity: 45, status: "Active" },
  { code: "CS201L", name: "Data Structures Lab", schedule: "Mon 14:00–16:00", room: "Lab C-302", enrolled: 20, capacity: 20, status: "Full" },
  { code: "CS301", name: "Algorithms", schedule: "Tue/Thu 11:00–12:30", room: "Hall B-105", enrolled: 38, capacity: 40, status: "Active" },
];

export default function MyCourses() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Course offerings assigned to you this semester" />

      <div className="grid grid-cols-1 gap-4">
        {courses.map((c, i) => (
          <motion.div key={c.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <StatusBadge variant={c.status === "Active" ? "success" : "warning"}>{c.status}</StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-8 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{c.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{c.enrolled}/{c.capacity} students</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/instructor/attendance")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors">
                    Attendance
                  </button>
                  <button onClick={() => navigate("/instructor/grades")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-medium transition-colors">
                    Grades
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Enrollment</span>
                <span className="text-xs text-muted-foreground">{Math.round((c.enrolled / c.capacity) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

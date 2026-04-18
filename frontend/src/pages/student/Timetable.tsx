import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = Array.from({ length: 10 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

type CourseBlock = { course: string; room: string; rowStart: number; rowSpan: number; color: string };

const schedule: Record<string, CourseBlock[]> = {
  Monday: [
    { course: "Data Structures", room: "A-201", rowStart: 2, rowSpan: 2, color: "bg-primary/15 border-primary/30 text-primary" },
    { course: "Linear Algebra", room: "B-105", rowStart: 4, rowSpan: 2, color: "bg-info/15 border-info/30 text-info" },
  ],
  Tuesday: [
    { course: "Database Systems", room: "C-110", rowStart: 2, rowSpan: 2, color: "bg-success/15 border-success/30 text-success" },
    { course: "AI Foundations", room: "Lab C-302", rowStart: 7, rowSpan: 2, color: "bg-accent/15 border-accent/30 text-accent" },
  ],
  Wednesday: [
    { course: "Data Structures", room: "A-201", rowStart: 2, rowSpan: 2, color: "bg-primary/15 border-primary/30 text-primary" },
    { course: "Linear Algebra", room: "B-105", rowStart: 4, rowSpan: 2, color: "bg-info/15 border-info/30 text-info" },
  ],
  Thursday: [
    { course: "Database Systems", room: "C-110", rowStart: 2, rowSpan: 2, color: "bg-success/15 border-success/30 text-success" },
    { course: "AI Foundations", room: "Lab C-302", rowStart: 7, rowSpan: 2, color: "bg-accent/15 border-accent/30 text-accent" },
  ],
  Friday: [
    { course: "Technical Writing", room: "D-201", rowStart: 3, rowSpan: 2, color: "bg-warning/15 border-warning/30 text-warning" },
  ],
};

export default function Timetable() {
  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Timetable" description="Spring 2026 — Your class schedule at a glance" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border shadow-card overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-6 border-b">
            <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
            {days.map(d => (
              <div key={d} className="p-3 text-xs font-semibold text-foreground text-center border-l border-border">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative grid grid-cols-6" style={{ gridTemplateRows: `repeat(${hours.length}, 60px)` }}>
            {/* Time labels */}
            {hours.map((h, i) => (
              <div key={h} className="col-start-1 border-b border-border p-2 text-xs text-muted-foreground font-mono" style={{ gridRow: i + 1 }}>{h}</div>
            ))}

            {/* Course blocks */}
            {days.map((day, dayIdx) => (
              schedule[day]?.map((block, bi) => (
                <div key={`${day}-${bi}`}
                  className={`border rounded-lg m-1 p-2 flex flex-col justify-center ${block.color} cursor-pointer hover:opacity-80 transition-opacity`}
                  style={{ gridColumn: dayIdx + 2, gridRow: `${block.rowStart} / span ${block.rowSpan}` }}>
                  <p className="text-xs font-semibold leading-tight">{block.course}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{block.room}</p>
                </div>
              ))
            ))}

            {/* Grid lines */}
            {hours.map((_, i) => (
              days.map((_, j) => (
                <div key={`grid-${i}-${j}`} className="border-b border-l border-border" style={{ gridColumn: j + 2, gridRow: i + 1 }} />
              ))
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

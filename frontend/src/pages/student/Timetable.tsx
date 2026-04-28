import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { registrationsApi, offeringsApi, coursesApi, CourseOut } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const DAY_ABBRS: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday",
};
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 – 18:00

const COLORS = [
  "bg-primary/15 border-primary/30 text-primary",
  "bg-info/15 border-info/30 text-info",
  "bg-success/15 border-success/30 text-success",
  "bg-accent/15 border-accent/30 text-accent",
  "bg-warning/15 border-warning/30 text-warning",
];

interface Block {
  course: string;
  code: string;
  room: string;
  day: string;
  startHour: number;
  endHour: number;
  color: string;
}

function parseSchedule(schedule: string, courseName: string, courseCode: string, room: string, colorIdx: number): Block[] {
  // Examples: "Mon/Wed 09:00-10:30", "Tue/Thu 11:00-12:30", "Mon/Wed/Fri 10:00-11:00"
  const match = schedule.match(/^([\w/]+)\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return [];
  const [, daysPart, sh, sm, eh] = match;
  const startHour = parseInt(sh) + parseInt(sm) / 60;
  const endHour = parseInt(eh);
  const color = COLORS[colorIdx % COLORS.length];
  return daysPart.split("/").map(abbr => DAY_ABBRS[abbr]).filter(Boolean).map(day => ({
    course: courseName,
    code: courseCode,
    room,
    day,
    startHour,
    endHour,
    color,
  }));
}

export default function Timetable() {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));
  const offeringMap = Object.fromEntries(offerings.map(o => [o.id, o]));

  const activeRegs = registrations.filter(r => r.status === "active");
  const blocks: Block[] = [];

  activeRegs.forEach((reg, idx) => {
    const offering = offeringMap[reg.offering_id];
    if (!offering?.schedule) return;
    const course = courseMap[offering.course_id];
    const parsed = parseSchedule(
      offering.schedule,
      course?.name ?? `Course #${offering.course_id}`,
      course?.code ?? "",
      offering.room ?? "",
      idx,
    );
    blocks.push(...parsed);
  });

  const blocksByDay: Record<string, Block[]> = {};
  DAYS.forEach(d => { blocksByDay[d] = blocks.filter(b => b.day === d); });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading timetable…</p></div>;
  }

  if (activeRegs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Weekly Timetable" description="Spring 2025 — Your class schedule" />
        <div className="bg-card rounded-xl border p-10 text-center shadow-card">
          <p className="text-muted-foreground">No active registrations yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Register for courses to see your timetable.</p>
        </div>
      </div>
    );
  }

  const ROW_HEIGHT = 60;
  const GRID_ROWS = HOURS.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Timetable" description="Spring 2025 — Your class schedule at a glance" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border shadow-card overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-6 border-b border-border">
            <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
            {DAYS.map(d => (
              <div key={d} className="p-3 text-xs font-semibold text-foreground text-center border-l border-border">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="relative grid grid-cols-6"
            style={{ gridTemplateRows: `repeat(${GRID_ROWS}, ${ROW_HEIGHT}px)` }}
          >
            {/* Time labels + row lines */}
            {HOURS.map((h, i) => (
              <div key={h} className="col-start-1 border-b border-border px-2 flex items-start pt-1"
                style={{ gridRow: i + 1 }}>
                <span className="text-xs text-muted-foreground font-mono">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}

            {/* Background grid cells */}
            {HOURS.map((_, ri) =>
              DAYS.map((_, ci) => (
                <div key={`g-${ri}-${ci}`} className="border-b border-l border-border"
                  style={{ gridColumn: ci + 2, gridRow: ri + 1 }} />
              ))
            )}

            {/* Course blocks */}
            {DAYS.map((day, dayIdx) =>
              blocksByDay[day].map((block, bi) => {
                const rowStart = Math.round((block.startHour - HOURS[0]) * 1) + 1;
                const rowSpan = Math.max(1, Math.round(block.endHour - block.startHour));
                return (
                  <div key={`${day}-${bi}`}
                    className={`border rounded-lg m-0.5 p-2 flex flex-col justify-center ${block.color} cursor-default overflow-hidden`}
                    style={{ gridColumn: dayIdx + 2, gridRow: `${rowStart} / span ${rowSpan}` }}>
                    <p className="text-xs font-semibold leading-tight truncate">{block.course}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 truncate">{block.code}</p>
                    {block.room && <p className="text-[10px] opacity-60 truncate">{block.room}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

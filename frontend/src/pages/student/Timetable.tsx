import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { offeringsApi } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);
const COLORS = [
  "bg-primary/15 border-primary/30 text-primary",
  "bg-info/15 border-info/30 text-info",
  "bg-success/15 border-success/30 text-success",
  "bg-accent/15 border-accent/30 text-accent",
  "bg-warning/15 border-warning/30 text-warning",
];

function timeToHour(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour + (minute || 0) / 60;
}

export default function Timetable() {
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["student-timetable"],
    queryFn: offeringsApi.studentTimetable,
  });

  if (isLoading) return <LoadingState label="Loading timetable from SQL..." />;
  if (error) return <ErrorState message={(error as Error).message} />;

  const entriesByDay = Object.fromEntries(DAYS.map((day) => [day, entries.filter((entry) => entry.day_of_week === day)]));
  const rowHeight = 60;

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Timetable" description="Your class schedule from SQL timetable entries" />

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <EmptyState label="No timetable entries found." />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-6 border-b">
              <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
              {DAYS.map((day) => <div key={day} className="border-l p-3 text-center text-xs font-semibold text-foreground">{day}</div>)}
            </div>

            <div className="relative grid grid-cols-6" style={{ gridTemplateRows: `repeat(${HOURS.length}, ${rowHeight}px)` }}>
              {HOURS.map((hour, index) => (
                <div key={hour} className="col-start-1 flex items-start border-b px-2 pt-1" style={{ gridRow: index + 1 }}>
                  <span className="font-mono text-xs text-muted-foreground">{String(hour).padStart(2, "0")}:00</span>
                </div>
              ))}

              {HOURS.map((_, rowIndex) => DAYS.map((_, columnIndex) => (
                <div key={`${rowIndex}-${columnIndex}`} className="border-b border-l" style={{ gridColumn: columnIndex + 2, gridRow: rowIndex + 1 }} />
              )))}

              {DAYS.map((day, dayIndex) => entriesByDay[day].map((entry, entryIndex) => {
                const start = timeToHour(entry.start_time);
                const end = timeToHour(entry.end_time);
                const rowStart = Math.max(1, Math.round(start - HOURS[0]) + 1);
                const rowSpan = Math.max(1, Math.ceil(end - start));
                return (
                  <div
                    key={entry.timetable_entry_id}
                    className={`m-0.5 overflow-hidden rounded-lg border p-2 ${COLORS[(dayIndex + entryIndex) % COLORS.length]}`}
                    style={{ gridColumn: dayIndex + 2, gridRow: `${rowStart} / span ${rowSpan}` }}
                  >
                    <p className="truncate text-xs font-semibold leading-tight">{entry.course_name}</p>
                    <p className="mt-0.5 truncate text-[10px] opacity-75">{entry.course_code} - {entry.start_time}-{entry.end_time}</p>
                    <p className="truncate text-[10px] opacity-65">{entry.room ?? "Room not set"}</p>
                  </div>
                );
              }))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

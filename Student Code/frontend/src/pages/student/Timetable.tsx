import { motion } from "framer-motion";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MapPin } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { offeringsApi, type TimetableEntryContext } from "@/lib/api";
import { dedupTimetable } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);

// Per-course colors. Each tuple = [bg, border, accent dot]. All text uses foreground for readability.
const COURSE_TINTS = [
  { bg: "bg-sky-500/15",     border: "border-sky-500/40",     dot: "bg-sky-500" },
  { bg: "bg-violet-500/15",  border: "border-violet-500/40",  dot: "bg-violet-500" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/40", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/15",   border: "border-amber-500/40",   dot: "bg-amber-500" },
  { bg: "bg-rose-500/15",    border: "border-rose-500/40",    dot: "bg-rose-500" },
  { bg: "bg-cyan-500/15",    border: "border-cyan-500/40",    dot: "bg-cyan-500" },
  { bg: "bg-pink-500/15",    border: "border-pink-500/40",    dot: "bg-pink-500" },
  { bg: "bg-lime-500/15",    border: "border-lime-500/40",    dot: "bg-lime-500" },
];

function timeToHour(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour + (minute || 0) / 60;
}

/** For a given day, lay out entries into columns so overlapping classes sit side by side instead of on top of each other. */
function layoutDay(entries: TimetableEntryContext[]) {
  const sorted = [...entries].sort((a, b) => timeToHour(a.start_time) - timeToHour(b.start_time));
  const lanes: { end: number }[] = [];
  const placed: { entry: TimetableEntryContext; lane: number }[] = [];
  for (const entry of sorted) {
    const start = timeToHour(entry.start_time);
    const end = timeToHour(entry.end_time);
    let laneIdx = lanes.findIndex((l) => l.end <= start);
    if (laneIdx === -1) {
      laneIdx = lanes.length;
      lanes.push({ end });
    } else {
      lanes[laneIdx].end = end;
    }
    placed.push({ entry, lane: laneIdx });
  }
  return { placed, laneCount: Math.max(1, lanes.length) };
}

export default function Timetable() {
  const { data: rawEntries = [], isLoading, error } = useQuery({
    queryKey: ["student-timetable"],
    queryFn: offeringsApi.studentTimetable,
  });
  const entries = useMemo(() => dedupTimetable(rawEntries), [rawEntries]);

  // Build a stable per-course color map so the same course is always the same color.
  const courseColor = useMemo(() => {
    const map = new Map<string, typeof COURSE_TINTS[number]>();
    const codes = [...new Set(entries.map((e) => e.course_code ?? `id-${e.course_offering_id}`))];
    codes.forEach((code, i) => map.set(code, COURSE_TINTS[i % COURSE_TINTS.length]));
    return map;
  }, [entries]);

  if (isLoading) return <LoadingState label="Loading timetable from SQL..." />;
  if (error) return <ErrorState message={(error as Error).message} />;

  const entriesByDay = Object.fromEntries(
    DAYS.map((day) => [day, entries.filter((entry) => entry.day_of_week === day)])
  ) as Record<typeof DAYS[number], TimetableEntryContext[]>;
  const layoutByDay = Object.fromEntries(
    DAYS.map((day) => [day, layoutDay(entriesByDay[day])])
  ) as Record<typeof DAYS[number], ReturnType<typeof layoutDay>>;

  const rowHeight = 60;
  const totalConflicts = Object.values(layoutByDay).reduce((s, l) => s + (l.laneCount > 1 ? 1 : 0), 0);

  // Build legend
  const legend = [...new Set(entries.map((e) => e.course_code ?? "?"))].map((code) => {
    const entry = entries.find((e) => e.course_code === code);
    const tint = courseColor.get(code) ?? COURSE_TINTS[0];
    return { code, name: entry?.course_name ?? code, tint };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Timetable" description="Your class schedule from SQL timetable entries" />

      {totalConflicts > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Schedule conflict detected</p>
            <p className="text-xs text-muted-foreground">
              You have overlapping classes on {totalConflicts} day{totalConflicts === 1 ? "" : "s"}. Both classes are shown side-by-side. Contact academic staff if this is unexpected.
            </p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <EmptyState label="No timetable entries found." />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-6 border-b bg-muted/30">
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

                {DAYS.map((day, dayIndex) => {
                  const { placed, laneCount } = layoutByDay[day];
                  return placed.map(({ entry, lane }) => {
                    const start = timeToHour(entry.start_time);
                    const end = timeToHour(entry.end_time);
                    const rowStart = Math.max(1, Math.round(start - HOURS[0]) + 1);
                    const rowSpan = Math.max(1, Math.ceil(end - start));
                    const tint = courseColor.get(entry.course_code ?? `id-${entry.course_offering_id}`) ?? COURSE_TINTS[0];
                    const widthPct = 100 / laneCount;
                    const leftPct = lane * widthPct;
                    return (
                      <div
                        key={`${entry.timetable_entry_id}-${lane}`}
                        className={`m-0.5 overflow-hidden rounded-lg border ${tint.bg} ${tint.border} p-2 text-foreground shadow-sm`}
                        style={{
                          gridColumn: dayIndex + 2,
                          gridRow: `${rowStart} / span ${rowSpan}`,
                          marginLeft: `calc(${leftPct}% + 2px)`,
                          marginRight: `calc(${100 - leftPct - widthPct}% + 2px)`,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${tint.dot}`} />
                          <p className="truncate text-xs font-semibold leading-tight">{entry.course_name}</p>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">
                          {entry.course_code} · {entry.start_time}–{entry.end_time}
                        </p>
                        <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />{entry.room ?? "Room not set"}
                        </p>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </motion.div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card p-3 shadow-sm">
            <span className="text-xs font-medium text-muted-foreground">Courses:</span>
            {legend.map((l) => (
              <span key={l.code} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${l.tint.dot}`} />
                <span className="font-mono font-medium text-foreground">{l.code}</span>
                <span className="text-muted-foreground">{l.name}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

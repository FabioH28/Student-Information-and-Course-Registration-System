import { motion } from "framer-motion";
import { Bell, BookOpen, Building2, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { notificationsApi, offeringsApi, TimetableEntryContext, type NotificationOut } from "@/lib/api";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DayGroup = {
  day_of_week: string;
  date?: string | null;
  is_today?: boolean;
  entries: TimetableEntryContext[];
};

function minutes(value?: string | null) {
  if (!value) return null;
  const [hours, mins] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
}

function isConsecutive(previous: TimetableEntryContext, current: TimetableEntryContext) {
  const previousEnd = minutes(previous.end_time);
  const currentStart = minutes(current.start_time);
  if (previousEnd === null || currentStart === null) return false;
  return currentStart - previousEnd >= 0 && currentStart - previousEnd <= 15;
}

function entryRoomKey(entry: TimetableEntryContext) {
  return entry.room_id ?? entry.room_name ?? entry.classroom_name ?? entry.lab_name ?? entry.auditorium_name ?? entry.room ?? "";
}

function mergeScheduleEntries(entries: TimetableEntryContext[]) {
  const buckets = new Map<string, TimetableEntryContext[]>();
  entries.forEach((entry) => {
    const key = [
      entry.course_id,
      entry.course_code,
      entry.course_name,
      entry.timetable_date ?? entry.date ?? "",
      entry.day_of_week,
      entry.building_code ?? "",
      entryRoomKey(entry),
    ].join("|");
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  });

  const merged: TimetableEntryContext[] = [];
  buckets.forEach((bucket) => {
    const ordered = [...bucket].sort((a, b) => a.start_time.localeCompare(b.start_time));
    let current: TimetableEntryContext | null = null;
    ordered.forEach((entry) => {
      const sessions = entry.sessions ?? [{ session_id: entry.timetable_entry_id, timetable_entry_id: entry.timetable_entry_id, start_time: entry.start_time, end_time: entry.end_time }];
      if (!current || !isConsecutive(current, entry)) {
        if (current) merged.push(current);
        current = { ...entry, timetable_entry_ids: entry.timetable_entry_ids ?? [entry.timetable_entry_id], sessions };
        return;
      }
      current = {
        ...current,
        end_time: entry.end_time > current.end_time ? entry.end_time : current.end_time,
        display_end_time: (entry.display_end_time ?? entry.end_time) > (current.display_end_time ?? current.end_time) ? (entry.display_end_time ?? entry.end_time) : (current.display_end_time ?? current.end_time),
        timetable_entry_ids: Array.from(new Set([...(current.timetable_entry_ids ?? []), ...(entry.timetable_entry_ids ?? [entry.timetable_entry_id])])),
        sessions: [...(current.sessions ?? []), ...sessions].sort((a, b) => a.start_time.localeCompare(b.start_time)),
      };
    });
    if (current) merged.push(current);
  });
  return merged.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function normalizeWeeklyTimetable(value: unknown): DayGroup[] {
  const incoming = Array.isArray(value) ? value : [];
  if (incoming.length > 0 && "entries" in (incoming[0] as Record<string, unknown>)) {
    const groups = incoming as DayGroup[];
    return WEEK_DAYS.map((day) => {
      const group = groups.find((item) => item.day_of_week === day);
      return group ? { ...group, entries: mergeScheduleEntries(group.entries) } : { day_of_week: day, entries: [] };
    });
  }
  const entries = incoming as TimetableEntryContext[];
  return WEEK_DAYS.map((day) => ({
    day_of_week: day,
    entries: mergeScheduleEntries(entries.filter((entry) => entry.day_of_week === day)),
  }));
}

function currentDayName() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

function cleanAcademicLine(period?: string | null, semester?: string | null) {
  const academicPeriod = period?.replace("-", "-") ?? "Academic year not set";
  return `${academicPeriod} - ${semester ? `${semester} Semester` : "Semester not set"}`;
}

function roomLabel(entry: TimetableEntryContext) {
  if (entry.auditorium_name) return `Auditorium ${entry.auditorium_name}`;
  if (entry.lab_name) return `Lab ${entry.lab_name}`;
  if (entry.classroom_name) return `Classroom ${entry.classroom_name}`;
  if (entry.room_name) return `${entry.room_type === "lab" ? "Lab" : entry.room_type === "auditorium" ? "Auditorium" : "Classroom"} ${entry.room_name}`;
  return entry.room ? entry.room.replace(/^(Room|Classroom)\s+/i, "") : "Room not assigned";
}

function shortDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function fullDate(value?: string | null) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start || !end) return "Time not set";
  const fmt = (value: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${value}`));
  return `${fmt(start)} - ${fmt(end)}`;
}

function weekNumberFromDate(value?: string | null) {
  if (!value) return null;
  const start = new Date("2026-02-16T00:00:00");
  const day = new Date(`${value}T00:00:00`);
  return Math.max(1, Math.floor((day.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function notificationTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function NotificationButton({ notifications }: { notifications: NotificationOut[] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-notifications"] }),
  });
  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-notifications"] }),
  });

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Notifications"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => markAllMutation.mutate()} disabled={unreadCount === 0 || markAllMutation.isPending}>
              Mark all read
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("w-full border-b px-3 py-2 text-left transition-colors hover:bg-muted/50", !item.is_read && "bg-purple-50/60")}
                  onClick={() => {
                    if (!item.is_read) markReadMutation.mutate(item.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {!item.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-600" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{notificationTime(item.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const today = currentDayName();
  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: offeringsApi.teacherDashboard,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["teacher-notifications"],
    queryFn: () => notificationsApi.list(false),
  });

  if (isLoading) return <LoadingState label="Loading dashboard..." />;
  if (error || !data) return <ErrorState message={(error as Error)?.message ?? "Could not load dashboard"} />;

  const stats = data.stats ?? {
    active_courses: data.active_courses,
    total_students: data.total_students,
    todays_classes: data.today_classes,
    next_class: null,
  };
  const weeklyTimetable = normalizeWeeklyTimetable(data.weekly_timetable);
  const teacherName = data.teacher?.name ?? data.teacher_name;
  const period = data.academic_period ?? data.academic_year;
  const semester = data.semester;
  const nextClass = stats.next_class;

  function openCourse(entry: TimetableEntryContext) {
    const date = entry.timetable_date ?? entry.date ?? "";
    const weekId = weekNumberFromDate(date);
    const params = new URLSearchParams();
    if (period) params.set("year", period);
    if (semester) params.set("semester", semester);
    if (weekId) params.set("weekId", String(weekId));
    if (date) params.set("date", date);
    const ids = entry.timetable_entry_ids ?? (entry.timetable_entry_id ? [entry.timetable_entry_id] : []);
    if (ids.length) params.set("sessionIds", ids.join(","));
    params.set("tab", "attendance");
    navigate(`/instructor/courses/${entry.course_offering_id}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card px-5 py-3.5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Welcome, {teacherName}</h2>
            <p className="text-sm text-muted-foreground">{cleanAcademicLine(period, semester)}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-muted-foreground">{data.current_week?.label ?? "Week not available"}</p>
            <NotificationButton notifications={notifications} />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Courses" value={stats.active_courses} subtitle="Assigned this semester" icon={BookOpen} variant="primary" delay={0.05} />
        <StatCard title="Total Students" value={stats.total_students} subtitle="Across your courses" icon={Users} variant="info" delay={0.1} />
        <StatCard title="Today's Classes" value={stats.todays_classes} subtitle={today} icon={CalendarDays} variant="success" delay={0.15} />
        <StatCard
          title="Next Class"
          value={nextClass ? nextClass.course_code : "No upcoming class"}
          subtitle={nextClass ? `${fullDate(nextClass.timetable_date ?? nextClass.date)} ${formatTimeRange(nextClass.start_time, nextClass.end_time)}` : "Nothing scheduled"}
          icon={Clock}
          variant="warning"
          delay={0.2}
        />
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card p-3.5 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Weekly Teaching Plan</h3>
            <p className="text-xs text-muted-foreground">Monday to Sunday calendar view</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[1050px] grid-cols-[repeat(7,minmax(150px,1fr))] gap-2.5">
            {weeklyTimetable.map((day) => {
              const isToday = day.is_today ?? day.day_of_week === today;
              return (
                <section
                  key={day.day_of_week}
                  className={cn(
                    "flex min-h-[420px] min-w-0 flex-col rounded-lg border bg-muted/20 p-2",
                    isToday && "border-primary/45 bg-primary/5 shadow-sm"
                  )}
                >
                  <div className="mb-2 flex min-h-[3.25rem] items-start justify-between gap-1.5 rounded-md bg-background/80 px-2 py-1.5">
                    <div className="min-w-0">
                      <h4 className={cn("truncate text-sm font-semibold leading-tight", isToday ? "text-primary" : "text-foreground")}>{day.day_of_week}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">{shortDate(day.date)}</p>
                    </div>
                    {isToday && <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary">Today</span>}
                  </div>

                  <div className="max-h-[350px] space-y-2 overflow-y-auto pr-0.5">
                    {day.entries.length === 0 ? (
                      <div className="rounded-md border border-dashed bg-background/60 px-2 py-4 text-center text-xs text-muted-foreground">
                        No classes
                      </div>
                    ) : (
                      day.entries.map((entry) => (
                        <button
                          key={`${entry.timetable_entry_id}-${entry.start_time}`}
                          type="button"
                          onClick={() => openCourse(entry)}
                          className={cn(
                            "min-h-[7.75rem] w-full cursor-pointer rounded-lg border bg-card px-2.5 py-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-md",
                            isToday && "border-primary/30"
                          )}
                        >
                          <span className="inline-flex max-w-full rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary">
                            <span className="truncate">{entry.course_code}</span>
                          </span>
                          <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground">{entry.course_name}</p>
                          <div className="mt-2 space-y-1 text-[11px] leading-tight text-muted-foreground">
                            <p className="flex min-w-0 items-center gap-1.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{entry.building_code ?? "Building not assigned"}</span>
                            </p>
                            <p className="flex min-w-0 items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{roomLabel(entry)}</span>
                            </p>
                            <p className="pt-1 text-[11px] font-medium text-foreground">
                              {formatTimeRange(entry.display_start_time ?? entry.start_time, entry.display_end_time ?? entry.end_time)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

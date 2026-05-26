import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState, EmptyState } from "@/components/academic/AcademicShared";
import { staffApi } from "@/lib/api";

export default function StaffTimetablePage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["staff-timetable"], queryFn: staffApi.timetable });

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Timetable" description="Schedules created and published by faculty staff" />
      {isLoading ? <LoadingState label="Loading timetable..." /> : data.length === 0 ? <EmptyState label="No timetable entries found." /> : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>{["Course", "Date", "Time", "Building", "Room", "Status"].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {data.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm font-medium">{entry.course_code} — {entry.course_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.timetable_date}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.start_time} – {entry.end_time}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.building_code}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.room_type}: {entry.room_name}</td>
                  <td className="px-4 py-3"><StatusBadge variant={entry.is_published ? "success" : "warning"}>{entry.is_published ? "Published" : "Draft"}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

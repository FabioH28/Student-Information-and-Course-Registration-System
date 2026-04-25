import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatTimeValue, titleize } from "@/lib/formatters";

interface InstructorTimetableResponse {
  teacher: {
    employee_number: string;
    title: string | null;
    office_location: string | null;
    employment_status: string;
    department_name: string;
  };
  meetings: Array<{
    offering_id: number;
    code: string;
    title: string;
    section_code: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_name: string | null;
    meeting_type: string;
  }>;
}

export default function InstructorTimetable() {
  const timetableQuery = useQuery({
    queryKey: ["instructor", "timetable"],
    queryFn: () => apiGet<InstructorTimetableResponse>("/instructors/me/timetable"),
  });

  if (timetableQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (timetableQuery.isError) {
    return (
      <ErrorState
        description={timetableQuery.error instanceof Error ? timetableQuery.error.message : "Instructor timetable could not be loaded."}
        onRetry={() => void timetableQuery.refetch()}
      />
    );
  }

  const data = timetableQuery.data;
  if (!data || data.meetings.length === 0) {
    return <EmptyState title="No timetable entries" description="Assigned teaching meetings will appear here once your offerings are scheduled." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Instructor Timetable" description="Your assigned teaching meetings across current course offerings" />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.meetings.map((meeting) => (
          <div key={`${meeting.offering_id}-${meeting.day_of_week}-${meeting.start_time}`} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {meeting.code} - Section {meeting.section_code}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{meeting.title}</h3>
              </div>
              <StatusBadge variant="info">{titleize(meeting.meeting_type)}</StatusBadge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Day</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {titleize(meeting.day_of_week)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Time</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {formatTimeValue(meeting.start_time)} - {formatTimeValue(meeting.end_time)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {meeting.room_name || "Room to be assigned"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatTimeValue, titleize } from "@/lib/formatters";

interface TimetableResponse {
  student_id: number;
  meetings: Array<{
    code: string;
    title: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location_name: string | null;
    meeting_type: string;
  }>;
}

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function Timetable() {
  const timetableQuery = useQuery({
    queryKey: ["student", "timetable"],
    queryFn: () => apiGet<TimetableResponse>("/students/me/timetable"),
  });

  if (timetableQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (timetableQuery.isError) {
    return (
      <ErrorState
        description={timetableQuery.error instanceof Error ? timetableQuery.error.message : "Timetable data could not be loaded."}
        onRetry={() => void timetableQuery.refetch()}
      />
    );
  }

  const timetable = timetableQuery.data;
  if (!timetable) {
    return <EmptyState title="No timetable available" description="Your current-term timetable will appear here once you are enrolled in scheduled classes." />;
  }

  const groupedMeetings = dayOrder
    .map((day) => ({
      day,
      items: timetable.meetings.filter((meeting) => meeting.day_of_week === day),
    }))
    .filter((entry) => entry.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Timetable" description="Your current-term schedule at a glance" />

      {groupedMeetings.length === 0 ? (
        <EmptyState title="No scheduled meetings yet" description="Once your current registrations include scheduled class meetings, they will show up here." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {groupedMeetings.map(({ day, items }, index) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border bg-card p-5 shadow-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{titleize(day)}</h3>
                <StatusBadge variant="info">{items.length} session{items.length === 1 ? "" : "s"}</StatusBadge>
              </div>

              <div className="space-y-3">
                {items.map((meeting) => (
                  <div key={`${meeting.code}-${meeting.start_time}`} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">{meeting.code}</p>
                      </div>
                      <StatusBadge variant="default">{titleize(meeting.meeting_type)}</StatusBadge>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>
                        {formatTimeValue(meeting.start_time)} - {formatTimeValue(meeting.end_time)}
                      </p>
                      <p>{meeting.location_name || "Location pending"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

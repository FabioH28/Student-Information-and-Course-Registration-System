import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatRelativeDateTime, titleize } from "@/lib/formatters";

interface TeacherInboxResponse {
  items: Array<{
    recipient_id: number;
    notification_id: number;
    category: string;
    severity: string;
    title: string;
    message: string;
    action_label: string | null;
    action_url: string | null;
    created_at: string;
    read_at: string | null;
  }>;
}

function getSeverityVariant(severity: string) {
  if (severity === "danger") {
    return "danger" as const;
  }
  if (severity === "warning") {
    return "warning" as const;
  }
  if (severity === "success") {
    return "success" as const;
  }
  return "info" as const;
}

export default function TeacherInbox() {
  const inboxQuery = useQuery({
    queryKey: ["instructor", "inbox"],
    queryFn: () => apiGet<TeacherInboxResponse>("/instructors/me/inbox"),
  });

  if (inboxQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (inboxQuery.isError) {
    return (
      <ErrorState
        description={inboxQuery.error instanceof Error ? inboxQuery.error.message : "Instructor inbox could not be loaded."}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const items = inboxQuery.data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="Inbox is clear"
        description="Instructor notifications will land here once the institution starts issuing workflow updates, reminders, and alerts."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.recipient_id} className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                {!item.read_at ? <StatusBadge variant="warning">Unread</StatusBadge> : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge variant={getSeverityVariant(item.severity)}>{titleize(item.severity)}</StatusBadge>
              <StatusBadge variant="default">{titleize(item.category)}</StatusBadge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{formatRelativeDateTime(item.created_at)}</span>
            {item.action_label && item.action_url ? <span>{item.action_label} available once that workflow is enabled</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

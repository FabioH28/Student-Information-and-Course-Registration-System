import { motion } from "framer-motion";
import { AlertTriangle, BellRing, CalendarDays, CircleDollarSign, Megaphone, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { formatRelativeDateTime, titleize } from "@/lib/formatters";

interface StudentInboxResponse {
  total: number;
  unread: number;
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
    delivered_at: string | null;
    read_at: string | null;
  }>;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "academic":
      return Sparkles;
    case "finance":
      return CircleDollarSign;
    case "registration":
      return BellRing;
    case "event":
      return CalendarDays;
    case "campus":
      return Megaphone;
    case "warning":
      return AlertTriangle;
    default:
      return BellRing;
  }
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

export default function StudentInbox() {
  const queryClient = useQueryClient();
  const inboxQuery = useQuery({
    queryKey: ["student", "inbox"],
    queryFn: () => apiGet<StudentInboxResponse>("/students/me/inbox"),
  });

  const invalidateInbox = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student", "inbox"] }),
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] }),
    ]);
  };

  const markAllReadMutation = useMutation({
    mutationFn: () => apiPost("/students/me/inbox/read-all", {}),
    onSuccess: async () => {
      await invalidateInbox();
      toast({
        title: "Inbox updated",
        description: "All visible notifications are marked as read.",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (recipientId: number) => apiPost(`/students/me/inbox/${recipientId}/read`, {}),
    onSuccess: async () => {
      await invalidateInbox();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (recipientId: number) => apiPost(`/students/me/inbox/${recipientId}/archive`, {}),
    onSuccess: async () => {
      await invalidateInbox();
      toast({
        title: "Notification archived",
        description: "The item has been removed from your main inbox.",
      });
    },
  });

  if (inboxQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (inboxQuery.isError) {
    return (
      <ErrorState
        description={inboxQuery.error instanceof Error ? inboxQuery.error.message : "Inbox data could not be loaded."}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const inbox = inboxQuery.data;
  if (!inbox) {
    return <EmptyState title="No inbox yet" description="Notifications will appear here once your account starts receiving campus updates." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" description="All alerts, reminders, updates, and warning messages in one place">
        <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending || inbox.unread === 0}>
          {markAllReadMutation.isPending ? "Updating..." : "Mark all as read"}
        </Button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-primary/5 p-5 shadow-card"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <BellRing className="h-4 w-4" />
              <p className="text-sm font-medium">Unified Notifications</p>
            </div>
            <h3 className="mt-2 text-xl font-bold text-foreground">Warnings now live alongside your normal updates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Academic alerts, finance reminders, registration messages, and campus notices all show up here so you only have one place to check.
            </p>
          </div>

          <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{inbox.total} active notifications</p>
            <p className="text-muted-foreground">{inbox.unread} unread</p>
          </div>
        </div>
      </motion.div>

      {inbox.items.length === 0 ? (
        <EmptyState title="Your inbox is clear" description="New reminders, alerts, and notices will start appearing here as soon as the system sends them." />
      ) : (
        <div className="space-y-3">
          {inbox.items.map((item, index) => {
            const Icon = getCategoryIcon(item.category);
            const variant = getSeverityVariant(item.severity);

            return (
              <motion.div
                key={item.recipient_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="rounded-lg bg-muted p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{titleize(item.category)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge variant={variant}>{titleize(item.severity)}</StatusBadge>
                        {item.read_at === null && <StatusBadge variant="warning">Unread</StatusBadge>}
                        <span className="text-xs text-muted-foreground">{formatRelativeDateTime(item.created_at)}</span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">{item.message}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {item.action_label && item.action_url ? (
                        <a href={item.action_url} className="inline-flex text-sm font-medium text-primary hover:underline">
                          {item.action_label}
                        </a>
                      ) : null}
                      {item.read_at === null ? (
                        <Button variant="outline" size="sm" onClick={() => markReadMutation.mutate(item.recipient_id)} disabled={markReadMutation.isPending}>
                          Mark as read
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate(item.recipient_id)} disabled={archiveMutation.isPending}>
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

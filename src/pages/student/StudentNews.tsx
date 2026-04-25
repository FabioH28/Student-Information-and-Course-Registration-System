import { motion } from "framer-motion";
import { CalendarDays, Clock3, MapPin, Megaphone, Newspaper } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, formatDateTime, titleize } from "@/lib/formatters";

interface StudentNewsResponse {
  announcements: Array<{
    id: number;
    post_type: string;
    title: string;
    summary: string;
    priority: string;
    status: string;
    featured: boolean;
    published_at: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    organizer_name: string;
    event_type: string;
    location_name: string;
    delivery_mode: string;
    registration_required: boolean;
    capacity: number | null;
    starts_at: string;
    ends_at: string;
    status: string;
    registration_status: string | null;
  }>;
}

function getPriorityVariant(priority: string) {
  if (priority === "urgent" || priority === "important") {
    return "warning" as const;
  }

  if (priority === "update") {
    return "info" as const;
  }

  return "default" as const;
}

export default function StudentNews() {
  const queryClient = useQueryClient();
  const newsQuery = useQuery({
    queryKey: ["student", "news"],
    queryFn: () => apiGet<StudentNewsResponse>("/students/me/news"),
  });
  const registerEventMutation = useMutation({
    mutationFn: (eventId: number) => apiPost<{ status: string; message: string }>(`/students/me/events/${eventId}/register`, {}),
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student", "news"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "clubs"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "inbox"] }),
      ]);
      toast({
        title: "Event registration updated",
        description: payload.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to register for event",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  if (newsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (newsQuery.isError) {
    return (
      <ErrorState
        description={newsQuery.error instanceof Error ? newsQuery.error.message : "News data could not be loaded."}
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  const news = newsQuery.data;
  if (!news) {
    return <EmptyState title="No campus updates yet" description="Announcements and events will appear here once campus communications are published." />;
  }

  const featuredAnnouncement = news.announcements.find((item) => item.featured) ?? news.announcements[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Campus News" description="Stay current with announcements, updates, and upcoming events">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("campus-events")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <CalendarDays className="mr-2 h-4 w-4" /> Event Calendar
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
              <Megaphone className="h-4 w-4" />
              <p className="text-sm font-medium">Featured Update</p>
            </div>
            <h3 className="mt-2 text-xl font-bold text-foreground">
              {featuredAnnouncement?.title ?? "Campus communications will appear here"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {featuredAnnouncement?.summary ?? "Once announcements are published, the most important update will be highlighted here."}
            </p>
          </div>

          <StatusBadge variant="info">
            {featuredAnnouncement ? formatDate(featuredAnnouncement.published_at, "New") : "No posts yet"}
          </StatusBadge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Announcements</h3>
          </div>

          {news.announcements.length === 0 ? (
            <EmptyState title="No announcements published" description="Campus announcements will show up here when they are published for your audience." />
          ) : (
            <div className="space-y-4">
              {news.announcements.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                      <p className="mt-3 text-xs text-muted-foreground">{titleize(item.post_type)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge variant={getPriorityVariant(item.priority)}>{titleize(item.priority)}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          id="campus-events"
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Upcoming Events</h3>

          {news.events.length === 0 ? (
            <EmptyState title="No upcoming events" description="Published campus events for your audience will appear here." />
          ) : (
            <div className="space-y-3">
              {news.events.map((event) => (
                <div key={event.id} className="rounded-lg bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.organizer_name}</p>
                    </div>
                    <StatusBadge variant="info">{titleize(event.event_type)}</StatusBadge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatDate(event.starts_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatDateTime(event.starts_at)} </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{event.location_name}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {event.registration_status ? (
                      <StatusBadge variant={event.registration_status === "registered" ? "success" : "warning"}>
                        {titleize(event.registration_status)}
                      </StatusBadge>
                    ) : null}
                    <Button
                      size="sm"
                      variant={event.registration_status ? "outline" : "default"}
                      className="w-full sm:w-auto"
                      onClick={() => registerEventMutation.mutate(event.id)}
                      disabled={Boolean(event.registration_status) || registerEventMutation.isPending}
                    >
                      {event.registration_status
                        ? titleize(event.registration_status)
                        : event.registration_required
                          ? "Register"
                          : "Save Spot"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

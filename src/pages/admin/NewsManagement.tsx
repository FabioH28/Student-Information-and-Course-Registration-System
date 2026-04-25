import { motion } from "framer-motion";
import { CalendarDays, Megaphone, Newspaper, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CampusEventDialog, type CampusEventItem } from "@/components/admin/CampusEventDialog";
import { type ClubItem } from "@/components/admin/ClubDialog";
import { NewsPostDialog, type NewsPostItem } from "@/components/admin/NewsPostDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, titleize } from "@/lib/formatters";

interface NewsManagementResponse {
  posts: NewsPostItem[];
  events: CampusEventItem[];
}

interface ClubOverviewResponse {
  clubs: ClubItem[];
}

function getStatusVariant(status: string) {
  if (status === "published" || status === "open") {
    return "success" as const;
  }

  if (status === "scheduled" || status === "internal") {
    return "info" as const;
  }

  return "warning" as const;
}

export default function NewsManagement() {
  const [postOpen, setPostOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const newsQuery = useQuery({
    queryKey: ["communications", "overview"],
    queryFn: () => apiGet<NewsManagementResponse>("/communications/overview"),
  });

  const clubsQuery = useQuery({
    queryKey: ["communications", "clubs"],
    queryFn: () => apiGet<ClubOverviewResponse>("/communications/clubs/overview"),
  });

  if (newsQuery.isLoading || clubsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (newsQuery.isError) {
    return (
      <ErrorState
        description={newsQuery.error instanceof Error ? newsQuery.error.message : "News overview could not be loaded."}
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  if (clubsQuery.isError || !clubsQuery.data) {
    return (
      <ErrorState
        description={clubsQuery.error instanceof Error ? clubsQuery.error.message : "Club data could not be loaded."}
        onRetry={() => void clubsQuery.refetch()}
      />
    );
  }

  const news = newsQuery.data;
  if (!news) {
    return <EmptyState title="No communication data yet" description="Announcements and event management will appear here once those records exist." />;
  }

  const selectedPost = news.posts.find((item) => item.id === selectedPostId) ?? null;
  const selectedEvent = news.events.find((item) => item.id === selectedEventId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements & Events" description="Publish announcements, schedule events, and manage campus communications">
        <Button variant="outline" size="sm" onClick={() => setEventOpen(true)}>
          <CalendarDays className="mr-2 h-4 w-4" /> New Event
        </Button>
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setPostOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Published Posts" value={news.posts.filter((item) => item.status === "published").length} subtitle="Currently published" icon={Newspaper} variant="primary" />
        <StatCard title="Scheduled Events" value={news.events.length} subtitle="Tracked in CIS" icon={CalendarDays} variant="info" />
        <StatCard title="Featured Posts" value={news.posts.filter((item) => item.featured).length} subtitle="Pinned or highlighted" icon={Megaphone} variant="success" />
        <StatCard title="Expected Reach" value={news.events.reduce((sum, event) => sum + Number(event.expected_attendees || 0), 0)} subtitle="Projected attendees" icon={Users} variant="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Publishing Queue</h3>
          </div>

          {news.posts.length === 0 ? (
            <EmptyState title="No news posts yet" description="News posts will appear here once they are drafted or published." />
          ) : (
            <div className="space-y-3">
              {news.posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPostId(post.id)}
                  className="flex w-full flex-col gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {titleize(post.post_type)} - {titleize(post.priority)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge variant={getStatusVariant(post.status)}>{titleize(post.status)}</StatusBadge>
                    <span className="text-xs text-muted-foreground">{formatDate(post.activity_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Managed Events</h3>

          {news.events.length === 0 ? (
            <EmptyState title="No campus events yet" description="Campus events will appear here once they are scheduled." />
          ) : (
            <div className="space-y-3">
              {news.events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className="w-full rounded-lg bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.organizer_name}</p>
                    </div>
                    <StatusBadge variant={getStatusVariant(event.status)}>{titleize(event.status)}</StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {event.expected_attendees ?? 0} expected attendees - {formatDate(event.starts_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <NewsPostDialog open={postOpen} onOpenChange={setPostOpen} />
      <CampusEventDialog open={eventOpen} onOpenChange={setEventOpen} clubs={clubsQuery.data.clubs} />
      <NewsPostDialog
        open={Boolean(selectedPost)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPostId(null);
          }
        }}
        post={selectedPost}
      />
      <CampusEventDialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEventId(null);
          }
        }}
        clubs={clubsQuery.data.clubs}
        event={selectedEvent}
      />
    </div>
  );
}

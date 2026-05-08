import { motion } from "framer-motion";
import { CalendarDays, Megaphone, Newspaper, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, titleize } from "@/lib/formatters";

interface CommunicationsDashboardResponse {
  posts: Array<{
    id: number;
    post_type: string;
    title: string;
    summary: string;
    priority: string;
    status: string;
    featured: boolean;
    activity_at: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    event_type: string;
    status: string;
    starts_at: string;
    location_name: string | null;
  }>;
}

interface ClubOverviewResponse {
  clubs: Array<{
    club_id: number;
    club_name: string;
    club_status: string;
    active_members: number;
    pending_requests: number;
  }>;
}

function getPostStatusVariant(status: string) {
  if (status === "published") return "success" as const;
  if (status === "scheduled") return "info" as const;
  return "warning" as const;
}

function getEventStatusVariant(status: string) {
  if (status === "open" || status === "published") return "success" as const;
  if (status === "internal") return "info" as const;
  return "warning" as const;
}

export default function CommunicationsDashboard() {
  const newsQuery = useQuery({
    queryKey: ["communications", "overview"],
    queryFn: () => apiGet<CommunicationsDashboardResponse>("/communications/overview"),
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
        description={newsQuery.error instanceof Error ? newsQuery.error.message : "Communications data could not be loaded."}
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  const posts = newsQuery.data?.posts ?? [];
  const events = newsQuery.data?.events ?? [];
  const clubs = clubsQuery.data?.clubs ?? [];

  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const upcomingEvents = events.filter((e) => e.status === "open" || e.status === "scheduled").length;
  const pendingRequests = clubs.reduce((sum, c) => sum + (c.pending_requests ?? 0), 0);
  const activeClubs = clubs.filter((c) => c.club_status === "active").length;
  const recentPosts = posts.slice(0, 5);
  const recentEvents = events.slice(0, 5);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Communications Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live overview of news posts, campus events, and student clubs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Posts" value={posts.length} icon={Newspaper} variant="primary" delay={0.05} />
        <StatCard title="Published" value={publishedPosts} icon={Megaphone} variant="success" delay={0.1} />
        <StatCard title="Upcoming Events" value={upcomingEvents} icon={CalendarDays} variant="info" delay={0.15} />
        <StatCard title="Active Clubs" value={activeClubs} icon={Trophy} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Recent Posts</h3>
          {recentPosts.length === 0 ? (
            <EmptyState title="No posts yet" description="Published news posts and announcements will appear here." />
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {titleize(post.post_type)} · {formatDate(post.activity_at)}
                    </p>
                  </div>
                  <StatusBadge variant={getPostStatusVariant(post.status)}>{titleize(post.status)}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Upcoming Events</h3>
          {recentEvents.length === 0 ? (
            <EmptyState title="No events yet" description="Campus events will appear here once created." />
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {titleize(event.event_type)} · {formatDate(event.starts_at)}
                      {event.location_name ? ` · ${event.location_name}` : ""}
                    </p>
                  </div>
                  <StatusBadge variant={getEventStatusVariant(event.status)}>{titleize(event.status)}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {clubs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Club Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Club", "Members", "Pending Requests", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clubs.map((club) => (
                  <tr key={club.club_id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{club.club_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{club.active_members}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {club.pending_requests > 0 ? (
                        <span className="font-medium text-warning">{club.pending_requests}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={club.club_status === "active" ? "success" : "default"}>
                        {titleize(club.club_status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { CalendarDays, Search, Sparkles, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, formatTimeValue, titleize } from "@/lib/formatters";

interface StudentClubsResponse {
  memberships: Array<{
    id: number;
    club_id: number;
    club_name: string;
    category_name: string;
    member_role: string;
    status: string;
    joined_at: string | null;
    meeting_day_of_week: string | null;
    meeting_start_time: string | null;
    meeting_end_time: string | null;
    meeting_location: string | null;
  }>;
  directory: Array<{
    club_id: number;
    club_code: string;
    club_name: string;
    category_name: string;
    club_status: string;
    join_mode: string;
    active_members: number;
    pending_requests: number;
    description: string | null;
    meeting_day_of_week: string | null;
    meeting_start_time: string | null;
    meeting_end_time: string | null;
    meeting_location: string | null;
  }>;
  events: Array<{
    id: number;
    title: string;
    organizer_name: string;
    event_type: string;
    location_name: string;
    registration_required: boolean;
    capacity: number | null;
    starts_at: string;
    status: string;
    club_name: string | null;
    registration_status: string | null;
  }>;
  join_requests: Array<{
    id: number;
    club_id: number;
    club_name: string;
    requested_role: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
  }>;
}

interface JoinClubResponse {
  status: string;
  message: string;
}

function getClubStatusVariant(status: string) {
  if (status === "active" || status === "open" || status === "joined") {
    return "success" as const;
  }

  if (status === "waitlist" || status === "waitlisted" || status === "requested" || status === "pending") {
    return "warning" as const;
  }

  return "info" as const;
}

export default function StudentClubs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const clubsQuery = useQuery({
    queryKey: ["student", "clubs"],
    queryFn: () => apiGet<StudentClubsResponse>("/students/me/clubs"),
  });

  const joinClubMutation = useMutation({
    mutationFn: (clubId: number) => apiPost<JoinClubResponse>(`/students/me/clubs/${clubId}/join`, {}),
    onSuccess: (payload) => {
      toast({
        title: "Club request updated",
        description: payload.message,
      });
      void queryClient.invalidateQueries({ queryKey: ["student", "clubs"] });
    },
    onError: (error) => {
      toast({
        title: "Could not update club status",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });
  const registerEventMutation = useMutation({
    mutationFn: (eventId: number) => apiPost<{ status: string; message: string }>(`/students/me/events/${eventId}/register`, {}),
    onSuccess: (payload) => {
      toast({
        title: "Event registration updated",
        description: payload.message,
      });
      void queryClient.invalidateQueries({ queryKey: ["student", "clubs"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "news"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "inbox"] });
    },
    onError: (error) => {
      toast({
        title: "Could not register for event",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const membershipClubIds = useMemo(
    () => new Set(clubsQuery.data?.memberships.map((item) => item.club_id) ?? []),
    [clubsQuery.data?.memberships],
  );
  const requestClubIds = useMemo(
    () => new Set(clubsQuery.data?.join_requests.map((item) => item.club_id) ?? []),
    [clubsQuery.data?.join_requests],
  );

  if (clubsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (clubsQuery.isError) {
    return (
      <ErrorState
        description={clubsQuery.error instanceof Error ? clubsQuery.error.message : "Club data could not be loaded."}
        onRetry={() => void clubsQuery.refetch()}
      />
    );
  }

  const clubs = clubsQuery.data;
  if (!clubs) {
    return <EmptyState title="No club data yet" description="Club memberships and the directory will appear here when campus organizations are available." />;
  }

  const filteredClubs = clubs.directory.filter((club) => {
    const term = search.toLowerCase();
    return club.club_name.toLowerCase().includes(term) || club.category_name.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clubs" description="Join student organizations and keep up with campus club life">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("club-events")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <CalendarDays className="mr-2 h-4 w-4" /> Upcoming Events
        </Button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-secondary/80 p-5 text-secondary-foreground shadow-card"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-medium">Campus Life</p>
            </div>
            <h3 className="mt-2 text-xl font-bold">Build your profile outside the classroom</h3>
            <p className="mt-1 text-sm text-secondary-foreground/80">
              Discover clubs that match your interests, track events, and manage the organizations you already belong to.
            </p>
          </div>

          <div className="rounded-xl bg-secondary-foreground/10 px-4 py-3 text-sm">
            <p className="font-semibold">{clubs.memberships.length} active memberships</p>
            <p className="text-secondary-foreground/75">{clubs.events.length} upcoming club events</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-foreground">Club Directory</h3>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clubs..." className="pl-9" />
            </div>
          </div>

          {filteredClubs.length === 0 ? (
            <EmptyState title="No clubs match that search" description="Try a different club name or category." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredClubs.map((club, index) => {
                const isMember = membershipClubIds.has(club.club_id);
                const hasPendingRequest = requestClubIds.has(club.club_id);
                const joinLabel = isMember
                  ? "Already joined"
                  : hasPendingRequest
                    ? "Request submitted"
                    : club.join_mode === "open"
                      ? "Join Club"
                      : club.join_mode === "waitlist"
                        ? "Join Waitlist"
                        : "Request Access";

                return (
                  <motion.div
                    key={club.club_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border p-4 transition-shadow hover:shadow-card-hover"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <StatusBadge variant={getClubStatusVariant(club.join_mode === "open" ? "open" : club.join_mode)}>
                        {titleize(club.join_mode)}
                      </StatusBadge>
                    </div>

                    <p className="text-xs text-muted-foreground">{club.category_name}</p>
                    <h4 className="mt-1 font-semibold text-foreground">{club.club_name}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{club.description || "No club description has been published yet."}</p>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {club.active_members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />{" "}
                        {club.meeting_day_of_week && club.meeting_start_time
                          ? `${titleize(club.meeting_day_of_week)} ${formatTimeValue(club.meeting_start_time)}`
                          : "Meeting TBD"}
                      </span>
                    </div>

                    <Button
                      className="mt-4 w-full"
                      variant={isMember ? "outline" : "default"}
                      disabled={isMember || hasPendingRequest || joinClubMutation.isPending}
                      onClick={() => joinClubMutation.mutate(club.club_id)}
                    >
                      {joinLabel}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-card p-5 shadow-card"
          >
            <h3 className="mb-4 font-semibold text-foreground">My Clubs</h3>
            {clubs.memberships.length === 0 ? (
              <EmptyState title="No memberships yet" description="Once you join a club, your active memberships will be listed here." />
            ) : (
              <div className="space-y-3">
                {clubs.memberships.map((club) => (
                  <div key={club.id} className="rounded-lg bg-muted/40 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{club.club_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {titleize(club.member_role)} -{" "}
                          {club.meeting_day_of_week && club.meeting_start_time
                            ? `${titleize(club.meeting_day_of_week)} ${formatTimeValue(club.meeting_start_time)}`
                            : "Meeting TBD"}
                        </p>
                      </div>
                      <StatusBadge variant={getClubStatusVariant(club.status)}>{titleize(club.status)}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            id="club-events"
            className="rounded-xl border bg-card p-5 shadow-card"
          >
            <h3 className="mb-4 font-semibold text-foreground">Upcoming Events</h3>
            {clubs.events.length === 0 ? (
              <EmptyState title="No club events scheduled" description="Club events will show up here once they are published." />
            ) : (
              <div className="space-y-3">
                {clubs.events.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{event.club_name || event.organizer_name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusBadge variant="info">{titleize(event.event_type)}</StatusBadge>
                      <span className="text-xs font-medium text-foreground">{formatDate(event.starts_at)}</span>
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
    </div>
  );
}

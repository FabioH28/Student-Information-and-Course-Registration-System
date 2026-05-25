import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Search, Trophy, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DirectoryClub {
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
  meeting_location: string | null;
}
interface Membership { id: number; club_id: number; club_name: string; member_role: string; status: string; }
interface JoinRequest { id: number; club_id: number; club_name: string; status: string; }
interface ClubEvent { id: number; title: string; club_name: string | null; organizer_name: string; event_type: string; starts_at: string; }
interface ClubsResponse { memberships: Membership[]; directory: DirectoryClub[]; events: ClubEvent[]; join_requests: JoinRequest[]; }

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StudentClubs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["student-clubs"],
    queryFn: () => api.get<ClubsResponse>("/clubs"),
  });

  const join = useMutation({
    mutationFn: (clubId: number) => api.post<{ status?: string; message?: string }>(`/clubs/${clubId}/join`, {}),
    onSuccess: (result, clubId) => {
      queryClient.invalidateQueries({ queryKey: ["student-clubs"] });
      const club = data?.directory.find((c) => c.club_id === clubId);
      const status = result?.status ?? "submitted";
      const isApproved = status === "active" || status === "approved";
      toast({
        title: isApproved ? `Joined ${club?.club_name ?? "club"}` : `Request sent to ${club?.club_name ?? "club"}`,
        description: result?.message ?? (isApproved
          ? "You're now an active member."
          : "Waiting for the club advisor or academic staff to review your request."),
      });
    },
    onError: (e: Error) => toast({ title: "Could not join club", description: e.message, variant: "destructive" }),
  });

  const memberClubIds = useMemo(() => new Set((data?.memberships ?? []).map((m) => m.club_id)), [data]);
  const requestClubIds = useMemo(() => new Set((data?.join_requests ?? []).map((r) => r.club_id)), [data]);

  const directory = (data?.directory ?? []).filter((c) => {
    const t = search.toLowerCase();
    return c.club_name.toLowerCase().includes(t) || c.category_name.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clubs" subtitle="Join student organizations and keep up with campus club life" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-foreground">Club Directory</h3>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clubs…" className="pl-9" />
              </div>
            </div>
            {directory.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  {search ? "No clubs match your search." : "No clubs available yet."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search
                    ? "Try a different search term."
                    : "Check back soon — academic staff publishes new clubs throughout the semester."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {directory.map((c) => {
                  const isMember = memberClubIds.has(c.club_id);
                  const hasRequest = requestClubIds.has(c.club_id);
                  const label = isMember ? "Already joined" : hasRequest ? "Request submitted"
                    : c.join_mode === "open" ? "Join Club" : c.join_mode === "waitlist" ? "Join Waitlist" : "Request Access";
                  return (
                    <div key={c.club_id} className="rounded-xl border p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="rounded-lg bg-primary/10 p-2"><Trophy className="h-4 w-4 text-primary" /></div>
                        <StatusBadge variant="info">{c.join_mode}</StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.category_name}</p>
                      <h4 className="mt-1 font-semibold text-foreground">{c.club_name}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{c.description || "No description yet."}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.active_members} members</span>
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />
                          {c.meeting_day_of_week ? `${c.meeting_day_of_week} ${c.meeting_start_time?.slice(0, 5) ?? ""}` : "Meeting TBD"}
                        </span>
                      </div>
                      <Button className="mt-4 w-full" variant={isMember || hasRequest ? "outline" : "default"}
                        disabled={isMember || hasRequest || join.isPending}
                        onClick={() => join.mutate(c.club_id)}>
                        {label}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-4 font-semibold text-foreground">My Clubs</h3>
              {(data?.memberships ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't joined any clubs yet.</p>
              ) : (
                <div className="space-y-3">
                  {data!.memberships.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.club_name}</p>
                        <p className="text-xs text-muted-foreground">{m.member_role}</p>
                      </div>
                      <StatusBadge variant="success">{m.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
              {(data?.join_requests ?? []).length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Pending requests</p>
                  <div className="space-y-2">
                    {data!.join_requests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <p className="text-sm text-foreground">{r.club_name}</p>
                        <StatusBadge variant="warning">{r.status}</StatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-4 font-semibold text-foreground">Club Events</h3>
              {(data?.events ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No club events scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {data!.events.map((e) => (
                    <div key={e.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{e.club_name || e.organizer_name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge variant="info">{e.event_type}</StatusBadge>
                        <span className="text-xs font-medium text-foreground">{formatDate(e.starts_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

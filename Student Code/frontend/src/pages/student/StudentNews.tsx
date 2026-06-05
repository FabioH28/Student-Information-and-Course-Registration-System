import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Megaphone, Newspaper } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  content: string;
  target_role: string | null;
  published_at: string;
}
interface FeedEvent {
  id: number;
  title: string;
  organizer_name: string;
  event_type: string;
  location_name: string | null;
  registration_required: boolean;
  capacity: number | null;
  starts_at: string;
  status: string;
  registration_status: string | null;
}
interface FeedResponse {
  announcements: Announcement[];
  events: FeedEvent[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function StudentNews() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["student-news"],
    queryFn: () => api.get<FeedResponse>("/communications/feed"),
  });

  const register = useMutation({
    mutationFn: (eventId: number) => api.post(`/communications/events/${eventId}/register`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-news"] }),
  });

  const announcements = data?.announcements ?? [];
  const events = data?.events ?? [];
  const featured = announcements[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Campus News" subtitle="Announcements, updates and upcoming events" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {featured && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-primary/5 p-5 shadow-card">
              <div className="flex items-center gap-2 text-primary">
                <Megaphone className="h-4 w-4" />
                <p className="text-sm font-medium">Featured Update</p>
              </div>
              <h3 className="mt-2 text-xl font-bold text-foreground">{featured.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{featured.content}</p>
              <p className="mt-3 text-xs text-muted-foreground">{formatDate(featured.published_at)}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Announcements</h3>
              </div>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements published yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.published_at)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-4 font-semibold text-foreground">Upcoming Events</h3>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((e) => (
                    <div key={e.id} className="rounded-lg bg-muted/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{e.title}</p>
                        <StatusBadge variant="info">{e.event_type}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{e.organizer_name}</p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{formatDate(e.starts_at)}</div>
                        <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{formatTime(e.starts_at)}</div>
                        {e.location_name && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{e.location_name}</div>}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {e.registration_status && (
                          <StatusBadge variant={e.registration_status === "registered" ? "success" : "warning"}>
                            {e.registration_status}
                          </StatusBadge>
                        )}
                        <Button size="sm" variant={e.registration_status ? "outline" : "default"}
                          disabled={Boolean(e.registration_status) || register.isPending}
                          onClick={() => register.mutate(e.id)}>
                          {e.registration_status ? e.registration_status : e.registration_required ? "Register" : "Save Spot"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

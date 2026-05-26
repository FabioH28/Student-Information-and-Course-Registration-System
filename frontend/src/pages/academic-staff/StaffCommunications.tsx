import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Megaphone, Newspaper, Trophy, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface Stats { announcements: number; events: number; upcoming_events: number; clubs: number; pending_requests: number; }
interface Dashboard { stats: Stats; recent_announcements: { id: number; title: string; published_at: string }[]; upcoming_events: EventRow[]; }
interface EventRow { id: number; title: string; organizer_name: string; event_type: string; location_name: string | null; starts_at: string; status: string; }
interface AnnouncementRow { id: number; title: string; content: string; target_role: string | null; published_at: string; }
interface ClubRow { club_id: number; club_code: string; club_name: string; club_status: string; join_mode: string; active_members: number; pending_requests: number; }
interface RequestRow { id: number; club_name: string; student_name: string; student_code: string; status: string; submitted_at: string; }

type Tab = "overview" | "news" | "events" | "requests";

function fmt(v: string) { return new Date(v).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function StaffCommunications() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const dashboard = useQuery({ queryKey: ["comms-dashboard"], queryFn: () => api.get<Dashboard>("/communications/dashboard") });
  const announcements = useQuery({ queryKey: ["comms-announcements"], queryFn: () => api.get<AnnouncementRow[]>("/communications/announcements"), enabled: tab === "news" });
  const overview = useQuery({ queryKey: ["comms-clubs-overview"], queryFn: () => api.get<{ clubs: ClubRow[]; join_requests: RequestRow[] }>("/communications/clubs/overview"), enabled: tab === "requests" || tab === "overview" });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["comms-dashboard"] });
    qc.invalidateQueries({ queryKey: ["comms-announcements"] });
    qc.invalidateQueries({ queryKey: ["comms-clubs-overview"] });
  };

  // ── forms ──
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const createAnn = useMutation({
    mutationFn: () => api.post("/communications/announcements", { title: annTitle, content: annContent, target_role: null }),
    onSuccess: () => { setAnnTitle(""); setAnnContent(""); refresh(); },
  });

  const [evTitle, setEvTitle] = useState("");
  const [evOrg, setEvOrg] = useState("");
  const [evType, setEvType] = useState("event");
  const [evLoc, setEvLoc] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evEnd, setEvEnd] = useState("");
  const [evErr, setEvErr] = useState<string | null>(null);
  const createEvent = useMutation({
    mutationFn: () => api.post("/communications/events", {
      title: evTitle, organizer_name: evOrg, event_type: evType, location_name: evLoc,
      starts_at: evStart, ends_at: evEnd || null, status: "open", registration_required: false,
    }),
    onSuccess: () => { setEvTitle(""); setEvOrg(""); setEvLoc(""); setEvStart(""); setEvEnd(""); setEvErr(null); refresh(); },
    onError: (e: unknown) => setEvErr(e instanceof Error ? e.message : "Could not create event."),
  });

  const review = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: string }) => api.put(`/communications/clubs/requests/${id}`, { decision }),
    onSuccess: () => refresh(),
  });

  const stats = dashboard.data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader title="Communications" subtitle="Announcements, events and club requests" />

      <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1">
        {([["overview", "Overview"], ["news", "News"], ["events", "Events"], ["requests", "Club Requests"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}{k === "requests" && stats?.pending_requests ? ` (${stats.pending_requests})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title="Announcements" value={stats?.announcements ?? 0} icon={Newspaper} />
            <StatCard title="Upcoming Events" value={stats?.upcoming_events ?? 0} icon={CalendarDays} />
            <StatCard title="Clubs" value={stats?.clubs ?? 0} icon={Trophy} />
            <StatCard title="Pending Requests" value={stats?.pending_requests ?? 0} icon={Users} />
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-foreground">Club Overview</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Club</th><th className="px-3 py-2">Members</th><th className="px-3 py-2">Pending</th><th className="px-3 py-2">Status</th>
                </tr></thead>
                <tbody>
                  {(overview.data?.clubs ?? []).map((c) => (
                    <tr key={c.club_id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{c.club_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.active_members}</td>
                      <td className="px-3 py-2">{c.pending_requests > 0 ? <span className="font-medium text-amber-600">{c.pending_requests}</span> : "0"}</td>
                      <td className="px-3 py-2"><StatusBadge variant={c.club_status === "active" ? "success" : "info"}>{c.club_status}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "news" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Megaphone className="h-4 w-4 text-primary" /> New Announcement</h3>
            <div className="space-y-3">
              <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" />
              <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Content" className="min-h-[120px]" />
              <Button disabled={!annTitle.trim() || !annContent.trim() || createAnn.isPending} onClick={() => createAnn.mutate()}>
                {createAnn.isPending ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </motion.div>
          <div className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-3 font-semibold text-foreground">Published Announcements</h3>
            {(announcements.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : (
              <div className="space-y-3">
                {announcements.data!.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{fmt(a.published_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><CalendarDays className="h-4 w-4 text-primary" /> New Event</h3>
            <div className="space-y-3">
              <Input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Title" />
              <Input value={evOrg} onChange={(e) => setEvOrg(e.target.value)} placeholder="Organizer" />
              <Input value={evType} onChange={(e) => setEvType(e.target.value)} placeholder="Type (e.g. talk)" />
              <Input value={evLoc} onChange={(e) => setEvLoc(e.target.value)} placeholder="Location" />
              <label className="block text-xs text-muted-foreground">Starts<input type="datetime-local" value={evStart} onChange={(e) => setEvStart(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
              <label className="block text-xs text-muted-foreground">Ends<input type="datetime-local" value={evEnd} onChange={(e) => setEvEnd(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
              {evErr && <p className="text-sm text-red-600">{evErr}</p>}
              <Button disabled={!evTitle.trim() || !evOrg.trim() || !evStart || createEvent.isPending} onClick={() => { setEvErr(null); createEvent.mutate(); }}>
                {createEvent.isPending ? "Creating…" : "Create Event"}
              </Button>
            </div>
          </motion.div>
          <div className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-3 font-semibold text-foreground">Upcoming Events</h3>
            {(dashboard.data?.upcoming_events ?? []).length === 0 ? <p className="text-sm text-muted-foreground">None scheduled.</p> : (
              <div className="space-y-3">
                {dashboard.data!.upcoming_events.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <StatusBadge variant="info">{e.event_type}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{e.organizer_name} · {fmt(e.starts_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 font-semibold text-foreground">Pending Club Join Requests</h3>
          {(overview.data?.join_requests ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : (
            <div className="space-y-3">
              {overview.data!.join_requests.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.student_name} <span className="text-xs text-muted-foreground">({r.student_code})</span></p>
                    <p className="text-xs text-muted-foreground">{r.club_name} · {r.status} · {fmt(r.submitted_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: r.id, decision: "approved" })}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: r.id, decision: "waitlisted" })}>Waitlist</Button>
                    <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: r.id, decision: "rejected" })}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

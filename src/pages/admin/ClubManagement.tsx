import { motion } from "framer-motion";
import { CalendarDays, Search, Trophy, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ClubDialog, type ClubItem } from "@/components/admin/ClubDialog";
import { ClubRequestReviewDialog, type ClubJoinRequestItem } from "@/components/admin/ClubRequestReviewDialog";
import { type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatRelativeDateTime, titleize } from "@/lib/formatters";

interface ClubManagementResponse {
  clubs: ClubItem[];
  join_requests: ClubJoinRequestItem[];
}

function getClubVariant(status: string) {
  if (status === "active" || status === "recruiting" || status === "approved") {
    return "success" as const;
  }

  if (status === "pending" || status === "waitlisted") {
    return "warning" as const;
  }

  return "info" as const;
}

export default function ClubManagement() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const clubsQuery = useQuery({
    queryKey: ["communications", "clubs"],
    queryFn: () => apiGet<ClubManagementResponse>("/communications/clubs/overview"),
  });

  const referenceDataQuery = useQuery({
    queryKey: ["communications", "reference-data"],
    queryFn: () => apiGet<AdminReferenceData>("/communications/reference-data"),
  });

  const filteredClubs = useMemo(
    () =>
      (clubsQuery.data?.clubs ?? []).filter((club) =>
        `${club.club_name} ${club.category_name} ${club.club_code}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [clubsQuery.data?.clubs, search],
  );

  if (clubsQuery.isLoading || referenceDataQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (clubsQuery.isError) {
    return (
      <ErrorState
        description={clubsQuery.error instanceof Error ? clubsQuery.error.message : "Club overview could not be loaded."}
        onRetry={() => void clubsQuery.refetch()}
      />
    );
  }

  if (referenceDataQuery.isError || !referenceDataQuery.data) {
    return (
      <ErrorState
        description={referenceDataQuery.error instanceof Error ? referenceDataQuery.error.message : "Club reference data could not be loaded."}
        onRetry={() => void referenceDataQuery.refetch()}
      />
    );
  }

  const clubs = clubsQuery.data;
  if (!clubs) {
    return <EmptyState title="No club data yet" description="Club directory data will appear here once organizations are configured." />;
  }

  const selectedClub = clubs.clubs.find((club) => club.club_id === selectedClubId) ?? null;
  const selectedRequest = clubs.join_requests.find((request) => request.id === selectedRequestId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Clubs" description="Manage student organizations, approvals, and club activity">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> New Club
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Clubs" value={clubs.clubs.length} subtitle="Across campus" icon={Trophy} variant="primary" />
        <StatCard title="Pending Requests" value={clubs.join_requests.filter((request) => request.status === "pending").length} subtitle="Awaiting review" icon={Users} variant="warning" />
        <StatCard title="Recruiting Clubs" value={clubs.clubs.filter((club) => club.club_status === "recruiting").length} subtitle="Open to new members" icon={CalendarDays} variant="info" />
        <StatCard title="Active Members" value={clubs.clubs.reduce((sum, club) => sum + Number(club.active_members || 0), 0)} subtitle="Across all clubs" icon={UserPlus} variant="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
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
            <EmptyState title="No clubs found" description="Try a different club name or create the first club." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.club_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border p-4 transition-shadow hover:shadow-card-hover"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{club.category_name}</p>
                      <h4 className="mt-1 font-semibold text-foreground">{club.club_name}</h4>
                    </div>
                    <StatusBadge variant={getClubVariant(club.club_status)}>{titleize(club.club_status)}</StatusBadge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Code: {club.club_code}</p>
                    <p>Members: {club.active_members}</p>
                    <p>Join Mode: {titleize(club.join_mode)}</p>
                    <p>Pending Requests: {club.pending_requests}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedClubId(club.club_id)}>
                      Manage Club
                    </Button>
                    <Button className="flex-1" onClick={() => {
                      const nextRequest = clubs.join_requests.find((request) => request.club_id === club.club_id && (request.status === "pending" || request.status === "waitlisted"));
                      if (nextRequest) {
                        setSelectedRequestId(nextRequest.id);
                      }
                    }}>
                      Review Requests
                    </Button>
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
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Latest Join Requests</h3>
          {clubs.join_requests.length === 0 ? (
            <EmptyState title="No join requests yet" description="Incoming club requests will appear here for review." />
          ) : (
            <div className="space-y-3">
              {clubs.join_requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedRequestId(request.id)}
                  className="w-full rounded-lg bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
                >
                  <p className="text-sm font-medium text-foreground">{request.student_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.club_name} - {titleize(request.requested_role)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge variant={getClubVariant(request.status)}>{titleize(request.status)}</StatusBadge>
                    <span className="text-xs text-muted-foreground">{formatRelativeDateTime(request.submitted_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <ClubDialog open={createOpen} onOpenChange={setCreateOpen} referenceData={referenceDataQuery.data} />
      <ClubDialog
        open={Boolean(selectedClub)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClubId(null);
          }
        }}
        referenceData={referenceDataQuery.data}
        club={selectedClub}
      />
      <ClubRequestReviewDialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequestId(null);
          }
        }}
        request={selectedRequest}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState, EmptyState } from "@/components/academic/AcademicShared";
import { staffApi } from "@/lib/api";

export default function StaffBuildingsRoomsPage() {
  const [buildingId, setBuildingId] = useState<number | undefined>();
  const { data: buildings = [], isLoading } = useQuery({ queryKey: ["staff-buildings"], queryFn: staffApi.buildings });
  const { data: rooms = [] } = useQuery({ queryKey: ["staff-rooms", buildingId], queryFn: () => staffApi.rooms(buildingId) });

  return (
    <div className="space-y-6">
      <PageHeader title="Buildings & Rooms" description="Buildings G1, G2, G3 and their classrooms, labs, and auditoriums" />
      {isLoading ? <LoadingState label="Loading buildings..." /> : (
        <select value={buildingId ?? ""} onChange={(event) => setBuildingId(event.target.value ? Number(event.target.value) : undefined)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All buildings</option>
          {buildings.map((building) => <option key={building.id} value={building.id}>{building.code} — {building.name}</option>)}
        </select>
      )}
      {rooms.length === 0 ? <EmptyState label="No rooms found." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="rounded-lg border bg-card p-4 shadow-card">
              <p className="font-semibold">{room.name}</p>
              <p className="text-sm text-muted-foreground">{room.room_type} · Capacity {room.capacity ?? "-"}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

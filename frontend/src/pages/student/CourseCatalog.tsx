import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offeringsApi, coursesApi, registrationsApi, OfferingOut, CourseOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CourseCatalog() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const { data: myRegs = [] } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const registeredOfferingIds = new Set(
    myRegs.filter(r => r.status === "active").map(r => r.offering_id)
  );

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));

  const registerMutation = useMutation({
    mutationFn: (offering_id: number) => registrationsApi.register(offering_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations-me"] });
      queryClient.invalidateQueries({ queryKey: ["offerings", 2] });
      toast({ title: "Registered successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = offerings.filter(o => {
    const course = courseMap[o.course_id];
    const q = search.toLowerCase();
    return !q || course?.name.toLowerCase().includes(q) || course?.code.toLowerCase().includes(q);
  });

  function getStatus(o: OfferingOut) {
    if (o.status === "cancelled") return "Closed";
    if (o.enrolled >= o.capacity) return "Full";
    return "Open";
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading courses…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Course Catalog" description="Browse and register for available courses" />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((o, i) => {
          const course = courseMap[o.course_id];
          const status = getStatus(o);
          const isRegistered = registeredOfferingIds.has(o.id);

          return (
            <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-4 h-4 text-primary" /></div>
                <StatusBadge variant={status === "Open" ? "success" : status === "Full" ? "warning" : "danger"}>{status}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{course?.code ?? `Offering #${o.id}`}</p>
              <h4 className="font-semibold text-foreground mt-1">{course?.name ?? "—"}</h4>
              <p className="text-xs text-muted-foreground mt-2">{course?.credits ?? "?"} credits • {o.enrolled}/{o.capacity} enrolled</p>
              <p className="text-xs text-muted-foreground">{o.schedule ?? "—"} • {o.room ?? "—"}</p>

              {isRegistered ? (
                <Button size="sm" variant="outline" disabled className="w-full mt-4">Already Registered</Button>
              ) : status === "Open" ? (
                <Button
                  size="sm"
                  className="w-full mt-4 gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={() => registerMutation.mutate(o.id)}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering…" : "Register"}
                </Button>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

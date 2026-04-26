import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, offeringsApi, CourseOut, OfferingOut } from "@/lib/api";

export default function CourseManagement() {
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const offeringsByCourse = offerings.reduce<Record<number, OfferingOut[]>>((acc, o) => {
    if (!acc[o.course_id]) acc[o.course_id] = [];
    acc[o.course_id].push(o);
    return acc;
  }, {});

  const filtered = courses.filter((c: CourseOut) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading courses…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Course Management" description="Manage courses and their offerings">
      </PageHeader>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c: CourseOut, i: number) => {
          const courseOfferings = offeringsByCourse[c.id] ?? [];
          const totalEnrolled = courseOfferings.reduce((sum, o) => sum + o.enrolled, 0);
          const totalCapacity = courseOfferings.reduce((sum, o) => sum + o.capacity, 0);
          const isFull = totalCapacity > 0 && totalEnrolled >= totalCapacity;
          const hasOffering = courseOfferings.length > 0;

          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-4 h-4 text-primary" /></div>
                <StatusBadge variant={isFull ? "warning" : hasOffering ? "success" : "info"}>
                  {isFull ? "Full" : hasOffering ? "Active" : "No Offering"}
                </StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
              <h4 className="font-semibold text-foreground mt-1">{c.name}</h4>
              <p className="text-xs text-muted-foreground mt-2">{c.credits} credits • Dept #{c.department_id}</p>
              {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
              {totalCapacity > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min((totalEnrolled / totalCapacity) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{totalEnrolled}/{totalCapacity}</span>
                </div>
              )}
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 bg-card rounded-xl border p-10 text-center shadow-card">
            <p className="text-muted-foreground">No courses found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

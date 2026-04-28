import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, offeringsApi, CourseOut, OfferingOut } from "@/lib/api";

export default function CourseCatalogManagement() {
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
      <PageHeader title="Course Catalog" description="View courses and their offerings for the current semester" />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Course", "Credits", "Offerings", "Enrollment", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c: CourseOut, i: number) => {
                const courseOfferings = offeringsByCourse[c.id] ?? [];
                const totalEnrolled = courseOfferings.reduce((sum, o) => sum + o.enrolled, 0);
                const totalCapacity = courseOfferings.reduce((sum, o) => sum + o.capacity, 0);
                const hasActive = courseOfferings.some(o => o.status === "active");

                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.credits}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{courseOfferings.length}</td>
                    <td className="px-4 py-3">
                      {totalCapacity > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min((totalEnrolled / totalCapacity) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{totalEnrolled}/{totalCapacity}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No offerings</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={hasActive ? "success" : courseOfferings.length === 0 ? "info" : "warning"}>
                        {hasActive ? "Active" : courseOfferings.length === 0 ? "No offering" : "Inactive"}
                      </StatusBadge>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No courses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

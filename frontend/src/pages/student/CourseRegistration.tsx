import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationsApi, offeringsApi, coursesApi, CourseOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CourseRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));
  const offeringMap = Object.fromEntries(offerings.map(o => [o.id, o]));

  const activeRegs = registrations.filter(r => r.status === "active");

  const dropMutation = useMutation({
    mutationFn: (id: number) => registrationsApi.drop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations-me"] });
      queryClient.invalidateQueries({ queryKey: ["offerings", 2] });
      toast({ title: "Course dropped" });
    },
    onError: (err: Error) => {
      toast({ title: "Drop failed", description: err.message, variant: "destructive" });
    },
  });

  const totalCredits = activeRegs.reduce((sum, r) => {
    const offering = offeringMap[r.offering_id];
    const course = offering ? courseMap[offering.course_id] : null;
    return sum + (course?.credits ?? 3);
  }, 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading registrations…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description="Manage your course enrollment for Spring 2025" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Registered Courses</h3>
            {activeRegs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active registrations. Browse the course catalog to register.</p>
            ) : (
              <div className="space-y-3">
                {activeRegs.map((reg, i) => {
                  const offering = offeringMap[reg.offering_id];
                  const course = offering ? courseMap[offering.course_id] : null;
                  return (
                    <motion.div key={reg.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-foreground">{course?.name ?? `Course #${offering?.course_id ?? "?"}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {course?.code ?? `Offering #${reg.offering_id}`} • {course?.credits ?? "?"} cr • {offering?.schedule ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge variant="success">Active</StatusBadge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => dropMutation.mutate(reg.id)}
                          disabled={dropMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3">Workload Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Courses</span>
                <span className="font-semibold text-foreground">{activeRegs.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-semibold text-foreground">{totalCredits}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min((totalCredits / 21) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Max recommended: 21 credits</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-success/5 border border-success/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{activeRegs.length} Course{activeRegs.length !== 1 ? "s" : ""} Active</p>
                <p className="text-xs text-muted-foreground">Your current registrations for this semester.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

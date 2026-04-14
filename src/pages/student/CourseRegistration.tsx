import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

const registered = [
  { code: "CS201", title: "Data Structures", credits: 3, time: "Mon/Wed 09:00" },
  { code: "MATH301", title: "Linear Algebra", credits: 4, time: "Mon/Wed 11:00" },
  { code: "CS250", title: "AI Foundations", credits: 3, time: "Tue/Thu 14:00" },
  { code: "CS220", title: "Database Systems", credits: 3, time: "Tue/Thu 09:00" },
  { code: "ENG101", title: "Technical Writing", credits: 2, time: "Fri 10:00" },
];

export default function CourseRegistration() {
  const totalCredits = registered.reduce((s, c) => s + c.credits, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description="Manage your course enrollment for Spring 2026" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Registered Courses</h3>
            <div className="space-y-3">
              {registered.map((c, i) => (
                <motion.div key={c.code} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.code} • {c.credits} cr • {c.time}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
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
                <span className="font-semibold text-foreground">{registered.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-semibold text-foreground">{totalCredits}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${(totalCredits / 21) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Max recommended: 21 credits</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-success/5 border border-success/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">No Conflicts</p>
                <p className="text-xs text-muted-foreground">Your schedule has no time conflicts.</p>
              </div>
            </div>
          </motion.div>

          <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90">Confirm Registration</Button>
        </div>
      </div>
    </div>
  );
}

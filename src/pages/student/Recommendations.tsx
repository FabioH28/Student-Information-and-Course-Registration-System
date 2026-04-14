import { motion } from "framer-motion";
import { Sparkles, BookOpen, TrendingUp, Shield, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

const recs = [
  { code: "CS301", title: "Machine Learning Intro", credits: 3, reason: "Aligns with your AI Foundations performance and career path interest in AI/ML.", tags: [{ label: "Fits your path", color: "info" as const }, { label: "High demand", color: "warning" as const }], icon: TrendingUp },
  { code: "CS302", title: "Software Engineering", credits: 3, reason: "Recommended prerequisite for your final-year capstone project.", tags: [{ label: "Recommended next", color: "success" as const }], icon: BookOpen },
  { code: "CS303", title: "Computer Networks", credits: 3, reason: "Adds breadth to your curriculum with a balanced weekly workload.", tags: [{ label: "Balanced load", color: "warning" as const }], icon: Clock },
  { code: "MATH310", title: "Probability & Stats II", credits: 3, reason: "Strengthens your math foundation for advanced ML courses next semester.", tags: [{ label: "Foundation", color: "info" as const }, { label: "Challenging", color: "danger" as const }], icon: Shield },
];

export default function Recommendations() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Course Recommendations" description="Personalized suggestions based on your academic profile and goals" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-secondary rounded-2xl p-6 text-secondary-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">AI Analysis Summary</h3>
            <p className="text-secondary-foreground/80 text-sm mt-1">Based on your GPA of 3.72, completed courses, and workload capacity, we recommend 3-4 courses (9-12 credits) to maintain your strong performance while progressing toward graduation.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recs.map((r, i) => (
          <motion.div key={r.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/10"><r.icon className="w-5 h-5 text-accent" /></div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-mono">{r.code} • {r.credits} credits</p>
                <h4 className="font-semibold text-foreground">{r.title}</h4>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{r.reason}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {r.tags.map(t => <StatusBadge key={t.label} variant={t.color}>{t.label}</StatusBadge>)}
            </div>
            <Button size="sm" variant="outline" className="w-full">Add to Registration</Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

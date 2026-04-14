import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, BookOpen, TrendingDown, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function RiskWarning() {
  const riskLevel = "low"; // low | medium | high
  const riskConfig = {
    low: { color: "success" as const, label: "Low Risk", bg: "bg-success/5 border-success/20", icon: ShieldCheck },
    medium: { color: "warning" as const, label: "Medium Risk", bg: "bg-warning/5 border-warning/20", icon: AlertTriangle },
    high: { color: "danger" as const, label: "High Risk", bg: "bg-destructive/5 border-destructive/20", icon: AlertTriangle },
  };
  const config = riskConfig[riskLevel];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Academic Risk Assessment" description="AI-powered analysis of your academic standing" />

      {/* Risk Status */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-6 ${config.bg}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-card shadow-sm">
            <config.icon className={`w-8 h-8 ${riskLevel === "low" ? "text-success" : riskLevel === "medium" ? "text-warning" : "text-destructive"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-foreground">Your Risk Level</h3>
              <StatusBadge variant={config.color}>{config.label}</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">Your academic standing is strong. You're on track with a balanced course load and consistent grades.</p>
          </div>
        </div>
      </motion.div>

      {/* Factors */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Contributing Factors</h3>
        <div className="space-y-3">
          {[
            { label: "GPA Trend", value: "Upward (3.65 → 3.72)", positive: true },
            { label: "Course Load", value: "15 credits — Balanced", positive: true },
            { label: "Failed Courses", value: "None", positive: true },
            { label: "Attendance Rate", value: "94% — Good", positive: true },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-foreground font-medium">{f.label}</span>
              <span className={`text-sm font-medium ${f.positive ? "text-success" : "text-destructive"}`}>{f.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Suggestions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> AI Suggestions</h3>
        <ul className="space-y-2">
          {["Keep your credit load between 15-18 for optimal performance.", "Consider taking Machine Learning next semester to stay on your career path.", "Maintain your current study habits — your consistency is paying off!"].map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

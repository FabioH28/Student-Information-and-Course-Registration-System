import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, registrationsApi, gradesApi } from "@/lib/api";

type RiskLevel = "low" | "medium" | "high";

function computeRisk(gpa: number, status: string, activeCount: number, hasFailedGrade: boolean): RiskLevel {
  if (status === "probation" || status === "suspended" || hasFailedGrade) return "high";
  if (gpa < 2.5 || activeCount === 0) return "high";
  if (gpa < 3.0) return "medium";
  return "low";
}

const riskConfig = {
  low:    { color: "success" as const, label: "Low Risk",    bg: "bg-success/5 border-success/20",       icon: ShieldCheck, iconClass: "text-success" },
  medium: { color: "warning" as const, label: "Medium Risk", bg: "bg-warning/5 border-warning/20",       icon: AlertTriangle, iconClass: "text-warning" },
  high:   { color: "danger"  as const, label: "High Risk",   bg: "bg-destructive/5 border-destructive/20", icon: AlertTriangle, iconClass: "text-destructive" },
};

export default function RiskWarning() {
  const { data: student, isLoading } = useQuery({
    queryKey: ["student-me"],
    queryFn: studentsApi.me,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades-me"],
    queryFn: gradesApi.my,
  });

  if (isLoading || !student) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading…</p></div>;
  }

  const gpa = Number(student.gpa);
  const activeCount = registrations.filter(r => r.status === "active").length;
  const hasFailedGrade = grades.some(g => g.letter_grade === "F" && g.is_published);
  const totalCredits = activeCount * 3;

  const level = computeRisk(gpa, student.status, activeCount, hasFailedGrade);
  const config = riskConfig[level];
  const RiskIcon = config.icon;

  const factors = [
    {
      label: "GPA",
      value: gpa.toFixed(2),
      positive: gpa >= 3.0,
      note: gpa >= 3.0 ? "Good standing" : gpa >= 2.5 ? "Below average" : "At risk",
    },
    {
      label: "Account Status",
      value: student.status.charAt(0).toUpperCase() + student.status.slice(1),
      positive: student.status === "active",
      note: student.status === "active" ? "Active" : "Requires attention",
    },
    {
      label: "Active Courses",
      value: `${activeCount} course${activeCount !== 1 ? "s" : ""} (${totalCredits} credits)`,
      positive: activeCount > 0,
      note: activeCount === 0 ? "Not registered this semester" : totalCredits >= 9 ? "Full-time" : "Part-time",
    },
    {
      label: "Failed Courses",
      value: hasFailedGrade ? "Yes — published grade F" : "None",
      positive: !hasFailedGrade,
      note: hasFailedGrade ? "Requires action" : "Clean record",
    },
    {
      label: "Current Semester",
      value: `Semester ${student.current_semester}`,
      positive: true,
      note: "On track",
    },
  ];

  const suggestions: string[] = [];
  if (gpa < 3.0) suggestions.push("Meet with your academic advisor to discuss GPA improvement strategies.");
  if (activeCount === 0) suggestions.push("Register for courses — an empty semester may delay graduation.");
  if (activeCount > 6) suggestions.push("Consider reducing your course load to avoid burnout.");
  if (hasFailedGrade) suggestions.push("Contact academic staff about retaking failed courses.");
  if (student.status === "probation") suggestions.push("Probation requires a GPA improvement plan — schedule an advising appointment.");
  if (suggestions.length === 0) suggestions.push("Keep up the good work — you're on track for successful graduation.");
  if (gpa >= 3.5) suggestions.push("Consider applying for Dean's List recognition.");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Academic Risk Assessment" description="Your current academic standing based on real data" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-6 ${config.bg}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-card shadow-sm shrink-0">
            <RiskIcon className={`w-8 h-8 ${config.iconClass}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-foreground">Your Risk Level</h3>
              <StatusBadge variant={config.color}>{config.label}</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              {level === "low" && "Your academic standing is strong. Keep maintaining your performance."}
              {level === "medium" && "Your GPA is below 3.0. Consider speaking with your academic advisor."}
              {level === "high" && "Your academic standing requires immediate attention. Please contact academic staff."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">GPA: {gpa.toFixed(2)} · Status: {student.status}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Contributing Factors</h3>
        <div className="space-y-3">
          {factors.map(f => (
            <div key={f.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <span className="text-sm text-foreground font-medium">{f.label}</span>
                <p className="text-xs text-muted-foreground">{f.note}</p>
              </div>
              <span className={`text-sm font-medium ${f.positive ? "text-success" : "text-destructive"}`}>
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Recommendations
        </h3>
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
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

import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, BookOpen, AlertTriangle } from "lucide-react";

const metrics = [
  { title: "Enrollment Growth", value: "+8.3%", desc: "Compared to last semester", icon: TrendingUp, color: "text-success" },
  { title: "Avg GPA (University)", value: "3.24", desc: "Across all departments", icon: Users, color: "text-primary" },
  { title: "Course Fill Rate", value: "87%", desc: "Average capacity utilization", icon: BookOpen, color: "text-info" },
  { title: "At-Risk Rate", value: "1.9%", desc: "Students requiring intervention", icon: AlertTriangle, color: "text-warning" },
];

const deptData = [
  { name: "Computer Science", students: 420, avgGpa: 3.35, riskPct: 2.1 },
  { name: "Mathematics", students: 280, avgGpa: 3.18, riskPct: 3.2 },
  { name: "Data Science", students: 195, avgGpa: 3.42, riskPct: 1.0 },
  { name: "Information Systems", students: 175, avgGpa: 3.28, riskPct: 2.8 },
  { name: "Engineering", students: 177, avgGpa: 3.15, riskPct: 3.4 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" description="Comprehensive academic insights and data">
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{m.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Department Breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Department Performance</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Department", "Students", "Avg GPA", "At-Risk %"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deptData.map(d => (
              <tr key={d.name} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{d.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{d.students}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{d.avgGpa}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={d.riskPct > 3 ? "text-destructive" : d.riskPct > 2 ? "text-warning" : "text-success"}>{d.riskPct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

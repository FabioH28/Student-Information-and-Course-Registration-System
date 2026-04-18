import { motion } from "framer-motion";
import { DollarSign, FileText, ShieldAlert, TrendingUp, Clock, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

const recentPayments = [
  { student: "Alex Johnson", amount: "$1,200.00", type: "Tuition", time: "10 min ago" },
  { student: "Maria Garcia", amount: "$350.00", type: "Lab Fee", time: "1 hour ago" },
  { student: "Emma Davis", amount: "$1,200.00", type: "Tuition", time: "3 hours ago" },
  { student: "Sarah Kim", amount: "$200.00", type: "Dorm Fee", time: "Yesterday" },
];

const pendingHolds = [
  { student: "David Brown", reason: "Unpaid tuition", amount: "$2,400.00", since: "Mar 1, 2026" },
  { student: "James Williams", reason: "Library fine", amount: "$45.00", since: "Apr 5, 2026" },
  { student: "Chris Lee", reason: "Partial payment", amount: "$600.00", since: "Apr 10, 2026" },
];

export default function FinanceDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Finance Dashboard</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2026 — Financial operations overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Collected This Month" value="$148,200" icon={DollarSign} variant="success" trend={{ value: "+12% vs last month", positive: true }} delay={0.05} />
        <StatCard title="Outstanding Invoices" value={34} icon={FileText} variant="warning" delay={0.1} />
        <StatCard title="Active Holds" value={8} subtitle="Blocking registration" icon={ShieldAlert} variant="danger" delay={0.15} />
        <StatCard title="Collection Rate" value="87%" icon={TrendingUp} variant="info" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Payments
            </h3>
            <button onClick={() => navigate("/finance-staff/payments")} className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {recentPayments.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{p.student}</p>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{p.amount}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />{p.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" /> Active Holds
            </h3>
            <button onClick={() => navigate("/finance-staff/holds")} className="text-xs text-primary hover:underline font-medium">Manage holds</button>
          </div>
          <div className="space-y-3">
            {pendingHolds.map((h, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{h.student}</p>
                  <p className="text-xs text-muted-foreground">{h.reason}</p>
                  <p className="text-xs text-muted-foreground">Since {h.since}</p>
                </div>
                <StatusBadge variant="danger">{h.amount}</StatusBadge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

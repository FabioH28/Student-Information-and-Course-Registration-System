import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const initialHolds = [
  { id: "HLD-001", student: "David Brown", studentId: "STU-005", reason: "Unpaid Tuition", amount: "$2,400.00", since: "Mar 1, 2026", effect: "Blocks registration & transcript", status: "Active" },
  { id: "HLD-002", student: "James Williams", studentId: "STU-003", reason: "Library Fine", amount: "$45.00", since: "Apr 5, 2026", effect: "Blocks transcript only", status: "Active" },
  { id: "HLD-003", student: "Chris Lee", studentId: "STU-007", reason: "Partial Tuition", amount: "$600.00", since: "Apr 10, 2026", effect: "Blocks registration", status: "Active" },
  { id: "HLD-004", student: "Anna White", studentId: "STU-008", reason: "Unpaid Lab Fee", amount: "$150.00", since: "Feb 20, 2026", effect: "Blocks transcript", status: "Resolved" },
];

export default function HoldsPage() {
  const [search, setSearch] = useState("");
  const [holds, setHolds] = useState(initialHolds);

  const filtered = holds.filter(h =>
    h.student.toLowerCase().includes(search.toLowerCase()) || h.reason.toLowerCase().includes(search.toLowerCase())
  );

  const release = (id: string) => {
    setHolds(prev => prev.map(h => h.id === id ? { ...h, status: "Resolved" } : h));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Holds" description="Manage holds that restrict student access">
        <div className="flex items-center gap-2">
          <StatusBadge variant="danger">{holds.filter(h => h.status === "Active").length} Active</StatusBadge>
          <StatusBadge variant="success">{holds.filter(h => h.status === "Resolved").length} Resolved</StatusBadge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-bold text-destructive mt-1">$3,045.00</p>
          <p className="text-xs text-muted-foreground mt-1">Across active holds</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Students Affected</p>
          <p className="text-2xl font-bold text-foreground mt-1">{holds.filter(h => h.status === "Active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active holds</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Resolved This Month</p>
          <p className="text-2xl font-bold text-foreground mt-1">{holds.filter(h => h.status === "Resolved").length}</p>
          <StatusBadge variant="success" className="mt-1">Cleared</StatusBadge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search holds..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-card rounded-xl border p-5 shadow-card ${h.status === "Active" ? "border-destructive/30" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${h.status === "Active" ? "bg-destructive/10" : "bg-success/10"}`}>
                  {h.status === "Active"
                    ? <ShieldAlert className="w-5 h-5 text-destructive" />
                    : <ShieldCheck className="w-5 h-5 text-success" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{h.student}</p>
                    <StatusBadge variant={h.status === "Active" ? "danger" : "success"}>{h.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.studentId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm flex-1">
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="font-medium text-foreground">{h.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-destructive">{h.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Since</p>
                  <p className="text-foreground">{h.since}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Effect</p>
                  <p className="text-xs text-muted-foreground">{h.effect}</p>
                </div>
              </div>

              {h.status === "Active" && (
                <Button onClick={() => release(h.id)} size="sm" variant="outline"
                  className="border-success text-success hover:bg-success/10 shrink-0">
                  Release Hold
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const payments = [
  { id: "PAY-001", student: "Alex Johnson", studentId: "STU-001", type: "Tuition", amount: "$1,200.00", date: "Apr 15, 2026", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-002", student: "Maria Garcia", studentId: "STU-004", type: "Lab Fee", amount: "$350.00", date: "Apr 15, 2026", method: "Card", status: "Completed" },
  { id: "PAY-003", student: "Emma Davis", studentId: "STU-006", type: "Tuition", amount: "$1,200.00", date: "Apr 14, 2026", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-004", student: "Sarah Kim", studentId: "STU-002", type: "Dorm Fee", amount: "$200.00", date: "Apr 13, 2026", method: "Card", status: "Completed" },
  { id: "PAY-005", student: "James Williams", studentId: "STU-003", type: "Tuition", amount: "$600.00", date: "Apr 12, 2026", method: "Bank Transfer", status: "Partial" },
  { id: "PAY-006", student: "David Brown", studentId: "STU-005", type: "Tuition", amount: "$0.00", date: "—", method: "—", status: "Overdue" },
];

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const filtered = payments.filter(p =>
    p.student.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const total = payments.filter(p => p.status === "Completed").reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, "")), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Record and track student payments">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-foreground mt-1">${total.toLocaleString()}</p>
          <StatusBadge variant="success" className="mt-2">This Month</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Partial Payments</p>
          <p className="text-2xl font-bold text-foreground mt-1">{payments.filter(p => p.status === "Partial").length}</p>
          <StatusBadge variant="warning" className="mt-2">Needs Follow-up</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-foreground mt-1">{payments.filter(p => p.status === "Overdue").length}</p>
          <StatusBadge variant="danger" className="mt-2">Action Required</StatusBadge>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ID", "Student", "Type", "Amount", "Date", "Method", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.student}</p>
                    <p className="text-xs text-muted-foreground">{p.studentId}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.amount}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={p.status === "Completed" ? "success" : p.status === "Partial" ? "warning" : "danger"}>
                      {p.status}
                    </StatusBadge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

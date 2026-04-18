import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const invoices = [
  { id: "INV-2026-001", student: "Alex Johnson", studentId: "STU-001", description: "Spring 2026 Tuition", amount: "$3,600.00", due: "Apr 1, 2026", paid: "$3,600.00", status: "Paid" },
  { id: "INV-2026-002", student: "Sarah Kim", studentId: "STU-002", description: "Spring 2026 Tuition + Dorm", amount: "$4,800.00", due: "Apr 1, 2026", paid: "$4,800.00", status: "Paid" },
  { id: "INV-2026-003", student: "James Williams", studentId: "STU-003", description: "Spring 2026 Tuition", amount: "$3,600.00", due: "Apr 1, 2026", paid: "$1,200.00", status: "Partial" },
  { id: "INV-2026-004", student: "Maria Garcia", studentId: "STU-004", description: "Spring 2026 Tuition + Lab", amount: "$3,950.00", due: "Apr 1, 2026", paid: "$3,950.00", status: "Paid" },
  { id: "INV-2026-005", student: "David Brown", studentId: "STU-005", description: "Spring 2026 Tuition", amount: "$3,600.00", due: "Apr 1, 2026", paid: "$0.00", status: "Overdue" },
  { id: "INV-2026-006", student: "Emma Davis", studentId: "STU-006", description: "Spring 2026 Tuition", amount: "$3,600.00", due: "May 1, 2026", paid: "$0.00", status: "Pending" },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const filtered = invoices.filter(inv =>
    inv.student.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage student invoices and billing">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Issue Invoice
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Paid", count: invoices.filter(i => i.status === "Paid").length, variant: "success" as const },
          { label: "Partial", count: invoices.filter(i => i.status === "Partial").length, variant: "warning" as const },
          { label: "Overdue", count: invoices.filter(i => i.status === "Overdue").length, variant: "danger" as const },
          { label: "Pending", count: invoices.filter(i => i.status === "Pending").length, variant: "info" as const },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <StatusBadge variant={s.variant} className="mt-1">{s.label}</StatusBadge>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Invoice", "Student", "Description", "Amount", "Paid", "Due Date", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{inv.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{inv.student}</p>
                    <p className="text-xs text-muted-foreground">{inv.studentId}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.description}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{inv.amount}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.paid}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inv.due}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={inv.status === "Paid" ? "success" : inv.status === "Partial" ? "warning" : inv.status === "Overdue" ? "danger" : "info"}>
                      {inv.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
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

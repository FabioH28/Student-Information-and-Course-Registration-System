import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { financeApi, studentsApi } from "@/lib/api";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => financeApi.invoices(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const filtered = invoices.filter(inv => {
    const student = studentMap[inv.student_id];
    const name = student ? `${student.first_name} ${student.last_name}` : "";
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || inv.description.toLowerCase().includes(q) || String(inv.id).includes(q);
  });

  const statusVariant = (s: string) =>
    s === "paid" ? "success" : s === "partial" ? "warning" : s === "overdue" ? "danger" : "info";

  const totals = {
    paid: invoices.filter(i => i.status === "paid").length,
    partial: invoices.filter(i => i.status === "partial").length,
    overdue: invoices.filter(i => i.status === "overdue").length,
    pending: invoices.filter(i => i.status === "pending").length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading invoices…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage student invoices and billing" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["paid", "partial", "overdue", "pending"] as const).map(s => (
          <div key={s} className="bg-card rounded-xl border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{totals[s]}</p>
            <StatusBadge variant={statusVariant(s)} className="mt-1">{s.charAt(0).toUpperCase() + s.slice(1)}</StatusBadge>
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
                {["ID", "Student", "Description", "Amount", "Paid", "Due Date", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv, i) => {
                const student = studentMap[inv.student_id];
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">INV-{inv.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student ? `${student.first_name} ${student.last_name}` : `Student #${inv.student_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.description}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">${Number(inv.amount_paid).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.due_date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={statusVariant(inv.status)}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </StatusBadge>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

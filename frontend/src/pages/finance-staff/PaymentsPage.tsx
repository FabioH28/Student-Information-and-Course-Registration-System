import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => financeApi.payments(),
  });

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return !q || p.method.toLowerCase().includes(q) || String(p.id).includes(q) || String(p.invoice_id).includes(q);
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading payments…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Record and track student payments" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-foreground mt-1">${totalCollected.toFixed(2)}</p>
          <StatusBadge variant="success" className="mt-2">All Time</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold text-foreground mt-1">{payments.length}</p>
          <StatusBadge variant="info" className="mt-2">Recorded</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Invoices Covered</p>
          <p className="text-2xl font-bold text-foreground mt-1">{new Set(payments.map(p => p.invoice_id)).size}</p>
          <StatusBadge variant="success" className="mt-2">Unique</StatusBadge>
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
                {["ID", "Invoice", "Amount", "Method", "Reference", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">PAY-{p.id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">INV-{p.invoice_id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant="info">{p.method.replace("_", " ")}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

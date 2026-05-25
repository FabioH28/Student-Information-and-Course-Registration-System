import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Users, GraduationCap, BookOpen, ReceiptText } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { usersApi, studentsApi, coursesApi, offeringsApi, financeApi } from "@/lib/api";

const ROLE_COLORS: Record<string, string> = {
  student: "#3b82f6",
  teacher: "#8b5cf6",
  instructor: "#8b5cf6",
  staff: "#10b981",
  academic_staff: "#10b981",
  finance_staff: "#f59e0b",
  admin: "#ef4444",
  system_admin: "#ef4444",
};

const ROLE_LABELS: Record<string, string> = {
  student: "Students", teacher: "Instructors", instructor: "Instructors",
  staff: "Academic Staff", academic_staff: "Academic Staff",
  finance_staff: "Finance Staff", admin: "Admins", system_admin: "Admins",
};

export default function AdminAnalytics() {
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => offeringsApi.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ["finance-invoices"], queryFn: () => financeApi.invoices() });

  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const label = ROLE_LABELS[u.role] ?? u.role;
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name, value,
      color: Object.entries(ROLE_LABELS).find(([, l]) => l === name)?.[0] ?? "student",
    }));
  }, [users]);

  const studentStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => { counts[s.status] = (counts[s.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const offeringCapacity = useMemo(() => {
    const sorted = [...offerings].sort((a, b) => (b.enrolled / Math.max(1, b.capacity)) - (a.enrolled / Math.max(1, a.capacity))).slice(0, 10);
    return sorted.map((o, i) => {
      const course = courses.find((c) => c.id === o.course_id);
      return {
        name: course?.code ?? `#${o.id}`,
        Enrolled: o.enrolled,
        Capacity: o.capacity,
        idx: i,
      };
    });
  }, [offerings, courses]);

  const financeStats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.amount || "0"), 0);
    const totalPaid = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || "0"), 0);
    return { totalBilled, totalPaid, collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0 };
  }, [invoices]);

  const avgGpa = students.length ? students.reduce((s, st) => s + parseFloat(st.gpa || "0"), 0) / students.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="System-wide metrics and breakdowns" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Total accounts" value={String(users.length)} />
        <Metric icon={GraduationCap} label="Average GPA" value={avgGpa.toFixed(2)} />
        <Metric icon={BookOpen} label="Active offerings" value={String(offerings.filter((o) => o.status === "active").length)} />
        <Metric icon={ReceiptText} label="Collection rate" value={`${financeStats.collectionRate}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Accounts by role">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(d) => `${d.name}: ${d.value}`} labelLine={false}>
                {roleData.map((d, i) => <Cell key={i} fill={ROLE_COLORS[d.color] ?? "#6b7280"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Student status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={studentStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb33" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Top 10 offerings by enrollment %">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={offeringCapacity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb33" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Enrolled" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Capacity" stackId="a" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Finance summary">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total billed" value={`ALL ${financeStats.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          <Stat label="Total collected" value={`ALL ${financeStats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} tone="success" />
          <Stat label="Outstanding" value={`ALL ${(financeStats.totalBilled - financeStats.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} tone="warning" />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5 shadow-card">
      <h3 className="mb-4 font-semibold text-foreground">{title}</h3>
      {children}
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur"><Icon className="h-5 w-5 text-foreground" /></div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

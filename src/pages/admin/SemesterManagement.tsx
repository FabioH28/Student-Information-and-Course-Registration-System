import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Edit2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AcademicTermDialog } from "@/components/admin/AcademicTermDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, formatDateTime, titleize } from "@/lib/formatters";

interface TermItem {
  id: number;
  code: string;
  name: string;
  academic_year_start: number;
  academic_year_end: number;
  term_number: number;
  status: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  registration_start_at: string;
  registration_end_at: string;
  course_count: number;
  student_count: number;
}

interface TermsResponse {
  items: TermItem[];
}

function getTermVariant(status: string) {
  if (status === "active" || status === "registration") {
    return "success" as const;
  }

  if (status === "planning") {
    return "warning" as const;
  }

  return "default" as const;
}

export default function SemesterManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermItem | null>(null);

  const termsQuery = useQuery({
    queryKey: ["academic", "terms"],
    queryFn: () => apiGet<TermsResponse>("/academic/terms"),
  });

  if (termsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (termsQuery.isError) {
    return (
      <ErrorState
        description={termsQuery.error instanceof Error ? termsQuery.error.message : "Term data could not be loaded."}
        onRetry={() => void termsQuery.refetch()}
      />
    );
  }

  const terms = termsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Semester Management" description="Manage academic terms, registration windows, and the current institutional calendar">
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => {
            setSelectedTerm(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Semester
        </Button>
      </PageHeader>

      {terms.length === 0 ? (
        <EmptyState title="No academic terms yet" description="Create the first academic term to unlock registration and scheduling workflows." />
      ) : (
        <div className="space-y-4">
          {terms.map((term, index) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-foreground">{term.name}</h4>
                      <StatusBadge variant={getTermVariant(term.status)}>{titleize(term.status)}</StatusBadge>
                      {term.is_current ? <StatusBadge variant="info">Current</StatusBadge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {term.code} · AY {term.academic_year_start}/{term.academic_year_end} · Term {term.term_number}
                    </p>
                    <div className="mt-3 grid gap-x-8 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <span>Start: {formatDate(term.start_date)}</span>
                      <span>End: {formatDate(term.end_date)}</span>
                      <span>Reg Start: {formatDateTime(term.registration_start_at)}</span>
                      <span>Reg End: {formatDateTime(term.registration_end_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{term.course_count}</p>
                    <p className="text-xs text-muted-foreground">Offerings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{term.student_count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTerm(term);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AcademicTermDialog open={dialogOpen} onOpenChange={setDialogOpen} term={selectedTerm} />
    </div>
  );
}

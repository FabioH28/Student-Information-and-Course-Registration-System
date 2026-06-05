import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { materialApi, offeringsApi, registrationsApi, coursesApi } from "@/lib/api";
import { DownloadButton, EmptyState, ErrorState, FileTypeBadge, LoadingState, MaterialViewButton, WeekSelector, WeeklyTopicCard } from "@/components/academic/AcademicShared";

export default function CourseMaterialsPage() {
  const [offeringId, setOfferingId] = useState<number | null>(null);
  const [week, setWeek] = useState(1);

  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => offeringsApi.list() });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });

  const activeRegs = registrations.filter((reg) => reg.status === "active");
  const myOfferingIds = new Set(activeRegs.map((reg) => reg.offering_id));
  const myOfferings = offerings.filter((offering) => myOfferingIds.has(offering.id));
  const selectedOffering = myOfferings.find((item) => item.id === offeringId) ?? null;
  const selectedCourse = courses.find((item) => item.id === selectedOffering?.course_id) ?? null;
  const canFetch = Boolean(offeringId && week);

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-week-materials", offeringId, week],
    queryFn: () => materialApi.studentWeek(offeringId!, week),
    enabled: canFetch,
  });

  const heading = useMemo(() => {
    if (!selectedCourse) return `Select a course - Week ${week}`;
    return `${selectedCourse.code} - ${selectedCourse.name} - Week ${week}`;
  }, [selectedCourse, week]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Course Materials" description="Weekly materials organized by topic" />

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Course</span>
            <select value={offeringId ?? ""} onChange={(e) => setOfferingId(e.target.value ? Number(e.target.value) : null)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary">
              <option value="">Select course</option>
              {myOfferings.map((offering) => {
                const course = courses.find((item) => item.id === offering.course_id);
                return <option key={offering.id} value={offering.id}>{course ? `${course.code} - ${course.name}` : `Offering #${offering.id}`}</option>;
              })}
            </select>
          </label>
          <WeekSelector value={week} onChange={setWeek} />
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-card">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{heading}</h3>
            <p className="text-sm text-muted-foreground">{canFetch ? "Visible materials for the selected weekly topic" : "Choose a course and week to load materials"}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-4 p-5">
          {!canFetch ? (
            <EmptyState label="Select a course and week to see materials." />
          ) : isLoading ? (
            <LoadingState label="Loading weekly materials..." />
          ) : error ? (
            <ErrorState message={(error as Error).message.includes("backend") ? "Could not load materials. Please check the backend connection." : (error as Error).message} />
          ) : (
            <>
              <WeeklyTopicCard week={week} topic={data?.topic} />
              {data?.materials.length ? data.materials.map((material) => (
                <article key={material.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{material.title}</h4>
                        <FileTypeBadge material={material} />
                      </div>
                      <p className="text-xs text-muted-foreground">Teacher: {material.teacher_name ?? "Instructor"} · Uploaded {new Date(material.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MaterialViewButton material={material} url={materialApi.viewUrl(material.id)} />
                      {material.material_kind === "file" && <DownloadButton url={materialApi.downloadUrl(material.id)} />}
                    </div>
                  </div>
                </article>
              )) : <EmptyState label={`No materials are visible for Week ${week}.`} />}

            </>
          )}
        </div>
      </section>
    </div>
  );
}

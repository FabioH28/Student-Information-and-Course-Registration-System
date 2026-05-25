import { AlertCircle, Download, Eye, FileArchive, FileImage, FileText, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseMaterialOut, DepartmentOut, FacultyOut, OfferingOut, ProgramOut, CourseOut, WeeklyTopicOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function WeekSelector({ value, onChange }: { value: number; onChange: (week: number) => void }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">Week</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary"
      >
        {Array.from({ length: 14 }, (_, i) => i + 1).map((week) => (
          <option key={week} value={week}>Week {week}</option>
        ))}
      </select>
    </label>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{message}</div>;
}

export function WeeklyTopicCard({ week, topic }: { week: number; topic?: WeeklyTopicOut | null }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">Week {week} Topic</p>
      {topic ? (
        <div className="mt-1 space-y-1">
          <h4 className="font-medium text-foreground">{topic.topic_title}</h4>
          {topic.topic_description && <p className="text-sm text-muted-foreground">{topic.topic_description}</p>}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No topic added for this week yet.</p>
      )}
    </div>
  );
}

export function FileTypeBadge({ material }: { material: CourseMaterialOut }) {
  if (material.material_kind === "link") {
    return <Badge variant="secondary" className="gap-1"><Link2 className="h-3 w-3" />Link</Badge>;
  }
  const name = material.original_file_name?.toLowerCase() ?? "";
  const Icon = name.endsWith(".zip") ? FileArchive : name.match(/\.(jpg|jpeg|png|webp)$/) ? FileImage : FileText;
  const label = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return <Badge variant="outline" className="gap-1"><Icon className="h-3 w-3" />{label}</Badge>;
}

export async function openProtectedFile(url: string, download = false) {
  const openedWindow = download ? null : window.open("", "_blank", "noopener,noreferrer");
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unable to open material" }));
      throw new Error(err.detail ?? "Unable to open material");
    }
    if (res.redirected) {
      if (openedWindow) openedWindow.location.href = res.url;
      else window.open(res.url, "_blank", "noopener,noreferrer");
      return;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    if (download) {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "";
      link.click();
      URL.revokeObjectURL(objectUrl);
    } else if (openedWindow) {
      openedWindow.location.href = objectUrl;
    } else {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    openedWindow?.close();
    throw error;
  }
}

export function ViewButton({ url }: { url: string }) {
  return <Button size="sm" variant="outline" onClick={() => url.includes("/materials/") ? openProtectedFile(url) : window.open(url, "_blank", "noopener,noreferrer")}><Eye className="mr-2 h-4 w-4" />View</Button>;
}

export function MaterialViewButton({ material, url }: { material: CourseMaterialOut; url: string }) {
  const { toast } = useToast();

  async function handleView() {
    try {
      if (material.material_kind === "link") {
        if (!material.external_url || !material.external_url.startsWith("https://")) {
          toast({ title: "Invalid link", description: "This material link is missing or invalid.", variant: "destructive" });
          return;
        }
        window.open(material.external_url, "_blank", "noopener,noreferrer");
        return;
      }
      if (material.material_kind === "video") {
        const url = material.video_url ?? material.external_url;
        if (!url || !url.startsWith("https://")) {
          toast({ title: "Invalid video link", description: "This material video link is missing or invalid.", variant: "destructive" });
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if (material.material_kind === "text") {
        const text = material.text_content ?? "";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        return;
      }
      const filename = material.original_file_name?.toLowerCase() ?? "";
      const mime = material.file_mime_type ?? "";
      const canPreview = mime === "application/pdf" || mime.startsWith("image/") || filename.match(/\.(pdf|jpg|jpeg|png|webp)$/);
      if (!canPreview) {
        const isZip = filename.endsWith(".zip") || mime.includes("zip");
        toast({
          title: "Preview unavailable",
          description: isZip ? "ZIP files cannot be previewed. Please download the file." : "Preview is not available for this file type. Please download the file.",
        });
        return;
      }
      await openProtectedFile(url);
    } catch (error) {
      toast({ title: "Could not open material", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  }

  return <Button size="sm" variant="outline" onClick={handleView}><Eye className="mr-2 h-4 w-4" />View</Button>;
}

export function DownloadButton({ url }: { url: string }) {
  const { toast } = useToast();
  return <Button size="sm" variant="outline" onClick={() => openProtectedFile(url, true).catch((error) => toast({ title: "Download failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }))}><Download className="mr-2 h-4 w-4" />Download</Button>;
}

export function FacultyDegreeYearSelector({
  faculties,
  departments = [],
  programs,
  offerings,
  courses,
  selectedFaculty,
  selectedProgram,
  selectedYear,
  selectedOffering,
  onFacultyChange,
  onProgramChange,
  onYearChange,
  onOfferingChange,
}: {
  faculties: FacultyOut[];
  departments?: DepartmentOut[];
  programs: ProgramOut[];
  offerings: OfferingOut[];
  courses: CourseOut[];
  selectedFaculty: number | null;
  selectedProgram: number | null;
  selectedYear: number;
  selectedOffering: number | null;
  onFacultyChange: (id: number | null) => void;
  onProgramChange: (id: number | null) => void;
  onYearChange: (year: number) => void;
  onOfferingChange: (id: number | null) => void;
}) {
  const courseMap = Object.fromEntries(courses.map((course) => [course.id, course]));
  const selectedDepartmentIds = new Set(departments.filter((department) => department.faculty_id === selectedFaculty).map((department) => department.id));
  if (selectedFaculty && selectedDepartmentIds.size === 0) selectedDepartmentIds.add(selectedFaculty);
  const filteredPrograms = selectedFaculty ? programs.filter((program) => selectedDepartmentIds.has(program.department_id)) : programs;
  const filteredOfferings = offerings.filter((offering) => {
    const course = courseMap[offering.course_id];
    return !selectedFaculty || selectedDepartmentIds.has(course?.department_id ?? 0);
  });

  return (
    <>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground">Faculty</span>
        <select value={selectedFaculty ?? ""} onChange={(e) => onFacultyChange(e.target.value ? Number(e.target.value) : null)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary">
          <option value="">Select faculty</option>
          {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground">Degree / Program</span>
        <select value={selectedProgram ?? ""} onChange={(e) => onProgramChange(e.target.value ? Number(e.target.value) : null)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary" disabled={!selectedFaculty}>
          <option value="">Select program</option>
          {filteredPrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground">Academic Year</span>
        <select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary">
          {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{year <= 3 ? `Bachelor Year ${year}` : `Master Year ${year - 3}`}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground">Course / Subject</span>
        <select value={selectedOffering ?? ""} onChange={(e) => onOfferingChange(e.target.value ? Number(e.target.value) : null)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary" disabled={!selectedFaculty || !selectedProgram}>
          <option value="">Select course</option>
          {filteredOfferings.map((offering) => {
            const course = courseMap[offering.course_id];
            return <option key={offering.id} value={offering.id}>{course ? `${course.code} - ${course.name}` : `Offering #${offering.id}`}</option>;
          })}
        </select>
      </label>
    </>
  );
}

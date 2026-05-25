import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type GpaSeverity = "ok" | "warn" | "critical";

export interface GpaScale {
  scale: 4 | 10;
  warn: number;
  critical: number;
}

export function gpaScale(gpa: number): GpaScale {
  return gpa > 4
    ? { scale: 10, warn: 7, critical: 6 }
    : { scale: 4, warn: 2.5, critical: 2.0 };
}

export function gpaSeverity(gpa: number): GpaSeverity {
  const { warn, critical } = gpaScale(gpa);
  if (gpa < critical) return "critical";
  if (gpa < warn) return "warn";
  return "ok";
}

/** Deduplicate timetable entries by (day, start_time, end_time, course_offering_id, room).
 * The seed sometimes contains multiple rows for the same physical class (one per session in the week);
 * the UI should only render each slot once. */
export function dedupTimetable<T extends {
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  course_offering_id?: number | string | null;
  course_code?: string | null;
  room?: string | null;
}>(entries: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const e of entries) {
    const key = [
      e.day_of_week ?? "",
      e.start_time ?? "",
      e.end_time ?? "",
      e.course_offering_id ?? e.course_code ?? "",
      e.room ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

export function gpaQualitativeLabel(gpa: number): string {
  const { scale } = gpaScale(gpa);
  if (scale === 10) {
    if (gpa >= 9) return "excellent";
    if (gpa >= 8) return "strong";
    if (gpa >= 7) return "solid";
    if (gpa >= 6) return "passing";
    return "below the safe threshold";
  }
  if (gpa >= 3.7) return "excellent";
  if (gpa >= 3.3) return "strong";
  if (gpa >= 3.0) return "solid";
  if (gpa >= 2.0) return "passing";
  return "below the safe threshold";
}

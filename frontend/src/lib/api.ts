const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001").replace(/\/$/, "");

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Could not reach the backend. Please check that the API server is running.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((item: { msg?: string }) => item.msg ?? "Validation error").join(", ")
      : err.detail;
    throw new Error(detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown, auth = true) => request<T>("POST", path, body, auth),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  success?: boolean;
  access_token: string;
  token?: string;
  role: string;
  require_password_change: boolean;
  email: string;
  display_name: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>("/auth/login", { email, password }, false);
}

export function changePassword(current_password: string, new_password: string) {
  return api.post<{ message: string }>("/auth/change-password", { current_password, new_password });
}

export function register(full_name: string, email: string, password: string) {
  return api.post<{ message: string }>("/auth/register", { full_name, email, password }, false);
}

export function verifyEmail(email: string, code: string) {
  return api.post<{ message: string }>("/auth/verify-email", { email, code }, false);
}

export function requestPasswordReset(email: string) {
  return api.post<{ message: string }>("/auth/request-reset", { email }, false);
}

export function confirmPasswordReset(token: string, new_password: string) {
  return api.post<{ message: string }>("/auth/reset-password", { token, new_password }, false);
}

// ── Students ──────────────────────────────────────────────────────────────────
export interface StudentOut {
  id: number;
  user_id: number;
  student_code: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  program_id: number;
  current_semester: number;
  gpa: string;
  status: string;
}

export const studentsApi = {
  me: () => api.get<StudentOut>("/students/me"),
  updateMe: (data: Partial<Pick<StudentOut, "first_name" | "last_name" | "phone" | "date_of_birth">>) =>
    api.put<StudentOut>("/students/me", data),
  list: () => api.get<StudentOut[]>("/students"),
  get: (id: number) => api.get<StudentOut>(`/students/${id}`),
  update: (id: number, data: { program_id?: number; current_semester?: number; status?: string; is_active?: boolean }) =>
    api.put<StudentOut>(`/students/${id}`, data),
};

// ── Courses ───────────────────────────────────────────────────────────────────
export interface CourseOut {
  id: number;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  department_id: number;
  prerequisite_course_id: number | null;
}

export const coursesApi = {
  list: () => api.get<CourseOut[]>("/courses"),
  get: (id: number) => api.get<CourseOut>(`/courses/${id}`),
  create: (data: Omit<CourseOut, "id">) => api.post<CourseOut>("/courses", data),
  update: (id: number, data: Partial<CourseOut>) => api.put<CourseOut>(`/courses/${id}`, data),
  delete: (id: number) => api.delete<void>(`/courses/${id}`),
};

// ── Offerings ─────────────────────────────────────────────────────────────────
export interface OfferingOut {
  id: number;
  course_id: number;
  instructor_id: number;
  semester_id: number;
  room: string | null;
  schedule: string | null;
  capacity: number;
  enrolled: number;
  status: string;
}

export interface CourseScheduleEntry {
  id?: number;
  day_of_week: string;
  timetable_date?: string | null;
  start_time: string;
  end_time: string;
  room: string | null;
  teaching_hours?: number | null;
  group_name?: string | null;
  building_code?: string | null;
  room_id?: number | string | null;
  room_name?: string | null;
  room_type?: string | null;
  classroom_name?: string | null;
  lab_name?: string | null;
  auditorium_name?: string | null;
  display_start_time?: string;
  display_end_time?: string;
  sessions?: TimetableSessionContext[];
}

export interface TimetableSessionContext {
  session_id: number;
  timetable_entry_id: number;
  start_time: string;
  end_time: string;
}

export interface CourseOfferingContext {
  course_offering_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  teacher_name?: string;
  credits: number | null;
  faculty_id: number | null;
  faculty_name: string;
  degree_id: number | null;
  degree_name: string;
  program_id: number | null;
  program_name: string;
  academic_year: string;
  group_id: number;
  group_name: string;
  semester: string | null;
  academic_period: string | null;
  student_count: number;
  student_capacity: number;
  enrollmentPercentage?: number;
  status: string;
  room: string | null;
  schedule: CourseScheduleEntry[];
  schedule_summary: string;
  completedWeeks?: number;
  totalWeeks?: number;
  weekProgressPercentage?: number;
  weeksProgressPercentage?: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface TimetableEntryContext extends CourseOfferingContext {
  timetable_entry_id: number;
  timetable_entry_ids?: number[];
  subject_id?: number;
  subject_code?: string;
  subject_name?: string;
  day_of_week: string;
  day?: string;
  timetable_date: string | null;
  start_time: string;
  end_time: string;
  display_start_time?: string;
  display_end_time?: string;
  date?: string | null;
  teaching_hours?: number | null;
  building_code?: string | null;
  room_name?: string | null;
  room?: string | null;
  classroom_name?: string | null;
  lab_name?: string | null;
  auditorium_name?: string | null;
  sessions?: TimetableSessionContext[];
}

export interface TeacherDashboardOut {
  teacher?: {
    id: number;
    name: string;
  };
  semester?: string | null;
  academic_year?: string | null;
  current_week?: {
    start_date: string;
    end_date: string;
    label: string;
  };
  stats?: {
    active_courses: number;
    total_students: number;
    todays_classes: number;
    next_class: TimetableEntryContext | null;
  };
  teacher_name: string;
  academic_period: string | null;
  active_courses: number;
  total_students: number;
  today_classes: number;
  pending_attendance: number;
  materials_posted: number;
  pending_grades: number;
  courses: CourseOfferingContext[];
  today_timetable: TimetableEntryContext[];
  weekly_timetable: TimetableEntryContext[] | { day_of_week: string; date?: string | null; is_today?: boolean; entries: TimetableEntryContext[] }[];
}

export const offeringsApi = {
  list: (params?: { semester_id?: number; course_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.semester_id) qs.set("semester_id", String(params.semester_id));
    if (params?.course_id) qs.set("course_id", String(params.course_id));
    const query = qs.toString();
    return api.get<OfferingOut[]>(`/offerings${query ? `?${query}` : ""}`);
  },
  my: () => api.get<OfferingOut[]>("/offerings/my"),
  teacherMyCourses: async () => (await api.get<ApiEnvelope<CourseOfferingContext[]>>("/api/teacher/my-courses")).data,
  teacherCourseOffering: async (id: number) => (await api.get<ApiEnvelope<CourseOfferingContext>>(`/api/teacher/course-offerings/${id}`)).data,
  teacherDashboard: async () => (await api.get<ApiEnvelope<TeacherDashboardOut>>("/api/teacher/dashboard")).data,
  teacherTimetable: async () => (await api.get<ApiEnvelope<TimetableEntryContext[]>>("/api/teacher/timetable")).data,
  studentMyCourses: async () => (await api.get<ApiEnvelope<CourseOfferingContext[]>>("/api/student/my-courses")).data,
  studentCourseOffering: async (id: number) => (await api.get<ApiEnvelope<CourseOfferingContext>>(`/api/student/course-offerings/${id}`)).data,
  studentTimetable: async () => (await api.get<ApiEnvelope<TimetableEntryContext[]>>("/api/student/timetable")).data,
  get: (id: number) => api.get<OfferingOut>(`/offerings/${id}`),
  create: (data: Omit<OfferingOut, "id" | "enrolled">) => api.post<OfferingOut>("/offerings", data),
  update: (id: number, data: { room?: string; schedule?: string; capacity?: number; status?: string }) =>
    api.put<OfferingOut>(`/offerings/${id}`, data),
};

// ── Registrations ─────────────────────────────────────────────────────────────
export interface RegistrationOut {
  id: number;
  student_id: number;
  offering_id: number;
  registered_at: string;
  status: string;
  attendance_percentage?: number | null;
}

export const registrationsApi = {
  my: () => api.get<RegistrationOut[]>("/registrations/me"),
  register: (offering_id: number) => api.post<RegistrationOut>("/registrations", { offering_id }),
  drop: (id: number) => api.delete<void>(`/registrations/${id}`),
  list: (params?: { offering_id?: number; student_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.offering_id) qs.set("offering_id", String(params.offering_id));
    if (params?.student_id) qs.set("student_id", String(params.student_id));
    const query = qs.toString();
    return api.get<RegistrationOut[]>(`/registrations${query ? `?${query}` : ""}`);
  },
  updateStatus: (id: number, status: string) =>
    api.put<RegistrationOut>(`/registrations/${id}/status`, { status }),
};

// ── Grades ────────────────────────────────────────────────────────────────────
export interface GradeOut {
  id: number;
  registration_id: number;
  midterm_score: string | null;
  assignment_score: string | null;
  final_score: string | null;
  project_score: string | null;
  quiz_score: string | null;
  final_exam_score: string | null;
  attendance_score: string | null;
  participation_score: string | null;
  lab_work_score: string | null;
  total_score: string | null;
  letter_grade: string | null;
  final_grade: number | null;
  pass_status: string | null;
  exam_blocked_due_to_absence: boolean;
  absence_percentage: string | null;
  can_take_exam: boolean;
  failure_reason: string | null;
  retake_allowed_next_academic_year: boolean;
  feedback: string | null;
  is_published: boolean;
  updated_at: string;
  course_name?: string | null;
  course_code?: string | null;
  student_name?: string | null;
}

export interface GradeComponentConfig {
  key: string;
  label: string;
  points: number;
  selected: boolean;
}

export interface GradeConfigurationOut {
  id: number;
  course_offering_id: number;
  components: GradeComponentConfig[];
  total_points: number;
}

export type GradePayload = Partial<Record<"midterm_score" | "assignment_score" | "project_score" | "quiz_score" | "final_exam_score" | "attendance_score" | "participation_score" | "lab_work_score", number>> & { feedback?: string };

export const gradesApi = {
  my: () => api.get<GradeOut[]>("/grades/me"),
  myCourse: (offering_id: number) => api.get<GradeOut[]>(`/grades/student/courses/${offering_id}`),
  forOffering: (offering_id: number) => api.get<GradeOut[]>(`/grades/offering/${offering_id}`),
  configuration: (offering_id: number) => api.get<GradeConfigurationOut>(`/grades/offering/${offering_id}/configuration`),
  saveConfiguration: (offering_id: number, components: GradeComponentConfig[]) =>
    api.put<GradeConfigurationOut>(`/grades/offering/${offering_id}/configuration`, { components }),
  upsert: (offering_id: number, registration_id: number, data: GradePayload) =>
    api.put<GradeOut>(`/grades/offering/${offering_id}/registration/${registration_id}`, data),
  bulkSave: (offering_id: number, grades: (GradePayload & { registration_id: number })[]) =>
    api.post<{ saved: number }>("/grades/bulk-save", { offering_id, grades }),
  publish: (registration_ids: number[]) =>
    api.post<{ published: number }>("/grades/publish", { registration_ids }),
};

export interface InstructorProfileOut {
  full_name: string;
  role: string;
  email: string;
  title?: string | null;
  faculty?: string | null;
  department?: string | null;
  phone?: string | null;
  office?: string | null;
  account_status?: string | null;
  assigned_courses: { id: number; course_code: string | null; course_name: string | null; academic_year: string | null; semester: string | null; program: string | null; schedule: string | null; room: string | null }[];
}

export const instructorApi = {
  profile: () => api.get<InstructorProfileOut>("/api/instructor/profile"),
};

export interface StudentProgressionOut {
  degree_level: string;
  current_academic_year: string;
  total_passed_credits: number;
  required_for_next_year: number;
  can_progress_to_next_year: boolean;
  graduation_required_credits: number;
  graduation_eligible: boolean;
  message: string;
}

export const progressionApi = {
  me: async () => (await api.get<ApiEnvelope<StudentProgressionOut>>("/api/student/progression")).data,
};

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceSessionOut {
  id: number;
  offering_id: number;
  session_date: string;
  week_number: number | null;
  topic: string | null;
  created_at: string;
}

export interface TeacherAttendanceFilterOut {
  faculties: FacultyOut[];
  programs: (ProgramOut & { faculty_id?: number | null })[];
  academic_years: string[];
  semesters: string[];
  study_levels: string[];
  courses: {
    course_offering_id: number;
    course_id: number;
    course_code: string;
    course_name: string;
    faculty_id: number | null;
    program_id: number | null;
    academic_year: string | null;
    study_level: string | null;
    semester_id: number | null;
    semester: string | null;
  }[];
}

export interface TeacherAttendanceSessionOut {
  id: number;
  timetable_entry_id: number;
  course_offering_id: number;
  course_code: string;
  course_name: string;
  week_number: number | null;
  day_of_week: string;
  timetable_date: string | null;
  start_time: string;
  end_time: string;
  building_code: string | null;
  room_name: string | null;
  room_type: "classroom" | "lab" | "auditorium" | string;
  is_editable: boolean;
  locked_message: string | null;
  timetable_entry_ids?: number[];
  session_count?: number;
  topic_title?: string | null;
}

export interface TeacherAttendanceSessionDetailOut {
  session: TeacherAttendanceSessionOut;
  students: {
    student_id: number;
    student_code: string;
    first_name: string;
    last_name: string;
    attendance_id: number | null;
    status: string | null;
    notes: string | null;
  }[];
}

export interface AttendanceRecordOut {
  id: number;
  student_id: number;
  status: string;
  notes: string | null;
  course_name?: string | null;
  course_code?: string | null;
  session_date?: string | null;
  week_number?: number | null;
  course_offering_id?: number | null;
  attendance_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  building_code?: string | null;
  classroom_name?: string | null;
  lab_name?: string | null;
  auditorium_name?: string | null;
}

export interface ExamEligibilityOut {
  absence_percentage: number;
  can_take_exam: boolean;
  blocked_reason: string | null;
  retake_allowed_next_academic_year: boolean;
}

export const attendanceApi = {
  teacherFilters: () => api.get<TeacherAttendanceFilterOut>("/api/teacher/attendance/filters"),
  teacherSessions: (course_offering_id: number, week_number: number) =>
    api.get<TeacherAttendanceSessionOut[]>(`/api/teacher/attendance/sessions?course_offering_id=${course_offering_id}&week_number=${week_number}`),
  teacherSession: (timetable_entry_id: number) =>
    api.get<TeacherAttendanceSessionDetailOut>(`/api/teacher/attendance/session/${timetable_entry_id}`),
  teacherBulkSave: (timetable_entry_id: number, records: { student_id: number; status: string; notes?: string }[]) =>
    api.post<{ saved: number }>(`/api/teacher/attendance/session/${timetable_entry_id}/bulk-save`, { records }),
  updateTopic: (timetable_entry_id: number, data: { topic_title: string }) =>
    api.patch<TeacherAttendanceSessionOut>(`/api/teacher/attendance/session/${timetable_entry_id}/topic`, data),
  studentGrouped: async () => (await api.get<ApiEnvelope<AttendanceRecordOut[]>>("/api/student/attendance")).data,
  examEligibility: async (offering_id: number) => (await api.get<ApiEnvelope<ExamEligibilityOut>>(`/api/student/course-offerings/${offering_id}/exam-eligibility`)).data,
  sessions: (offering_id: number) => api.get<AttendanceSessionOut[]>(`/attendance/offering/${offering_id}/sessions`),
  createSession: (offering_id: number, data: { session_date: string; week_number?: number; topic?: string }) =>
    api.post<AttendanceSessionOut>(`/attendance/offering/${offering_id}/sessions`, data),
  submit: (session_id: number, records: { student_id: number; status: string; notes?: string }[]) =>
    api.post<{ saved: number }>(`/attendance/sessions/${session_id}/records`, { records }),
  records: (session_id: number) => api.get<AttendanceRecordOut[]>(`/attendance/sessions/${session_id}/records`),
  my: (offering_id?: number) => api.get<AttendanceRecordOut[]>(`/attendance/me${offering_id ? `?offering_id=${offering_id}` : ""}`),
};

// Course materials
export interface CourseMaterialOut {
  id: number;
  offering_id: number;
  teacher_id: number;
  week_number: number;
  title: string;
  description: string | null;
  classwork_description: string | null;
  homework_description: string | null;
  material_kind: "file" | "link" | "video" | "text";
  course_week_topic_id?: number | null;
  external_url: string | null;
  link_url?: string | null;
  video_url?: string | null;
  text_content?: string | null;
  original_file_name: string | null;
  file_mime_type: string | null;
  file_size: number | null;
  status: "draft" | "scheduled" | "published" | "hidden";
  publish_at: string | null;
  published_at: string | null;
  is_visible_to_students: boolean;
  created_at: string;
  updated_at: string;
  course_name?: string | null;
  course_code?: string | null;
  teacher_name?: string | null;
}

export interface TeacherMaterialWeekOut {
  id: number;
  week_id: number;
  week_number: number;
  name: string;
  start_date: string;
  end_date: string;
  semester_id: number;
  academic_year: string | null;
}

export interface TeacherMaterialOverviewOut {
  week: {
    id: number;
    week_id: number;
    week_number: number;
    name: string;
    start_date: string;
    end_date: string;
  };
  days: {
    topic_id: number;
    class_session_id: number;
    course_offering_id: number;
    course_code?: string | null;
    course_name?: string | null;
    date: string;
    session_date: string;
    day: string;
    start_time: string | null;
    end_time: string | null;
    topic_title: string;
    description: string | null;
    materials_count: number;
    session_ids?: number[];
    class_session_ids?: number[];
    session_count?: number;
    materials: CourseMaterialOut[];
  }[];
}

export interface TeacherClassSessionOut {
  id: number;
  class_session_id: number;
  timetable_entry_id?: number | null;
  course_offering_id: number;
  course_id: number;
  week_id: number;
  week_number: number;
  session_date: string;
  date: string;
  day: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  session_order: number;
  topic_title: string | null;
  topic_description: string | null;
  status: "planned" | "started" | "completed" | "cancelled" | string;
  room: string | null;
  room_type: string | null;
  course_code: string | null;
  course_name: string | null;
  materials_count?: number;
  assignments_count?: number;
  students_count?: number;
  session_ids?: number[];
  class_session_ids?: number[];
  timetable_entry_ids?: number[];
  session_count?: number;
}

export interface WeeklyTaskOut {
  id: number;
  offering_id: number;
  teacher_id: number;
  week_number: number;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number | null;
  is_visible_to_students: boolean;
  created_at: string;
  updated_at: string;
  course_name?: string | null;
  course_code?: string | null;
  teacher_name?: string | null;
}

export interface WeekContentOut {
  week_number: number;
  topic: WeeklyTopicOut | null;
  materials: CourseMaterialOut[];
  tasks: WeeklyTaskOut[];
}

export interface FacultyOut {
  id: number;
  name: string;
  code: string;
}

export interface DepartmentOut {
  id: number;
  name: string;
  code: string;
  faculty_id: number | null;
}

export interface ProgramOut {
  id: number;
  name: string;
  code: string;
  department_id: number;
  total_credits: number;
  duration_semesters: number;
}

export const materialApi = {
  getTeacherMaterialFilters: () =>
    api.get<{
      faculties: { id: number; name: string }[];
      programs: { id: number; faculty_id: number | null; name: string }[];
      academic_years: string[];
      semesters: string[];
      study_levels: string[];
      programStudyLevels: { id: string; program_id: number; faculty_id: number | null; study_level: string; label: string }[];
      academicYearSemesters: { id: string; academic_year: string; semester_id: number; semester: string; label: string }[];
      courses: {
        course_offering_id: number;
        teacher_course_assignment_id?: number;
        course_id: number;
        faculty_id: number | null;
        program_id: number | null;
        academic_year: string | null;
        semester_id: number | null;
        semester: string | null;
        study_level: string | null;
        course_code: string | null;
        course_name: string | null;
        label?: string;
      }[];
    }>("/api/teacher/materials/filters"),
  getTeacherMaterialCourses: (params: { faculty_id: number; program_id: number; study_level: string; academic_year: string; semester_id: number }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => qs.set(key, String(value)));
    return api.get<{ teacher_course_assignment_id: number; course_offering_id: number; course_id: number; course_code: string; course_name: string; group_name: string | null; label: string }[]>(`/api/teacher/materials/courses?${qs.toString()}`);
  },
  getTeacherMaterialTerms: (params: { faculty_id: number; program_id: number; study_level: string }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => qs.set(key, String(value)));
    return api.get<{ terms: { academic_year_id: number | null; academic_year_name: string; semester_id: number; semester_name: string; label: string; value: string }[] }>(`/api/teacher/materials/terms?${qs.toString()}`);
  },
  getTeacherMaterialWeeks: (teacher_course_assignment_id: number) =>
    api.get<TeacherMaterialWeekOut[]>(`/api/teacher/materials/weeks?teacher_course_assignment_id=${teacher_course_assignment_id}`),
  getTeacherMaterialOverview: (teacher_course_assignment_id: number, week_id: number) =>
    api.get<TeacherMaterialOverviewOut>(`/api/teacher/materials?teacher_course_assignment_id=${teacher_course_assignment_id}&week_id=${week_id}`),
  getTeacherSessions: (params: { courseId: number; weekId?: number; facultyId?: number; programId?: number; semesterId?: number; date?: string }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) qs.set(key, String(value));
    });
    return api.get<TeacherClassSessionOut[]>(`/api/teacher/sessions?${qs.toString()}`);
  },
  getTodaySessions: () => api.get<TeacherClassSessionOut[]>("/api/teacher/sessions/today"),
  updateSessionTopic: (session_id: number, data: { topic_title?: string; topic_description?: string }) =>
    api.patch<TeacherClassSessionOut>(`/api/teacher/sessions/${session_id}/topic`, data),
  startSession: (session_id: number, data: { topic_title?: string }) => api.patch<TeacherClassSessionOut>(`/api/teacher/sessions/${session_id}/start`, data),
  getTeacherMaterials: (params?: { faculty_id?: number; degree_id?: number; program_id?: number; academic_year?: string; course_id?: number; offering_id?: number; week_number?: number }) => {
    const qs = new URLSearchParams();
    if (params?.faculty_id) qs.set("faculty_id", String(params.faculty_id));
    if (params?.degree_id) qs.set("degree_id", String(params.degree_id));
    if (params?.program_id) qs.set("program_id", String(params.program_id));
    if (params?.academic_year) qs.set("academic_year", params.academic_year);
    if (params?.course_id) qs.set("course_id", String(params.course_id));
    if (params?.offering_id) qs.set("offering_id", String(params.offering_id));
    if (params?.week_number) qs.set("week_number", String(params.week_number));
    const query = qs.toString();
    return api.get<CourseMaterialOut[]>(`/api/teacher/materials${query ? `?${query}` : ""}`);
  },
  teacherList: (params?: { offering_id?: number; week_number?: number }) => materialApi.getTeacherMaterials(params),
  teacherWeek: (offering_id: number, week_number: number) =>
    api.get<WeekContentOut>(`/api/teacher/courses/${offering_id}/weeks/${week_number}/materials`),
  createTeacherMaterial: (data: FormData) => api.post<CourseMaterialOut>("/api/teacher/materials", data),
  createCourseOfferingMaterial: (offering_id: number, data: FormData) =>
    api.post<CourseMaterialOut>(`/api/teacher/course-offerings/${offering_id}/materials`, data),
  create: (data: FormData) => materialApi.createTeacherMaterial(data),
  updateTeacherMaterial: (id: number, data: Partial<CourseMaterialOut> | FormData) => api.put<CourseMaterialOut>(`/api/teacher/materials/${id}`, data),
  update: (id: number, data: Partial<CourseMaterialOut>) => materialApi.updateTeacherMaterial(id, data),
  deleteTeacherMaterial: (id: number) => api.delete<void>(`/api/teacher/materials/${id}`),
  updateTeacherMaterialVisibility: (id: number, data: { visibility_status: "draft" | "published" | "scheduled" | "hidden"; scheduled_publish_at?: string }) =>
    api.patch<CourseMaterialOut>(`/api/teacher/materials/${id}/visibility`, data),
  delete: (id: number) => materialApi.deleteTeacherMaterial(id),
  createTask: (data: { offering_id: number; week_number: number; title: string; description: string; due_date?: string; max_points?: number; is_visible_to_students?: boolean }) =>
    api.post<WeeklyTaskOut>("/api/teacher/tasks", data),
  getTeacherTopic: (offering_id: number, week_number: number) =>
    api.get<WeeklyTopicOut | null>(`/api/teacher/course-offerings/${offering_id}/weeks/${week_number}/topic`),
  saveTeacherTopic: (offering_id: number, week_number: number, data: { topic_title: string; topic_description?: string }) =>
    api.post<WeeklyTopicOut>(`/api/teacher/course-offerings/${offering_id}/weeks/${week_number}/topic`, data),
  getStudentMaterials: () => api.get<CourseMaterialOut[]>("/api/student/materials"),
  studentList: () => materialApi.getStudentMaterials(),
  studentCourse: (offering_id: number) => api.get<CourseMaterialOut[]>(`/api/student/courses/${offering_id}/materials`),
  studentWeek: (offering_id: number, week_number: number) =>
    api.get<WeekContentOut>(`/api/student/courses/${offering_id}/weeks/${week_number}/materials`),
  getStudentTopic: (offering_id: number, week_number: number) =>
    api.get<WeeklyTopicOut | null>(`/api/student/course-offerings/${offering_id}/weeks/${week_number}/topic`),
  viewUrl: (id: number) => `${BASE_URL}/api/materials/${id}/view`,
  downloadUrl: (id: number) => `${BASE_URL}/api/materials/${id}/download`,
};

export interface WeeklyTopicOut {
  id: number;
  course_offering_id: number;
  course_id: number;
  teacher_id: number;
  week_number: number;
  topic_title: string;
  topic_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentOut {
  id: number;
  course_offering_id: number;
  course_id: number;
  teacher_id: number;
  week_number: number;
  weekly_topic_id?: number | null;
  course_week_topic_id?: number | null;
  title: string;
  description: string | null;
  instructions: string | null;
  start_at?: string | null;
  end_at?: string | null;
  due_date: string | null;
  due_time: string | null;
  max_points: number;
  attachment_original_name: string | null;
  attachment_mime_type: string | null;
  attachment_size: number | null;
  status: "draft" | "scheduled" | "published" | "hidden";
  is_visible_to_students: boolean;
  publish_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  course_name?: string | null;
  course_code?: string | null;
  teacher_name?: string | null;
  topic_title?: string | null;
  submissions_count?: number;
  my_submission?: AssignmentSubmissionOut | null;
}

export interface AssignmentSubmissionOut {
  id: number | null;
  assignment_id: number;
  student_id: number;
  submitted_text: string | null;
  submitted_file_original_name: string | null;
  submission_type?: "File" | "Link" | "Text" | null;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  is_published?: boolean;
  student_name?: string | null;
  student_code?: string | null;
  download_url?: string | null;
}

export const assignmentsApi = {
  teacherList: (offering_id: number, week_number?: number, class_session_id?: number) => {
    const qs = new URLSearchParams();
    if (week_number) qs.set("week_number", String(week_number));
    if (class_session_id) qs.set("class_session_id", String(class_session_id));
    const query = qs.toString();
    return api.get<AssignmentOut[]>(`/api/teacher/course-offerings/${offering_id}/assignments${query ? `?${query}` : ""}`);
  },
  create: (offering_id: number, data: FormData) =>
    api.post<AssignmentOut>(`/api/teacher/course-offerings/${offering_id}/assignments`, data),
  update: (id: number, data: Partial<AssignmentOut>) => api.put<AssignmentOut>(`/api/teacher/assignments/${id}`, data),
  delete: (id: number) => api.delete<void>(`/api/teacher/assignments/${id}`),
  submissions: (assignment_id: number) => api.get<AssignmentSubmissionOut[]>(`/api/teacher/assignments/${assignment_id}/submissions`),
  scoreSubmission: (submission_id: number, data: { score?: number; feedback?: string }) =>
    api.patch<AssignmentSubmissionOut>(`/api/teacher/assignment-submissions/${submission_id}`, data),
  scoreStudentSubmission: (assignment_id: number, student_id: number, data: { score?: number; feedback?: string }) =>
    api.patch<AssignmentSubmissionOut>(`/api/teacher/assignments/${assignment_id}/submissions/${student_id}`, data),
  submissionDownloadUrl: (submission_id: number) => `${BASE_URL}/api/teacher/assignment-submissions/${submission_id}/download`,
  submit: (assignment_id: number, data: FormData) =>
    api.post<AssignmentSubmissionOut>(`/api/student/assignments/${assignment_id}/submission`, data),
  studentList: (offering_id: number, week_number?: number) =>
    api.get<AssignmentOut[]>(`/api/student/course-offerings/${offering_id}/assignments${week_number ? `?week_number=${week_number}` : ""}`),
};

export const facultyApi = {
  list: () => api.get<FacultyOut[]>("/api/faculties"),
  departments: () => api.get<DepartmentOut[]>("/courses/departments/list"),
  facultyDepartments: (faculty_id: number) => api.get<DepartmentOut[]>(`/api/faculties/${faculty_id}/departments`),
  programs: () => api.get<ProgramOut[]>("/courses/programs/list"),
  degrees: (faculty_id: number) => api.get<ProgramOut[]>(`/courses/faculties/${faculty_id}/degrees`),
};

export interface StaffOfferingOut {
  id: number;
  course_code: string | null;
  course_name: string | null;
  teacher_name: string | null;
  faculty_name: string | null;
  program_name: string | null;
  academic_year: string | null;
  academic_period: string | null;
  capacity: number;
  enrolled: number;
  enrollment_open: boolean;
  status: string;
}

export interface StaffTimetableOut {
  id: number;
  course_offering_id: number;
  course_code: string | null;
  course_name: string | null;
  building_code: string | null;
  room_name: string | null;
  room_type: string | null;
  timetable_date: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  teaching_hours: number | null;
  is_published: boolean;
}

export interface StaffCourseSelectionOut {
  id: number;
  student_id: number;
  student_name: string | null;
  course_offering_id: number;
  course_code: string | null;
  course_name: string | null;
  status: string;
  reason: string | null;
  selected_at: string;
  approved_at: string | null;
}

export const staffApi = {
  courseOfferings: () => api.get<StaffOfferingOut[]>("/api/staff/course-offerings"),
  timetable: () => api.get<StaffTimetableOut[]>("/api/staff/timetable"),
  courseSelections: () => api.get<StaffCourseSelectionOut[]>("/api/staff/course-selections"),
  approveCourseSelection: (id: number) => api.post<{ success: boolean; selection_id: number; status: string }>(`/api/staff/course-selections/${id}/approve`, {}),
  rejectCourseSelection: (id: number, reason = "Rejected by staff") =>
    api.post<{ success: boolean; selection_id: number; status: string; reason: string }>(`/api/staff/course-selections/${id}/reject?reason=${encodeURIComponent(reason)}`, {}),
  buildings: () => api.get<{ id: number; code: string; name: string }[]>("/api/staff/buildings"),
  rooms: (building_id?: number) => api.get<{ id: number; building_id: number; name: string; room_type: string; capacity: number | null }[]>(`/api/staff/rooms${building_id ? `?building_id=${building_id}` : ""}`),
  facultyPrograms: () => api.get<ProgramOut[]>("/api/staff/faculty-programs"),
};

export interface AvailableSubjectOut {
  course_offering_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  program_id: number;
  academic_year: string | null;
  academic_period: string | null;
  capacity: number;
  enrolled: number;
  credits: number | null;
  can_select: boolean;
  blocked_reason: string | null;
}

export interface CourseSelectionOut {
  id: number;
  course_offering_id: number;
  course_code: string | null;
  course_name: string | null;
  status: string;
  reason: string | null;
  selected_at: string;
  approved_at: string | null;
}

export const courseSelectionApi = {
  available: async () => (await api.get<ApiEnvelope<AvailableSubjectOut[]>>("/api/student/available-subjects")).data,
  mine: async () => (await api.get<ApiEnvelope<CourseSelectionOut[]>>("/api/student/course-selections")).data,
  select: (course_offering_id: number) => api.post<{ success: boolean; message: string; selection_id: number }>("/api/student/course-selections", { course_offering_id }),
  drop: (id: number) => api.delete<{ deleted: boolean }>(`/api/student/course-selections/${id}`),
};

// ── Finance ───────────────────────────────────────────────────────────────────
export interface InvoiceOut {
  id: number;
  student_id: number;
  semester_id: number;
  description: string;
  amount: string;
  amount_paid: string;
  due_date: string;
  status: string;
  issued_at: string;
}

export interface PaymentOut {
  id: number;
  invoice_id: number;
  amount: string;
  method: string;
  reference: string | null;
  paid_at: string;
}

export interface HoldOut {
  id: number;
  student_id: number;
  invoice_id: number | null;
  reason: string;
  effect: string;
  is_active: boolean;
  created_at: string;
}

export const financeApi = {
  myInvoices: () => api.get<InvoiceOut[]>("/finance/invoices/me"),
  invoices: (params?: { student_id?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.student_id) qs.set("student_id", String(params.student_id));
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return api.get<InvoiceOut[]>(`/finance/invoices${query ? `?${query}` : ""}`);
  },
  createInvoice: (data: { student_id: number; semester_id: number; description: string; amount: number; due_date: string }) =>
    api.post<InvoiceOut>("/finance/invoices", data),
  payments: (invoice_id?: number) => {
    const qs = invoice_id ? `?invoice_id=${invoice_id}` : "";
    return api.get<PaymentOut[]>(`/finance/payments${qs}`);
  },
  recordPayment: (data: { invoice_id: number; amount: number; method: string; reference?: string }) =>
    api.post<PaymentOut>("/finance/payments", data),
  holds: (params?: { student_id?: number; active_only?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.student_id) qs.set("student_id", String(params.student_id));
    if (params?.active_only !== undefined) qs.set("active_only", String(params.active_only));
    const query = qs.toString();
    return api.get<HoldOut[]>(`/finance/holds${query ? `?${query}` : ""}`);
  },
  createHold: (data: { student_id: number; invoice_id?: number; reason: string; effect: string }) =>
    api.post<HoldOut>("/finance/holds", data),
  resolveHold: (id: number) => api.put<HoldOut>(`/finance/holds/${id}/resolve`, {}),
};

// ── Notifications & Announcements ─────────────────────────────────────────────
export interface NotificationOut {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AnnouncementOut {
  id: number;
  created_by: number;
  title: string;
  content: string;
  target_role: string | null;
  published_at: string;
}

export const notificationsApi = {
  list: (unread_only = false) => api.get<NotificationOut[]>(`/notifications${unread_only ? "?unread_only=true" : ""}`),
  markRead: (id: number) => api.put<{ ok: boolean }>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.put<{ ok: boolean }>("/notifications/read-all", {}),
  announcements: () => api.get<AnnouncementOut[]>("/announcements"),
  createAnnouncement: (data: { title: string; content: string; target_role?: string }) =>
    api.post<AnnouncementOut>("/announcements", data),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export interface UserOut {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  is_active: boolean;
  is_first_login: boolean;
  display_name: string;
  created_at: string;
}

// ── Semesters ─────────────────────────────────────────────────────────────────
export interface SemesterOut {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  registration_deadline: string;
  drop_deadline: string;
}

export const semestersApi = {
  list: () => api.get<SemesterOut[]>("/semesters"),
  create: (data: Omit<SemesterOut, "id" | "is_active">) =>
    api.post<SemesterOut>("/semesters", data),
  update: (id: number, data: Partial<SemesterOut>) =>
    api.patch<SemesterOut>(`/semesters/${id}`, data),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<UserOut[]>("/users"),
  pending: () => api.get<UserOut[]>("/users/pending"),
  create: (data: { email: string; password: string; role: string }) =>
    api.post<UserOut>("/users", data),
  approve: (id: number, role: string) =>
    api.post<UserOut>(`/users/${id}/approve`, { role }),
  refuse: (id: number, reason?: string) =>
    api.post<{ message: string }>(`/users/${id}/refuse`, { reason }),
  update: (id: number, data: { role?: string; is_active?: boolean }) =>
    api.patch<UserOut>(`/users/${id}`, data),
  resetPassword: (id: number) =>
    api.post<{ message: string }>(`/users/${id}/reset-password`, {}),
};

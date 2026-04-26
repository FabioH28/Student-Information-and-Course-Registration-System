const BASE_URL = "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
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
  access_token: string;
  role: string;
  require_password_change: boolean;
  email: string;
  display_name: string;
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>("/auth/login", { email, password }, false);
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

export const offeringsApi = {
  list: (params?: { semester_id?: number; course_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.semester_id) qs.set("semester_id", String(params.semester_id));
    if (params?.course_id) qs.set("course_id", String(params.course_id));
    const query = qs.toString();
    return api.get<OfferingOut[]>(`/offerings${query ? `?${query}` : ""}`);
  },
  my: () => api.get<OfferingOut[]>("/offerings/my"),
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
  total_score: string | null;
  letter_grade: string | null;
  is_published: boolean;
  updated_at: string;
}

export const gradesApi = {
  my: () => api.get<GradeOut[]>("/grades/me"),
  forOffering: (offering_id: number) => api.get<GradeOut[]>(`/grades/offering/${offering_id}`),
  upsert: (offering_id: number, registration_id: number, data: { midterm_score?: number; assignment_score?: number; final_score?: number }) =>
    api.put<GradeOut>(`/grades/offering/${offering_id}/registration/${registration_id}`, data),
  publish: (registration_ids: number[]) =>
    api.post<{ published: number }>("/grades/publish", { registration_ids }),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceSessionOut {
  id: number;
  offering_id: number;
  session_date: string;
  topic: string | null;
  created_at: string;
}

export const attendanceApi = {
  sessions: (offering_id: number) => api.get<AttendanceSessionOut[]>(`/attendance/offering/${offering_id}/sessions`),
  createSession: (offering_id: number, data: { session_date: string; topic?: string }) =>
    api.post<AttendanceSessionOut>(`/attendance/offering/${offering_id}/sessions`, data),
  submit: (session_id: number, records: { student_id: number; status: string }[]) =>
    api.post<{ saved: number }>(`/attendance/sessions/${session_id}/records`, { records }),
  records: (session_id: number) => api.get<{ student_id: number; status: string }[]>(`/attendance/sessions/${session_id}/records`),
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

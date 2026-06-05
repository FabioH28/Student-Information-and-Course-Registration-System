import "@testing-library/jest-dom/vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentMyCoursesPage from "@/pages/student/StudentMyCoursesPage";
import StudentProfile from "@/pages/student/StudentProfile";

(globalThis as unknown as { React: typeof React }).React = React;

const studentProfile = {
  id: 1,
  user_id: 10,
  student_code: "CIS-2026-001",
  first_name: "Fabio",
  last_name: "Hassan",
  phone: "+355600000001",
  date_of_birth: "2002-05-10",
  program_id: 3,
  degree_level: "Bachelor",
  academic_year: "Bachelor Year 1",
  current_semester: 1,
  gpa: "3.65",
  status: "active",
};

const courses = [
  {
    id: 99,
    course_offering_id: 99,
    course_id: 5,
    course_code: "CIS101",
    course_name: "Introduction to CIS",
    credits: 6,
    teacher_name: "Dr. Ada Lovelace",
    faculty_name: "Faculty of Engineering",
    degree_name: "Computer Information Systems",
    group_name: "A",
    schedule_summary: "Monday 09:00-11:00 A101",
    student_count: 1,
    student_capacity: 35,
    status: "active",
  },
];

const timetable = [
  {
    id: 11,
    timetable_entry_id: 11,
    course_offering_id: 99,
    course_code: "CIS101",
    course_name: "Introduction to CIS",
    day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    start_time: "09:00",
    end_time: "11:00",
    room: "A101",
  },
];

const grades = [
  {
    id: 8,
    registration_id: 1,
    course_code: "CIS101",
    course_name: "Introduction to CIS",
    final_grade: 9,
    pass_status: "passed",
  },
];

const notifications = [
  {
    id: 44,
    user_id: 10,
    title: "New grade published",
    message: "Your CIS101 grade is available.",
    type: "grade",
    is_read: false,
    created_at: "2026-06-05T10:00:00Z",
  },
];

const attendance = [
  { id: 1, status: "present" },
  { id: 2, status: "absent" },
];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 10,
      email: "fabio@student.test",
      role: "student",
      display_name: "Fabio Hassan",
      name: "Fabio Hassan",
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  studentsApi: {
    me: vi.fn(async () => studentProfile),
    updateMe: vi.fn(async () => studentProfile),
  },
  offeringsApi: {
    studentMyCourses: vi.fn(async () => courses),
    studentTimetable: vi.fn(async () => timetable),
  },
  gradesApi: {
    my: vi.fn(async () => grades),
  },
  notificationsApi: {
    list: vi.fn(async () => notifications),
  },
  attendanceApi: {
    studentGrouped: vi.fn(async () => attendance),
  },
  registrationsApi: {
    my: vi.fn(async () => [{ id: 1, status: "active" }]),
  },
  progressionApi: {
    me: vi.fn(async () => ({
      degree_level: "Bachelor",
      current_academic_year: "Bachelor Year 1",
      total_passed_credits: 6,
      required_for_next_year: 31,
      can_progress_to_next_year: false,
      graduation_required_credits: 180,
      graduation_eligible: false,
      message: "Needs 25 more passed credits for the next milestone.",
    })),
  },
}));

function renderStudentPage(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("student access pages", () => {
  it("renders the student dashboard with academic summary data", async () => {
    renderStudentPage(<StudentDashboard />);

    expect(await screen.findByText(/Welcome back, Fabio/i)).toBeInTheDocument();
    expect(await screen.findByText("3.65")).toBeInTheDocument();
    expect(await screen.findByText("Active Courses")).toBeInTheDocument();
    expect(await screen.findByText("New grade published")).toBeInTheDocument();
    expect((await screen.findAllByText("Introduction to CIS")).length).toBeGreaterThan(0);
  });

  it("renders the enrolled student courses page", async () => {
    renderStudentPage(<StudentMyCoursesPage />);

    expect(await screen.findByText("My Courses")).toBeInTheDocument();
    expect(await screen.findByText("Introduction to CIS")).toBeInTheDocument();
    expect(await screen.findByText("CIS101")).toBeInTheDocument();
    expect(await screen.findByText("Dr. Ada Lovelace")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Materials/i })).toBeInTheDocument();
  });

  it("renders the student profile and academic snapshot", async () => {
    renderStudentPage(<StudentProfile />);

    expect(await screen.findByText("Fabio Hassan")).toBeInTheDocument();
    expect((await screen.findAllByText("CIS-2026-001")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("fabio@student.test")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Cumulative GPA")).toBeInTheDocument();
    expect(await screen.findByText("6 / 180")).toBeInTheDocument();
  });
});

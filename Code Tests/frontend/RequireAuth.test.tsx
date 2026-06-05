import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { RequireAuth } from "@/components/RequireAuth";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderProtectedRoute(authState: unknown, allowedRole = "student") {
  mockUseAuth.mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={["/student"]}>
      <Routes>
        <Route element={<RequireAuth allowedRole={allowedRole} />}>
          <Route path="/student" element={<div>Student Area</div>} />
        </Route>
        <Route path="/" element={<LocationProbe />} />
        <Route path="/instructor" element={<LocationProbe />} />
        <Route path="/staff" element={<LocationProbe />} />
        <Route path="/admin" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  it("renders the protected route when the user has the allowed role", () => {
    renderProtectedRoute({
      token: "token",
      user: { role: "student" },
    });

    expect(screen.getByText("Student Area")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute({
      token: null,
      user: null,
    });

    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  it("redirects users with a different role to their home route", () => {
    renderProtectedRoute({
      token: "token",
      user: { role: "teacher" },
    });

    expect(screen.getByTestId("location")).toHaveTextContent("/instructor");
  });

  it("accepts aliases for the allowed role", () => {
    renderProtectedRoute(
      {
        token: "token",
        user: { role: "instructor" },
      },
      "teacher"
    );

    expect(screen.getByText("Student Area")).toBeInTheDocument();
  });
});

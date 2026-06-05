import { describe, expect, it } from "vitest";

import { canonicalRole, homeRouteForRole } from "@/lib/authRoles";

describe("auth role helpers", () => {
  it("canonicalizes supported role aliases", () => {
    expect(canonicalRole("admin")).toBe("system_admin");
    expect(canonicalRole("staff")).toBe("academic_staff");
    expect(canonicalRole("teacher")).toBe("instructor");
    expect(canonicalRole("professor")).toBe("instructor");
  });

  it("keeps already-canonical and unknown roles unchanged", () => {
    expect(canonicalRole("student")).toBe("student");
    expect(canonicalRole("finance_staff")).toBe("finance_staff");
    expect(canonicalRole("guest")).toBe("guest");
  });

  it("returns the correct home route for each known role", () => {
    expect(homeRouteForRole("student")).toBe("/student");
    expect(homeRouteForRole("teacher")).toBe("/instructor");
    expect(homeRouteForRole("staff")).toBe("/staff");
    expect(homeRouteForRole("finance_staff")).toBe("/finance-staff");
    expect(homeRouteForRole("admin")).toBe("/admin");
  });

  it("returns null for roles without a home route", () => {
    expect(homeRouteForRole("guest")).toBeNull();
  });
});

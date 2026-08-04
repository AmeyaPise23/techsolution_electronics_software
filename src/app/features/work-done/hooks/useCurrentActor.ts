// Bridges the app-wide auth user to a module-local Actor (Role + Employee.id).
// In dev, we allow a URL-driven override (?asRole=MANAGER|HR|EMPLOYEE and
// ?asEmployee=<id>) so the same account can preview each role's view — useful
// while wiring up permission gates before real role assignments exist.

import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { snapshot } from "../mock/store";
import { Employee, Role } from "../types";

export interface CurrentActor {
  id: string;
  role: Role;
  employee: Employee;
  isDevOverride: boolean;
}

const OVERRIDE_ROLE_KEY = "wd:devRole";
const OVERRIDE_EMPLOYEE_KEY = "wd:devEmployeeId";

function readOverride(): { role?: Role; employeeId?: string } {
  if (typeof window === "undefined") return {};
  try {
    const url = new URL(window.location.href);
    const roleParam = url.searchParams.get("asRole");
    const empParam = url.searchParams.get("asEmployee");
    if (roleParam) sessionStorage.setItem(OVERRIDE_ROLE_KEY, roleParam);
    if (empParam) sessionStorage.setItem(OVERRIDE_EMPLOYEE_KEY, empParam);
    const role = (sessionStorage.getItem(OVERRIDE_ROLE_KEY) ?? undefined) as Role | undefined;
    const employeeId = sessionStorage.getItem(OVERRIDE_EMPLOYEE_KEY) ?? undefined;
    return { role, employeeId };
  } catch {
    return {};
  }
}

export function setDevOverride(role: Role, employeeId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(OVERRIDE_ROLE_KEY, role);
  sessionStorage.setItem(OVERRIDE_EMPLOYEE_KEY, employeeId);
  // Force reload so useAsync subscribers re-evaluate.
  window.location.reload();
}

export function clearDevOverride(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(OVERRIDE_ROLE_KEY);
  sessionStorage.removeItem(OVERRIDE_EMPLOYEE_KEY);
  window.location.reload();
}

// Default assumption while roles aren't wired to the auth provider: the
// signed-in admin is the seeded Manager (emp-mgr-1). Dev override wins.
export function useCurrentActor(): CurrentActor {
  const { user } = useAuth();
  return useMemo(() => {
    const override = readOverride();
    const employees = snapshot().employees;
    const fallbackEmployee = employees.find((e) => e.role === Role.Manager) ?? employees[0];
    const employee =
      (override.employeeId && employees.find((e) => e.id === override.employeeId)) ||
      fallbackEmployee;
    const role = override.role ?? employee.role;
    return {
      id: employee.id,
      role,
      employee,
      isDevOverride: !!(override.role || override.employeeId),
    };
    // user is included so a login flip re-runs the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);
}

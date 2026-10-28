import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listEmployees } from "../services/employeeService";
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
  window.location.reload();
}

export function clearDevOverride(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(OVERRIDE_ROLE_KEY);
  sessionStorage.removeItem(OVERRIDE_EMPLOYEE_KEY);
  window.location.reload();
}

export function useCurrentActor(): CurrentActor {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => {});
  }, [user?.username]);

  return useMemo(() => {
    const override = readOverride();
    const fallbackEmployee: Employee = employees.find((e) => e.role === Role.Manager) ??
      employees[0] ?? {
        id: "0",
        tenantId: "",
        displayName: user?.username ?? "User",
        email: "",
        role: Role.Employee,
      };
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
  }, [user?.username, employees]);
}

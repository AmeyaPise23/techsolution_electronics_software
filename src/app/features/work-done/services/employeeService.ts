import { Employee, ID, Role } from "../types";
import { wmGet, s } from "./api";

interface BackendEmployee {
  id: number;
  tenantId: number | null;
  displayName: string;
  email: string;
  role: string | null;
  avatarUrl: string | null;
}

function toEmployee(b: BackendEmployee): Employee {
  return {
    id: s(b.id),
    tenantId: s(b.tenantId),
    displayName: b.displayName,
    email: b.email,
    role: (b.role as Role) ?? Role.Employee,
    avatarUrl: b.avatarUrl ?? undefined,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const raw = await wmGet<BackendEmployee[]>("/employees");
  return raw.map(toEmployee);
}

export async function getEmployee(id: ID): Promise<Employee | null> {
  const all = await listEmployees();
  return all.find((e) => e.id === id) ?? null;
}

export async function listEmployeesByRole(role: Role): Promise<Employee[]> {
  const all = await listEmployees();
  return all.filter((e) => e.role === role);
}

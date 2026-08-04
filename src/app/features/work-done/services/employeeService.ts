import { Employee, ID, Role } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot } from "../mock/store";

export async function listEmployees(): Promise<Employee[]> {
  await simulateLatency();
  return snapshot().employees;
}

export async function getEmployee(id: ID): Promise<Employee | null> {
  await simulateLatency();
  return snapshot().employees.find((e) => e.id === id) ?? null;
}

export async function listEmployeesByRole(role: Role): Promise<Employee[]> {
  await simulateLatency();
  return snapshot().employees.filter((e) => e.role === role);
}

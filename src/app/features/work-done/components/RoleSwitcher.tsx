import { useEffect, useState } from "react";
import { useCurrentActor, setDevOverride, clearDevOverride } from "../hooks/useCurrentActor";
import { listEmployees } from "../services/employeeService";
import { Employee, Role } from "../types";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

const ROLE_LABEL: Record<Role, string> = {
  [Role.Manager]: "Manager",
  [Role.HR]: "HR",
  [Role.Employee]: "Employee",
};

export function RoleSwitcher() {
  const actor = useCurrentActor();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs">
      <Badge variant="secondary" className="bg-amber-200 text-amber-900">DEV</Badge>
      <span className="font-medium text-amber-900">Preview as</span>
      <Select
        value={actor.role}
        onValueChange={(v) => {
          const nextRole = v as Role;
          const nextEmp = employees.find((e) => e.role === nextRole) ?? employees[0];
          if (nextEmp) setDevOverride(nextRole, nextEmp.id);
        }}
      >
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.values(Role) as Role[]).map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {ROLE_LABEL[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={actor.id}
        onValueChange={(v) => {
          const emp = employees.find((e) => e.id === v);
          if (emp) setDevOverride(emp.role, emp.id);
        }}
      >
        <SelectTrigger className="h-7 w-48 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {employees
            .filter((e) => e.role === actor.role)
            .map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-xs">
                {e.displayName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {actor.isDevOverride && (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearDevOverride}>
          Reset
        </Button>
      )}
    </div>
  );
}

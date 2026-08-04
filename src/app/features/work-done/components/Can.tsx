import { ReactNode } from "react";
import { Action } from "../permissions";
import { usePermission } from "../hooks/usePermission";

// <Can action="milestone.start"> ...action button... </Can>
// Declarative permission gate — matches the Phase B backend policy 1:1 so the
// UI never asks for something the backend will reject.

interface CanProps {
  action: Action;
  resourceOwnerId?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ action, resourceOwnerId, fallback = null, children }: CanProps) {
  const allowed = usePermission(action, resourceOwnerId);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

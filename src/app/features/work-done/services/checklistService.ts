import { ChecklistItem, ID } from "../types";
import { wmGet, wmPatch, wmPost, s } from "./api";

interface BackendChecklistItem {
  id: number;
  taskId: number;
  text: string;
  checked: boolean;
  checkedByUserId: number | null;
  checkedAt: string | null;
  orderIndex: number;
  createdAt: string;
}

function toChecklistItem(b: BackendChecklistItem): ChecklistItem {
  return {
    id: s(b.id),
    tenantId: "",
    taskId: s(b.taskId),
    text: b.text,
    isChecked: b.checked,
    checkedByEmployeeId: b.checkedByUserId != null ? s(b.checkedByUserId) : undefined,
    checkedAt: b.checkedAt ?? undefined,
    orderIndex: b.orderIndex,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

export async function listChecklist(taskId: ID): Promise<ChecklistItem[]> {
  const raw = await wmGet<BackendChecklistItem[]>(`/tasks/${taskId}/checklist`);
  return raw.map(toChecklistItem).sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function addChecklistItem(taskId: ID, text: string): Promise<ChecklistItem> {
  const raw = await wmPost<BackendChecklistItem>(`/tasks/${taskId}/checklist`, { text });
  return toChecklistItem(raw);
}

export async function toggleChecklistItem(id: ID, _actorId: ID, taskId?: ID): Promise<ChecklistItem> {
  if (!taskId) throw new Error("taskId is required for toggling checklist items");
  const raw = await wmPatch<BackendChecklistItem>(`/tasks/${taskId}/checklist/${id}/toggle`);
  return toChecklistItem(raw);
}

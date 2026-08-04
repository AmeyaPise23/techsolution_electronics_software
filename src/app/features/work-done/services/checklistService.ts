import { ChecklistItem, HistoryEventType, ID } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

export async function listChecklist(taskId: ID): Promise<ChecklistItem[]> {
  await simulateLatency();
  return snapshot()
    .checklistItems.filter((c) => c.taskId === taskId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function addChecklistItem(taskId: ID, text: string): Promise<ChecklistItem> {
  const now = new Date().toISOString();
  const state = snapshot();
  const orderIndex = state.checklistItems.filter((c) => c.taskId === taskId).length;
  const item: ChecklistItem = {
    id: `cli-${Date.now()}`,
    tenantId: "tenant-demo",
    taskId,
    text,
    isChecked: false,
    orderIndex,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.checklistItems.push(item);
  });
  await simulateLatency();
  return item;
}

export async function toggleChecklistItem(id: ID, actorId: ID): Promise<ChecklistItem> {
  const now = new Date().toISOString();
  let updated: ChecklistItem | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.checklistItems.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const prev = draft.checklistItems[idx];
    draft.checklistItems[idx] = {
      ...prev,
      isChecked: !prev.isChecked,
      checkedByEmployeeId: !prev.isChecked ? actorId : undefined,
      checkedAt: !prev.isChecked ? now : undefined,
      updatedAt: now,
    };
    updated = draft.checklistItems[idx];
    const task = draft.tasks.find((t) => t.id === prev.taskId);
    if (task) {
      draft.history.push({
        id: `hst-${Date.now()}`,
        tenantId: "tenant-demo",
        eventType: HistoryEventType.ChecklistItemToggled,
        actorId,
        occurredAt: now,
        projectId: task.projectId,
        taskId: task.id,
      });
    }
  });
  if (!updated) throw new Error(`Checklist item ${id} not found`);
  await simulateLatency();
  return updated;
}

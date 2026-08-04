import { Attachment, HistoryEventType, ID } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

export async function listAttachments(taskId: ID): Promise<Attachment[]> {
  await simulateLatency();
  return snapshot()
    .attachments.filter((a) => a.taskId === taskId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// Attachment storage backend is an open decision (Phase 0 note). Until then,
// the mock service records a stub object-URL so the UI can be built against a
// realistic shape.
export interface UploadAttachmentInput {
  taskId: ID;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByEmployeeId: ID;
}

export async function uploadAttachment(input: UploadAttachmentInput): Promise<Attachment> {
  const now = new Date().toISOString();
  const a: Attachment = {
    id: `att-${Date.now()}`,
    tenantId: "tenant-demo",
    taskId: input.taskId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storageUrl: `stub://attachments/${input.fileName}`,
    uploadedByEmployeeId: input.uploadedByEmployeeId,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.attachments.push(a);
    const task = draft.tasks.find((t) => t.id === input.taskId);
    if (task) {
      draft.history.push({
        id: `hst-${Date.now()}`,
        tenantId: "tenant-demo",
        eventType: HistoryEventType.AttachmentAdded,
        actorId: input.uploadedByEmployeeId,
        occurredAt: now,
        projectId: task.projectId,
        taskId: task.id,
        message: `Uploaded ${input.fileName}`,
      });
    }
  });
  await simulateLatency();
  return a;
}

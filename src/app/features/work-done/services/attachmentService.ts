import { Attachment, ID } from "../types";
import { wmGet, wmPostMultipart, s } from "./api";

interface BackendAttachment {
  id: number;
  taskId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  uploadedByUserId: number | null;
  createdAt: string;
}

function toAttachment(b: BackendAttachment): Attachment {
  return {
    id: s(b.id),
    tenantId: "",
    taskId: s(b.taskId),
    fileName: b.fileName,
    mimeType: b.mimeType,
    sizeBytes: b.sizeBytes,
    storageUrl: b.storageUrl,
    uploadedByEmployeeId: s(b.uploadedByUserId),
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

export async function listAttachments(taskId: ID): Promise<Attachment[]> {
  const raw = await wmGet<BackendAttachment[]>(`/tasks/${taskId}/attachments`);
  return raw.map(toAttachment).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export interface UploadAttachmentInput {
  taskId: ID;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByEmployeeId: ID;
  file: File;
}

export async function uploadAttachment(input: UploadAttachmentInput): Promise<Attachment> {
  const fd = new FormData();
  fd.append("file", input.file);
  const raw = await wmPostMultipart<BackendAttachment>(`/tasks/${input.taskId}/attachments`, fd);
  return toAttachment(raw);
}

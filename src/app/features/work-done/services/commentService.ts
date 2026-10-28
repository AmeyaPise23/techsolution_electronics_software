import { Comment, ID } from "../types";
import { wmGet, wmPost, s } from "./api";

interface BackendComment {
  id: number;
  taskId: number;
  authorUserId: number;
  body: string;
  editedAt: string | null;
  createdAt: string;
}

function toComment(b: BackendComment): Comment {
  return {
    id: s(b.id),
    tenantId: "",
    taskId: s(b.taskId),
    authorId: s(b.authorUserId),
    body: b.body,
    editedAt: b.editedAt ?? undefined,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

export async function listComments(taskId: ID): Promise<Comment[]> {
  const raw = await wmGet<BackendComment[]>(`/tasks/${taskId}/comments`);
  return raw.map(toComment).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export async function addComment(taskId: ID, _authorId: ID, body: string): Promise<Comment> {
  const raw = await wmPost<BackendComment>(`/tasks/${taskId}/comments`, { body });
  return toComment(raw);
}

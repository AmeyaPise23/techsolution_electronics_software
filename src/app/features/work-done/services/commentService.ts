import { Comment, HistoryEventType, ID } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

export async function listComments(taskId: ID): Promise<Comment[]> {
  await simulateLatency();
  return snapshot()
    .comments.filter((c) => c.taskId === taskId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export async function addComment(taskId: ID, authorId: ID, body: string): Promise<Comment> {
  const now = new Date().toISOString();
  const c: Comment = {
    id: `cmt-${Date.now()}`,
    tenantId: "tenant-demo",
    taskId,
    authorId,
    body,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.comments.push(c);
    const task = draft.tasks.find((t) => t.id === taskId);
    if (task) {
      draft.history.push({
        id: `hst-${Date.now()}`,
        tenantId: "tenant-demo",
        eventType: HistoryEventType.CommentAdded,
        actorId: authorId,
        occurredAt: now,
        projectId: task.projectId,
        taskId: task.id,
      });
    }
  });
  await simulateLatency();
  return c;
}
